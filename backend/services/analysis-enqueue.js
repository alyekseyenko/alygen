import crypto from 'crypto';
import { enqueueAudit, getJobQueue } from './job-queue.js';
import { createAnalysisRun } from './analysis-runs-service.js';

/**
 * Prefer pg-boss audit queue; fall back to legacy JSON file queue.
 */
export async function enqueueLeadAnalysis(url, leadData = {}, forceReanalyze = false, options = {}) {
  const payload = { ...leadData, website: url };
  const includeIntel = options.includeIntel !== false;
  let run = { id: null, traceId: null };
  try {
    run = await createAnalysisRun({
      leadWebsite: url,
      phase: options.phase ?? 3,
      includeIntel,
    });
  } catch (err) {
    console.warn('⚠️ analysis_runs indisponível (aplicar migrações?):', err.message);
    run = { id: crypto.randomUUID(), traceId: null };
  }

  const jobOptions = {
    ...options,
    includeIntel,
    runId: run.id,
    traceId: run.traceId,
  };

  const boss = getJobQueue();
  if (boss) {
    try {
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
    } catch (err) {
      console.warn('⚠️ pg-boss enqueue falhou, a usar fila local:', err.message);
    }
  }

  const { default: analysisQueue } = await import('../analysis-queue.js');
  try {
    const job = analysisQueue.add(payload, forceReanalyze, jobOptions);
    return { ...job, runId: run.id, traceId: run.traceId, backend: 'file-queue' };
  } catch (err) {
    console.error('❌ Fila local falhou:', err.message);
    throw err;
  }
}
