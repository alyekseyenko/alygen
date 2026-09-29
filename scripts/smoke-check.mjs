#!/usr/bin/env node
/**
 * Smoke check: Node health, optional Python health, optional DB via ready probe.
 * Usage: node scripts/smoke-check.mjs
 * Env: API_URL (default http://localhost:3001/api), PYTHON_URL (default http://localhost:3003)
 */
const API = (process.env.API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
const PYTHON = (process.env.PYTHON_URL || 'http://localhost:3003').replace(/\/$/, '');

async function get(url, label) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const results = [];
  try {
    const health = await get(`${API}/health`, 'backend');
    results.push({ ok: true, step: 'backend_health', status: health.status });
  } catch (e) {
    results.push({ ok: false, step: 'backend_health', error: e.message });
  }

  try {
    const ready = await get(`${API}/health/ready`, 'ready');
    results.push({ ok: true, step: 'backend_ready', python: ready.pythonService });
  } catch (e) {
    results.push({ ok: false, step: 'backend_ready', error: e.message });
  }

  try {
    const py = await get(`${PYTHON}/health`, 'python');
    results.push({ ok: true, step: 'python_health', engine: py.engine || py.status });
  } catch (e) {
    results.push({ ok: false, step: 'python_health', error: e.message });
  }

  const failed = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ success: failed.length === 0, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
