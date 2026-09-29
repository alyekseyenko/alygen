import crypto from 'crypto';
import db from './local-db-service.js';

export async function createAnalysisRun({
  leadWebsite,
  phase = 3,
  includeIntel = false,
  traceId = null,
}) {
  const id = crypto.randomUUID();
  const trace = traceId || id;
  await db.query(
    `INSERT INTO analysis_runs (id, trace_id, lead_website, status, phase, include_intel, steps)
     VALUES ($1, $2, $3, 'queued', $4, $5, '[]'::jsonb)`,
    [id, trace, leadWebsite, phase, includeIntel ? 1 : 0]
  );
  return { id, traceId: trace };
}

export async function appendRunStep(runId, stepName, status, detail = {}) {
  if (!runId) return;
  const row = {
    step: stepName,
    status,
    at: new Date().toISOString(),
    ...detail,
  };
  try {
    await db.query(
      `UPDATE analysis_runs
       SET steps = COALESCE(steps, '[]'::jsonb) || $2::jsonb,
           status = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [runId, JSON.stringify([row]), status === 'failed' ? 'failed' : 'running']
    );
  } catch (err) {
    console.warn('⚠️ analysis_runs step:', err.message);
  }
}

export async function finishAnalysisRun(runId, status = 'completed', error = null) {
  if (!runId) return;
  await db.query(
    `UPDATE analysis_runs SET status = $2, error = $3, updated_at = NOW() WHERE id = $1`,
    [runId, status, error]
  );
}

export async function getAnalysisRun(runId) {
  const res = await db.query(`SELECT * FROM analysis_runs WHERE id = $1 OR trace_id = $1`, [runId]);
  const row = res.rows?.[0];
  if (!row) return { success: false, error: 'not_found' };
  let steps = row.steps;
  if (typeof steps === 'string') {
    try {
      steps = JSON.parse(steps);
    } catch {
      steps = [];
    }
  }
  return {
    success: true,
    run: {
      id: row.id,
      traceId: row.trace_id,
      leadWebsite: row.lead_website,
      status: row.status,
      phase: row.phase,
      includeIntel: row.include_intel === 1,
      steps: steps || [],
      error: row.error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}
