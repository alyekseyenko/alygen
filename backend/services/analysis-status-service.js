const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function lastStepProgress(steps) {
  if (!Array.isArray(steps) || steps.length === 0) return null;
  const last = steps[steps.length - 1];
  return last?.step || last?.status || null;
}

function mapRunStatus(status) {
  if (status === 'queued') return 'pending';
  if (status === 'running') return 'processing';
  return status;
}

function mapBossState(state) {
  if (state === 'completed') return 'completed';
  if (state === 'failed' || state === 'cancelled') return 'failed';
  if (state === 'active') return 'processing';
  return 'pending';
}

async function statusFromAnalysisRun(id) {
  const { getAnalysisRun } = await import('./analysis-runs-service.js');
  const result = await getAnalysisRun(id);
  if (!result.success) return null;
  const run = result.run;
  return {
    id,
    runId: run.id,
    leadWebsite: run.leadWebsite,
    status: mapRunStatus(run.status),
    progressLog: lastStepProgress(run.steps) || run.status,
    error: run.error || null,
    position: run.status === 'queued' ? 1 : undefined,
  };
}

async function statusFromPgBoss(id) {
  const { getJobQueue } = await import('./job-queue.js');
  const boss = getJobQueue();
  if (!boss) return null;

  for (const queueName of ['audit', 'market-intel']) {
    let job;
    try {
      job = await boss.getJobById(queueName, id, { includeArchive: true });
    } catch {
      continue;
    }
    if (!job) continue;

    const runId = job.data?.runId;
    if (runId) {
      const fromRun = await statusFromAnalysisRun(runId);
      if (fromRun && (fromRun.status === 'completed' || fromRun.status === 'failed')) {
        return { ...fromRun, id };
      }
    }

    const output = job.output && typeof job.output === 'object' ? job.output : null;
    const error =
      (typeof job.output === 'string' ? job.output : null) ||
      output?.error ||
      output?.message ||
      null;

    let mapped = mapBossState(job.state);
    if (mapped === 'completed' && output && output.success === false) {
      mapped = 'failed';
    }

    let progressLog =
      mapped === 'processing' ? 'A processar auditoria...' : 'Na fila (pg-boss)';
    if (runId) {
      const fromRun = await statusFromAnalysisRun(runId);
      if (fromRun?.progressLog) progressLog = fromRun.progressLog;
    }

    return {
      id,
      runId: runId || undefined,
      status: mapped,
      progressLog,
      error: mapped === 'failed' ? error || 'Auditoria falhou' : error,
      position: mapped === 'pending' ? 1 : undefined,
    };
  }
  return null;
}

/**
 * Resolve job status for legacy file queue, pg-boss UUID, or analysis_runs id.
 */
export async function resolveAnalysisJobStatus(id) {
  if (!id) return null;

  const { default: analysisQueue } = await import('../analysis-queue.js');
  const asNumber = Number(id);
  if (!Number.isNaN(asNumber) && String(asNumber) === String(id)) {
    const fileStatus = analysisQueue.getStatus(asNumber);
    if (fileStatus) {
      return {
        ...fileStatus,
        status: fileStatus.status === 'pending' ? 'pending' : fileStatus.status,
      };
    }
  }

  if (UUID_RE.test(String(id))) {
    const fromBoss = await statusFromPgBoss(String(id));
    if (fromBoss) return fromBoss;
    return statusFromAnalysisRun(String(id));
  }

  return null;
}
