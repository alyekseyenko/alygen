# Spec: Unified LLM gateway (Node auditors)

## Problem
CTA, SEO estratégico, conteúdo e insights chamavam Groq diretamente no Node, sem `trace_id`, custo ou fallback consistente.

## Acceptance criteria
- `backend/services/llm-client.js`: `invokePythonLlm`, `invokeLlmJson`, `invokeGroqChat`, `parseJsonFromLlm`.
- CTA (`cta-analyzer.js`), SEO AI (`seo-analyzer.js`), conteúdo (`content-analyzer.js`), insights (`ai-analyzer.js`) e copywriter usam **FastAPI `/llm/chat` primeiro**, Groq/Ollama como fallback.
- Chamadas com `agentName` registam linha em `ai_generations`.
- Autopilot `trigger_next_lead` usa `enqueueLeadAnalysis` (pg-boss) e ignora leads já na fila Postgres/meta local.
- Langfuse opcional via `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` em `llm_gateway.py`.
- Evals: `cases.jsonl` ≥10 casos; CI com ruff + pytest evals.

## Non-goals
- Remover `groq-key-manager` (ainda usado em fallback e health).
- Langfuse obrigatório em produção.
