import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { toast } from 'sonner';

/**
 * Senior Hook for Lead Management
 * Now with Background Queue Support and Anti-Memory-Leak Cleanup
 */
export function useLeads() {
  const queryClient = useQueryClient();
  const [analyzingProgress, setAnalyzingProgress] = useState({});
  const activeIntervalsRef = useRef(new Set());

  // Cleanup active intervals on component unmount
  useEffect(() => {
    const intervals = activeIntervalsRef.current;
    return () => {
      intervals.forEach(timer => clearInterval(timer));
      intervals.clear();
    };
  }, []);

  // 1. Main Query — leads change rarely, 5min cache is sufficient
  const leadsQuery = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/fetch-leads');
        return data?.data?.leads || data?.data || [];
      } catch (err) {
        console.error('❌ Error fetching leads on frontend:', err.message);
        return [];
      }
    },
    staleTime:                1000 * 60 * 5,   // consider fresh for 5 min
    refetchInterval:          1000 * 60 * 5,   // re-fetch every 5 min
    refetchIntervalInBackground: false,         // stop when tab is hidden
  });

  // 2. Query for Contact Logs (WhatsApp / no-WhatsApp)
  const contactsQuery = useQuery({
    queryKey: ['contacts-log'],
    queryFn: async () => {
      const { data } = await api.get('/contacts-log');
      const waMap  = {};
      const noWaMap = {};
      (data.data || []).forEach(c => {
        if (c.type === 'whatsapp'    && c.website) waMap[c.website]  = true;
        if (c.type === 'no-whatsapp' && c.phone)   noWaMap[c.phone]  = true;
      });
      return { waMap, noWaMap };
    },
    staleTime:                1000 * 60 * 10,  // contacts change rarely
    refetchIntervalInBackground: false,
  });

  // 3. Polling Function to verify Job Status (Senior Improvement)
  const pollJobStatus = async (jobId, leadWebsite) => {
    return new Promise((resolve, reject) => {
      let interval = null;
      let timeoutTimer = null;

      const clearAll = () => {
        if (interval) {
          clearInterval(interval);
          activeIntervalsRef.current.delete(interval);
        }
        if (timeoutTimer) {
          clearTimeout(timeoutTimer);
        }
      };

      interval = setInterval(async () => {
        try {
          const { data } = await api.get(`/analysis-status/${jobId}`);
          
          if (data.status === 'completed') {
            clearAll();
            setAnalyzingProgress(prev => {
              const next = { ...prev };
              delete next[leadWebsite];
              return next;
            });
            queryClient.invalidateQueries(['leads']);
            toast.success(`Analysis completed in background: ${leadWebsite}`);
            resolve(data);
          } else if (data.status === 'failed') {
            clearAll();
            setAnalyzingProgress(prev => {
              const next = { ...prev };
              delete next[leadWebsite];
              return next;
            });
            toast.error(`Analysis failed for ${leadWebsite}: ${data.error}`);
            reject(new Error(data.error));
          } else {
            // Still in queue or processing...
            setAnalyzingProgress(prev => ({
              ...prev,
              [leadWebsite]: data.progressLog || `Queue (Position: ${data.position || '1'})...`
            }));
            console.log(`⏳ Job ${jobId} status: ${data.status} (Position: ${data.position || '?'})`);
          }
        } catch (err) {
          clearAll();
          reject(err);
        }
      }, 3000); // Poll every 3 seconds

      activeIntervalsRef.current.add(interval);
      
      // Safety timeout after 5 minutes
      timeoutTimer = setTimeout(() => {
        clearAll();
        reject(new Error('Background analysis timeout'));
      }, 300000);
    });
  };

  // 4. Mutation to Analyze a Lead (Now via Queue!)
  const analyzeMutation = useMutation({
     Cecil: true,
    mutationFn: async ({ url, leadData, forceReanalyze, phase }) => {
      const { data } = await api.post('/analyze-lead', { url, leadData, forceReanalyze, phase });
      
      // If already in cache, return immediately
      if (data.status === 'completed') return data.data;
      
      // If entered queue, start background polling
      if (data.jobId) {
        toast.info(`Analysis added to queue (Position: ${data.positionInRange})`, {
          description: `Estimated wait: ~${Math.round(data.estimatedWaitMs/1000)}s`
        });
        return pollJobStatus(data.jobId, url);
      }
      
      return data.data;
    },
    onSuccess: (newAnalysis, variables) => {
      // Invalidate to guarantee UI updates when job finishes
      queryClient.invalidateQueries(['leads']);
    }
  });

  return {
    leads: leadsQuery.data || [],
    isLoading: leadsQuery.isLoading,
    isFetching: leadsQuery.isFetching,
    whatsappSentLeads: contactsQuery.data?.waMap || {},
    noWhatsappPhones: contactsQuery.data?.noWaMap || {},
    refetch: leadsQuery.refetch,
    refreshLeads: async () => {
      toast.info('Synchronizing with Google Sheets...');
      try {
        const { data } = await api.get('/fetch-leads?force=true');
        if (data?.data) {
          queryClient.setQueryData(['leads'], data.data.leads || data.data);
          toast.success('CRM Synchronized!');
          return data;
        } else {
          throw new Error('Response empty of data');
        }
      } catch (err) {
        console.error('❌ Error during manual synchronization:', err.message);
        toast.error('Sync failed or server is unavailable');
        return null;
      }
    },
    analyze: analyzeMutation.mutateAsync,
    isAnalyzing: analyzeMutation.isLoading,
    analyzingProgress
  };
}
