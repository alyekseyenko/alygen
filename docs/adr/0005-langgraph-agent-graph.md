# ADR 0005: LangGraph for market intel

## Status
Aceite

## Contexto
Market intel usava cadeia LCEL manual com prompts YAML formatados antes do template (risco de crash com `{` em dados externos).

## Decisão
- Orquestração em `backend_python/services/agent_graph.py` com LangGraph `StateGraph`.
- Nós: Researcher (ferramentas), Strategist, Synthesizer, Critic com no máximo um re-write.
- Saídas estruturadas Pydantic; texto não confiável delimitado em `<untrusted>`.
- Fallback explícito com `degraded: true`.

## Consequências
- Dependência `langgraph` no `requirements.txt`.
- Remoção progressiva de cópias legadas do orquestrador.
- Node envia `audit_context` no POST `/agent/market-intel`.
