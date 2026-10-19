# ADR 0005: LangGraph for market intel

## Status
Accepted

## Context
Market intel used a manual LCEL chain with YAML prompts formatted before the template (crash risk when external data contains `{`).

## Decision
- Orchestration in `backend_python/services/agent_graph.py` with LangGraph `StateGraph`.
- Nodes: Researcher (tools), Strategist, Synthesizer, Critic with at most one rewrite.
- Structured Pydantic outputs; untrusted text wrapped in `<untrusted>`.
- Explicit fallback with `degraded: true`.

## Consequences
- `langgraph` dependency in `requirements.txt`.
- Progressive removal of legacy orchestrator copies.
- Node sends `audit_context` on POST `/agent/market-intel`.
