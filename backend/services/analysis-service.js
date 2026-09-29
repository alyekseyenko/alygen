import { analyzeLead } from './index.js';
import quotaManager from '../quota-manager.js';
import {
  saveAnalysis,
  getAnalysisByWebsite,
  getCompetitiveLeadsMeta,
} from './crm-data-service.js';
import { generateMultiDeviceMockup } from './mockup-service.js';
import { generateEmailTemplate } from './email-template.js';
import { runAutomationsForLead } from './automation-engine.js';
import { computeAuditDiff } from './audit-diff.js';
import {
  createAnalysisRun,
  appendRunStep,
  finishAnalysisRun,
} from './analysis-runs-service.js';
import { runMarketIntelAfterAudit } from './market-intel-post-audit.js';
import { enqueueAudit, getJobQueue } from './job-queue.js';

/**
 * Shared service for full lead analysis + automations
 */
export async function performFullAnalysis(
  url,
  leadData = {},
  forceReanalyze = false,
  options = {},
  onProgress
) {
  const targetPhase = options.phase || 3;
  const includeIntel = Boolean(options.includeIntel);
  let runId = options.runId;
  let traceId = options.traceId;

  if (!runId) {
    const run = await createAnalysisRun({
      leadWebsite: url,
      phase: targetPhase,
      includeIntel,
      traceId,
    });
    runId = run.id;
    traceId = run.traceId;
  }

  try {
    if (onProgress) onProgress('Initializing technical audit...');
    await appendRunStep(runId, 'init', 'running');

    let allLeads = await getCompetitiveLeadsMeta(
      leadData.city || leadData.lead_city,
      leadData.sector || leadData.type || leadData.lead_type,
      url,
      80
    );

    let previousAnalysis = null;
    if (!forceReanalyze) {
      const cached = await getAnalysisByWebsite(url);
      if (cached.success) {
        const cachedPhase = cached.data?.audit_phase || 3;
        if (cachedPhase >= targetPhase && !includeIntel) {
          if (onProgress) onProgress('Loading cached analysis...');
          cached.data.emailTemplate = await generateEmailTemplate(cached.data, leadData, allLeads);
          const leadWithId = {
            ...leadData,
            id: cached.raw?.id,
            website: url,
          };
          if (targetPhase === 3) {
            runAutomationsForLead(leadWithId, cached.data).catch((err) =>
              console.error('❌ Automation error (cache):', err.message)
            );
          }
          await finishAnalysisRun(runId, 'completed');
          return { success: true, data: cached.data, cached: true, runId, traceId };
        }
        previousAnalysis = cached.data;
      }
    }

    if (!quotaManager.canAnalyze()) {
      throw new Error('Daily quota exceeded');
    }

    await appendRunStep(runId, 'audit', 'running');
    const analysis = await analyzeLead(url, leadData, allLeads, { ...options, runId, traceId }, onProgress);
    await appendRunStep(runId, 'audit', 'completed');

    if (targetPhase >= 2) {
      try {
        if (onProgress) onProgress('Generating mockups...');
        const mockup = await generateMultiDeviceMockup(url, leadData.id || 'lead');
        if (mockup.success) {
          analysis.mockupUrl = `/screenshots/${mockup.filename}`;
          analysis.mockupPath = mockup.path;
        }
      } catch (error) {
        console.warn('⚠️ Mockup failed:', error.message);
      }
    }

    const diff = computeAuditDiff(previousAnalysis, analysis);
    if (diff) analysis.auditDiff = diff;

    if (analysis.dataQuality?.pageSpeed === 'missing' || analysis.pageSpeedFailed) {
      await appendRunStep(runId, 'pagespeed_retry', 'scheduled');
      const boss = getJobQueue();
      if (boss) {
        await enqueueAudit({
          url,
          leadData: { ...leadData, website: url },
          forceReanalyze: true,
          phase: targetPhase,
          rescoreOnly: true,
          parentRunId: runId,
        });
      }
    }

    analysis.leadData = leadData;
    analysis.traceId = traceId;
    analysis.runId = runId;

    await appendRunStep(runId, 'save', 'running');
    const saveResult = await saveAnalysis({ ...leadData, website: url }, analysis);
    await appendRunStep(runId, 'save', saveResult.success ? 'completed' : 'failed');

    let finalAnalysis = analysis;

    if (includeIntel && saveResult.success) {
      const intelResult = await runMarketIntelAfterAudit({
        url,
        leadData,
        analysis,
        savedRow: saveResult.raw || saveResult.data,
        traceId,
        runId,
        allLeads,
      });
      if (intelResult.success) {
        finalAnalysis = intelResult.analysis;
        finalAnalysis.emailTemplate = intelResult.emailTemplate;
      }
    } else if (targetPhase === 3) {
      finalAnalysis.emailTemplate = await generateEmailTemplate(finalAnalysis, leadData, allLeads);
      await appendRunStep(runId, 'email_template', 'completed');
    }

    if (targetPhase === 3 && saveResult.success) {
      const leadWithId = {
        ...leadData,
        website: url,
        id: saveResult.data?.id || saveResult.raw?.id,
      };
      runAutomationsForLead(leadWithId, finalAnalysis).catch((err) =>
        console.error('❌ Automation error:', err.message)
      );
      await appendRunStep(runId, 'automations', 'triggered');
    }

    quotaManager.useQuota();
    await finishAnalysisRun(runId, 'completed');
    return { success: true, data: finalAnalysis, cached: false, runId, traceId };
  } catch (error) {
    await finishAnalysisRun(runId, 'failed', error.message);
    console.error('❌ (AnalysisService) Error:', error.message);
    throw error;
  }
}
