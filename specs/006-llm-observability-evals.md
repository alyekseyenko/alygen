# Spec: LLM observability and evals

## Problem
No per-step tracing, token/cost accounting, or CI evals for agent quality.

## Acceptance criteria
- `ai_generations` rows per graph node (or unified gateway call): `trace_id`, `agent_name`, `prompt_version`, `model`, `tokens_in`, `tokens_out`, `cost_eur`, `latency_ms`, `degraded`, `lead_website`.
- Dashboard API: `GET /api/system/ai-metrics` (fallback rate, p95 latency, cost per lead, approval rate when `approved`/`outcome` set).
- `backend_python/evals/cases.jsonl`: ≥10 golden cases; CI runs recorded-fixture mode (no live Groq).
- Deterministic checks: no banned placeholders, PT-BR lexicon blacklist, max 4 sentences for verdict.
- CI: Postgres service container for backend tests; ruff + ESLint jobs; `pip-audit` fails build (no `|| true`).
- Smoke: `node scripts/smoke-check.mjs` against local API + Python.
- Human feedback: `POST /api/system/ai-feedback` updates `approved` / `outcome` on `ai_generations` (by `traceId` or `id`).

## Metrics
- 100% of market-intel runs logged when Postgres available.
- Eval suite green on every PR.
