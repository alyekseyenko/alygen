# Spec 008: Analysis pipeline v2

## Problem
Audit and market intel were decoupled; fake metrics (default 50); semantic cache could return another company’s verdict; multiple Chromium fetches; no traceable `analysis_runs`.

## Acceptance criteria (phases 1–3)

### Phase 1 — Faithful audit
- `assertPublicHttpUrl` at `analyzeLead` entry.
- Shared browser pool for render + pixels (HTML reused by scanners that support `html`).
- Failed metrics = `null`; per-domain `dataQuality` object; Q-Score with `confidence`.
- Email template generated once per cycle (in `performFullAnalysis` only).
- Competitive context via Postgres (`getCompetitiveLeadsMeta`), Sheets not required.
- Audit cache with configurable TTL (`AUDIT_CACHE_TTL_DAYS`, default 30).

### Phase 2 — Agents wired
- Semantic cache: direct hit only for same `website`; sector/district only as `semantic_context` for the graph.
- `includeIntel` enqueues flag on audit job; after `saveAnalysis`, market-intel with real `audit_context`.
- Node does not send `rag_context` (single Python `build_lead_context_pack`).
- Critic passes `critic_reason` to Synthesizer on rewrite.
- Researcher includes `competitor_snapshots` (CRM + optional light metrics).

### Phase 3 — Orchestration
- `analysis_runs` table (migration 009): steps JSON, status, `trace_id`.
- `GET /api/analysis-runs/:id` for progress.
- `trace_id` propagated to market-intel and `ai_generations`.

## Non-goals (phase 4)
- Full multi-page analyzer; Google reviews in Q-Score; visual GDPR banner.
