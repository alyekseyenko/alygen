# Alygen CRM — System Architecture (English)

## Context (C4 Level 1)
Alygen CRM is a **local-first B2B prospecting platform** for the Portuguese market. It discovers businesses, audits their websites, scores opportunity (Q-Score), generates **market intelligence** with multi-agent LLMs, and runs **outreach automations** (email, WhatsApp, Telegram approval).

## Containers (C4 Level 2)
| Container | Port | Role |
|-----------|------|------|
| React SPA (Vite) | 4000 / 8080 nginx | Pipeline UI, automations canvas, prospector |
| Node/Express API | 3001 | Orchestration, audits (Puppeteer), CRM, RAG ingest, pg-boss |
| Python FastAPI | 3003 | Q-Score, market-intel LangGraph, prospector providers |
| Postgres + pgvector | 5432 | Single source of truth, vectors, job queue |

## A→Z data flow
1. **Discovery** — Prospector campaign (Google Places / SerpAPI) or optional Google Sheets import → `lead_analyses` stubs.
2. **Audit queue** — pg-boss `audit` jobs → `performFullAnalysis` (~14 checks, PageSpeed, pixels, AEO, vision).
3. **Scoring** — Python `calculate_qscore` (sector weights, penalties); deterministic priority mapping in Node.
4. **Market intel** — Semantic cache (real `intel_text`, cosine threshold) → LangGraph: Researcher → Strategist → Synthesizer → Critic.
5. **RAG** — Playbooks ingested to `document_chunks`; hybrid retrieval (HNSW + FTS + RRF).
6. **Outreach** — Copywriter LLM → email/WhatsApp; GDPR unsubscribe tokens; optional Telegram HITL.

See also: [AGENTS.md](./AGENTS.md), [SCORING.md](./SCORING.md), [RAG_AND_VECTORS.md](./RAG_AND_VECTORS.md).
