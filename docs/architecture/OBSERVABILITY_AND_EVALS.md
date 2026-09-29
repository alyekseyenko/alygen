# Observability and evals (English)

## Logging
- `X-Request-Id` across Node → Python.
- Table `ai_generations`: agent, prompt version, model, latency, tokens, cost_eur, trace_id, degraded, approved, outcome.

## Metrics API
`GET /api/system/ai-metrics` — 7-day window: fallback rate, p95 latency, total cost, approval rate.

## Evals
- `backend_python/evals/test_market_intel.py` — fallback without Groq (CI).
- `backend_python/evals/cases.jsonl` — ≥10 golden cases; critic rules on heuristic fallback.

## Node LLM calls
Auditors (CTA, SEO, content, insights) and automation pitch route through `POST /llm/chat` first; rows land in `ai_generations` when `agentName` is set.

## Langfuse (optional)
Set `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and optionally `LANGFUSE_HOST` on the Python service. Install `langfuse` in the Python env when enabling traces.

## CI
Postgres service container for backend job; `ruff` + `pip-audit` on Python job; pytest includes `evals/`.
