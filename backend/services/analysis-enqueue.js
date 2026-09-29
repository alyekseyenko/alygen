import { enqueueAudit, getJobQueue } from './job-queue.js';
import { createAnalysisRun } from './analysis-runs-service.js';

/**
 * Prefer pg-boss audit queue; fall back to legacy JSON file queue.
 */
export async function enqueueLeadAnalysis(url, leadData = {}, forceReanalyze = false, options = {}) {
  const payload = { ...leadData, website: url };
  const includeIntel = Boolean(options.includeIntel);
  const run = await createAnalysisRun({
    leadWebsite: url,
    phase: options.phase ?? 3,
    includeIntel,
  });

  const jobOptions = {
    ...options,
    includeIntel,
    runId: run.id,
    traceId: run.traceId,
  };

  const boss = getJobQueue();
  if (boss) {
    const jobId = await enqueueAudit({
      url,
      leadData: payload,
      forceReanalyze,
      phase: options.phase ?? 3,
      includeIntel,
      runId: run.id,
      traceId: run.traceId,
    });
    if (jobId) {
      return {
        id: jobId,
        runId: run.id,
        traceId: run.traceId,
        status: 'queued',
        backend: 'pg-boss',
        position: 1,
      };
    }
  }

  const { default: analysisQueue } = await import('../analysis-queue.js');
  const job = analysisQueue.add(payload, forceReanalyze, jobOptions);
  return { ...job, runId: run.id, traceId: run.traceId, backend: 'file-queue' };
}
