import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';

/**
 * useSequences — Single Source of Truth for email sequences
 *
 * Replaces the two independent setIntervals in NotificationBell.jsx
 * and Dashboard.jsx that were causing duplicate requests every 60s.
 *
 * TanStack Query deduplicates: if multiple components call this hook
 * with the same queryKey, only ONE network request fires.
 */
export function useSequences({ refetchInterval = 60_000 } = {}) {
  return useQuery({
    queryKey: ['sequences'],
    queryFn: async () => {
      const { data } = await api.get('/sequences', { params: { filter: 'all' } });
      return data?.data || [];
    },
    staleTime:      1000 * 30,   // consider fresh for 30s
    refetchInterval,             // default: poll every 60s (not 30s)
    refetchIntervalInBackground: false, // pause when tab is hidden
  });
}
