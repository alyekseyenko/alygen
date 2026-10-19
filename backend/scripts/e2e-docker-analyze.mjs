/**
 * A→Z pipeline test (Docker backend container):
 *   node scripts/e2e-docker-analyze.mjs [url]
 */
import pg from 'pg';

const url = process.argv[2] || 'https://zeniteclinic.com/';
const base = 'http://localhost:3001/api';
const start = Date.now();

const body = {
  url,
  forceReanalyze: true,
  phase: 3,
  includeIntel: true,
  leadData: {
    name: 'Clínica E2E',
    website: url,
    city: 'Braga',
    type: 'Clínica',
  },
};

const r = await fetch(`${base}/analyze-lead`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const j = await r.json();
console.log('enqueue', r.status, JSON.stringify(j));
if (!r.ok) process.exit(1);

if (j.status === 'completed' && j.data) {
  console.log('sync_complete', j.data?.qScore?.score, Boolean(j.data?.agent_intel));
  process.exit(0);
}

const pollId = j.jobId || j.runId;
if (!pollId) {
  console.error('No jobId/runId');
  process.exit(1);
}

let finalStatus = null;
for (let i = 0; i < 150; i++) {
  await new Promise((x) => setTimeout(x, 5000));
  const s = await fetch(`${base}/analysis-status/${pollId}`);
  const st = await s.json();
  console.log('poll', i, st.status, st.progressLog || '');
  if (st.status === 'completed' || st.status === 'failed') {
    finalStatus = st;
    console.log('done_ms', Date.now() - start, JSON.stringify(st));
    break;
  }
}

const pool = new pg.Pool({
  host: process.env.PGHOST || 'postgres',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'alygen_crm',
});

const q = await pool.query(
  `SELECT qscore, qscore_grade, seo_score, performance_mobile, agent_intel, full_analysis
   FROM lead_analyses WHERE lead_website = $1`,
  [url]
);
const row = q.rows[0];
console.log('db_row', row ? { ...row, full_analysis: '[json]', agent_intel: row.agent_intel?.slice(0, 80) } : null);

let emailOk = false;
let auditPhase = null;
if (row?.full_analysis) {
  try {
    const fa = typeof row.full_analysis === 'string' ? JSON.parse(row.full_analysis) : row.full_analysis;
    emailOk = Boolean(fa.emailTemplate?.html || fa.emailTemplate?.subject);
    auditPhase = fa.audit_phase;
  } catch {
    /* */
  }
}

await pool.end();

if (finalStatus?.status === 'failed') {
  console.error('FAIL: job failed', finalStatus.error);
  process.exit(2);
}
if (!row || Number(row.qscore) <= 0) {
  console.error('FAIL: no qscore');
  process.exit(3);
}
if (!row.agent_intel || row.agent_intel.length < 40) {
  console.warn('WARN: agent_intel missing or short (check GROQ_API_KEY / backend_python)');
}
if (!emailOk) {
  console.warn('WARN: emailTemplate missing in full_analysis');
}

console.log('OK A→Z qscore=', row.qscore, 'intel=', row.agent_intel?.length || 0, 'phase=', auditPhase);
