# Spec 008: Pipeline de análise v2

## Problem
Auditoria e market intel desacoplados; métricas fictícias (defaults 50); cache semântico pode devolver veredicto de outra empresa; múltiplos fetches Chromium; sem `analysis_runs` rastreável.

## Acceptance criteria (Fases 1–3)

### Fase 1 — Auditoria fiel
- `assertPublicHttpUrl` na entrada de `analyzeLead`.
- Browser pool partilhado para render + pixels (HTML reutilizado por scanners que suportam `html`).
- Métricas falhadas = `null`; objeto `dataQuality` por domínio; Q-Score com `confidence`.
- Email template gerado uma vez por ciclo (em `performFullAnalysis` apenas).
- Contexto competitivo via Postgres (`getCompetitiveLeadsMeta`), não Sheets obrigatório.
- Cache de auditoria com TTL configurável (`AUDIT_CACHE_TTL_DAYS`, default 30).

### Fase 2 — Agentes ligados
- Cache semântico: hit direto só mesmo `website`; sector/district só como `semantic_context` para o grafo.
- `includeIntel` enfileira flag no job audit; após `saveAnalysis`, market-intel com `audit_context` real.
- Node não envia `rag_context` (Python `build_lead_context_pack` único).
- Critic passa `critic_reason` ao Synthesizer no rewrite.
- Researcher inclui `competitor_snapshots` (CRM + opcional light metrics).

### Fase 3 — Orquestração
- Tabela `analysis_runs` (migração 009): steps JSON, status, `trace_id`.
- `GET /api/analysis-runs/:id` para progresso.
- `trace_id` propagado para market-intel e `ai_generations`.

## Non-goals (Fase 4)
- Multi-page analyzer completo; Google reviews no Q-Score; GDPR banner visual.
