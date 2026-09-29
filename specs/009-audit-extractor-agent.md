# Spec 009: Agente extrator e qualificador de auditoria

## Problem
Scanners determinísticos não priorizam defeitos nem interpretam copy/UX; falhas de scrape deixam leads sem contactos. LLM full market-intel é pesado para cada URL.

## Acceptance criteria
- `POST /agent/audit-enrich` (FastAPI): entrada com snippet HTML, métricas, `dataQuality`, Q-Score; saída JSON estruturada (defeitos, prioridade, gancho email).
- Recovery opcional: se `recover_scrape=true` e HTML curto, `deep_scrape_website` e emails/telefones devolvidos.
- Node: `shouldRunAuditEnrichment` — Fase 3 e (confidence &lt; 60 OU html/render missing OU zero emails e telefones).
- Resultado em `analysis.auditEnrichment`; prioridade pode ser elevada se agente sugerir CRITICAL/HIGH.
- Telemetria em `ai_generations` (`agent_name: audit_enrich`).

## Non-goals
- Substituir PageSpeed, Q-Score Python ou LangGraph market-intel.
