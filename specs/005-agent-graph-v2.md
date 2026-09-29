# Spec: Market Intel Agent Graph v2 (LangGraph)

## Problem
The live engine is a fragile sequential chain: no structured outputs, Strategist lacks audit data, prompt brace crashes, and fallback reports `success: true` without `degraded`.

## Acceptance criteria
- Single entry: FastAPI `POST /agent/market-intel` delegates to LangGraph `StateGraph`.
- Nodes: Researcher (tools) → Strategist → Synthesizer → Critic; max 1 Critic-driven rewrite.
- Researcher tools: `web_search`, `crm_competitors`, `rag_search`; competitors require `source_url` in structured output.
- Strategist receives audit facts (performance, SSL, pixels, schema, AEO, qscore breakdown) when provided by Node.
- Pydantic outputs: `CompetitorSet`, `StrategyBrief`, `Verdict`; final response includes `intel`, `competitors`, `model`, `degraded`, `agents_involved`.
- Untrusted content (DDG, RAG, scrape) wrapped in `<untrusted>...</untrusted>` in prompts.
- Fallback: `degraded: true`, `model: static_heuristic_failsafe`, no invented competitor names.
- Delete legacy: `agent_orchestrator.py`, `agent_rag.py`, `agents/market_intel_agents.py`, `microservices*.py` (after graph ships).

## Contract
- Input extends IntelBody with optional `audit_context?: object`.
- Output: `{ success, intel, competitors[], model, degraded?, pain_points?, citations? }`.

## Metrics
- p95 < 90s with Groq; fallback rate < 20% with valid key.
- Critic rejection rate tracked; zero placeholder strings in production eval set.
