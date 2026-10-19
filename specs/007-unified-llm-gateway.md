# Spec: Unified LLM gateway (Node auditors)

## Problem
CTA, strategic SEO, content, and insights called Groq directly from Node without `trace_id`, cost tracking, or consistent fallback.

## Acceptance criteria
- `backend/services/llm-client.js`: `invokePythonLlm`, `invokeLlmJson`, `invokeGroqChat`, `parseJsonFromLlm`.
- CTA (`cta-analyzer.js`), SEO AI (`seo-analyzer.js`), content (`content-analyzer.js`), insights (`ai-analyzer.js`), and copywriter use **FastAPI `/llm/chat` first**, Groq/Ollama as fallback.
- Calls with `agentName` log a row in `ai_generations`.
- Autopilot `trigger_next_lead` uses `enqueueLeadAnalysis` (pg-boss) and skips leads already in the Postgres/local meta queue.
- Optional Langfuse via `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` in `llm_gateway.py`.
- Evals: `cases.jsonl` ≥10 cases; CI with ruff + pytest evals.

## Non-goals
- Remove `groq-key-manager` (still used for fallback and health).
- Mandatory Langfuse in production.
