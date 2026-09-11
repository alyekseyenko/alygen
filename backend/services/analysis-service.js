import { analyzeLead } from './index.js';
import quotaManager from '../quota-manager.js';
import { saveAnalysisToSupabase, getAnalysisFromSupabase, getAllAnalysesMeta } from './supabase-service.js';
import { fetchLeads } from './sheets.js';
import { generateMultiDeviceMockup } from './mockup-service.js';
import { generateEmailTemplate } from './email-template.js';
import { runAutomationsForLead } from './automation-engine.js';

/**
 * Shared service for full lead analysis + automations
 * Used by /api/analyze-lead and the Autopilot Worker
 */
export async function performFullAnalysis(url, leadData = {}, forceReanalyze = false, options = {}, onProgress) {
    const targetPhase = options.phase || 3;
    try {
        if (onProgress) onProgress('Initializing technical audit and competitive context...');
        
        // 1. Fetch leads for competitive analysis
        let allLeads = [];
        try {
            const leadsData = await fetchLeads();
            allLeads = leadsData.leads || [];
        } catch (error) {
            console.log('⚠️ (AnalysisService) Couldn\'t fetch leads for competitive context');
        }

        // 2. Check Cache
        if (!forceReanalyze) {
            const supabaseResult = await getAnalysisFromSupabase(url);
            if (supabaseResult.success) {
                console.log(`💾 (AnalysisService) Cache hit: ${url}`);
                const cachedData = supabaseResult.data;
                const cachedLead = cachedData.leadData || leadData || {};
                
                // Se a cache já contém a fase solicitada ou superior, retornamos
                const cachedPhase = cachedData.audit_phase || 3;
                if (cachedPhase >= targetPhase) {
                    if (onProgress) onProgress('Loading cached technical analysis...');
                    cachedData.emailTemplate = await generateEmailTemplate(cachedData, cachedLead, allLeads);

                    // 🔥 Trigger automations even on cache hit
                    console.log('💾 [Cache Hit] Preparando disparo de automações...');
                    const leadWithId = {
                        ...leadData,
                        id: supabaseResult.data?.[0]?.id || supabaseResult.data?.id
                    };
                    console.log(`📡 Chamando runAutomationsForLead (Cache) para Lead ID: ${leadWithId.id}`);
                    runAutomationsForLead(leadWithId, cachedData).then(() => {
                        console.log('✅ runAutomationsForLead (Cache) concluído.');
                    }).catch(err => 
                        console.error('❌ (AnalysisService) Automation error (Cache):', err.message)
                    );

                    return { success: true, data: cachedData, cached: true };
                }
            }
        }

        // 3. Quota check
        if (!quotaManager.canAnalyze()) {
            throw new Error('Daily quota exceeded');
        }

        console.log(`🔍 (AnalysisService) Analyzing Phase ${targetPhase}: ${url}`);
        const analysis = await analyzeLead(url, leadData, allLeads, options, onProgress);
        
        // 4. Multi-Device Mockup (Desktop + Laptop + iPhone) — Apenas a partir da Fase 2
        if (targetPhase >= 2) {
            try {
                if (onProgress) onProgress('Generating multi-device screenshot and mockups (Desktop, Laptop, Mobile)...');
                const mockup = await generateMultiDeviceMockup(url, leadData.id || 'lead');
                if (mockup.success) {
                    analysis.mockupUrl = `/screenshots/${mockup.filename}`;
                    analysis.mockupPath = mockup.path;
                }
            } catch (error) {
                console.warn('⚠️ (AnalysisService) Multi-Mockup generation failed (non-critical):', error.message);
            }
        }

        // 5. Template & Results — Apenas na Fase 3 (AI/Custom template)
        if (targetPhase === 3) {
            if (onProgress) onProgress('Drafting tailored sales proposal template...');
            const emailTemplate = await generateEmailTemplate(analysis, leadData, allLeads);
            analysis.emailTemplate = emailTemplate;
        }
        analysis.leadData = leadData;

        // 6. Persistence
        if (onProgress) onProgress('Saving audit results to Alygen database...');
        const leadDataWithWebsite = { ...leadData, website: url };
        const supabaseResult = await saveAnalysisToSupabase(leadDataWithWebsite, analysis);

        // 7. Automations — Apenas na Fase 3
        if (targetPhase === 3 && supabaseResult.success) {
            console.log('🔗 Preparando disparo de automações...');
            const leadWithId = {
                ...leadDataWithWebsite,
                id: supabaseResult.data?.[0]?.id || supabaseResult.data?.id
            };
            console.log(`📡 Chamando runAutomationsForLead para Lead ID: ${leadWithId.id}`);
            runAutomationsForLead(leadWithId, analysis).then(() => {
                console.log('✅ runAutomationsForLead concluído.');
            }).catch(err => 
                console.error('❌ (AnalysisService) Automation error:', err.message)
            );
        }

        quotaManager.useQuota();
        return { success: true, data: analysis, cached: false };
        
    } catch (error) {
        console.error('❌ (AnalysisService) Error:', error.message);
        throw error;
    }
}
