# Alygen Multi-Agent AI System (AGENTS.md)

**Extended reference (portfolio):** [docs/architecture/AGENTS.md](docs/architecture/AGENTS.md) — Prospector, Auditor, Scorer, Copywriter, and eval guardrails.

Alygen CRM uses a **Multi-Agent Orchestrator** architecture to enrich prospecting with deep local market intelligence.

**Product copy** (Synthesizer verdicts, proposals, outreach) remains **European Portuguese (PT-PT)**. This document is in English for repository and portfolio readers.

## 👥 Agents and responsibilities

Market intelligence (`/agent/market-intel`) runs as an asynchronous sequential **chain of agents**:

```
[ Lead Website/Metadata ]
          │
          ▼
🕵️ Researcher ──► Finds real local competitors via DuckDuckGo
          │
          ▼
📉 Strategist ──► Identifies weaknesses, strengths, and sales hook
          │
          ▼
✍️ Synthesizer ──► Drafts verdict in European Portuguese (PT-PT)
          │
          ▼
[ Persuasive market-intel verdict ]
```

### 1. 🕵️ Researcher Agent
- **Purpose:** Find real direct competitors in the lead’s geographic area (city/district).
- **Tools:** DuckDuckGo Search.
- **Behaviour:** Queries terms such as `"[sector] in [city] competitors portugal"`, excluding the lead’s own name and website to avoid self-matches.

### 2. 📉 Strategist Agent
- **Purpose:** Cross audit technical performance (Lighthouse, SSL, pixels) with detected competitor signals.
- **Behaviour:** Produces strategic positioning, highlighting **content gap** or **technical gap** vs real competitors.

### 3. ✍️ Synthesizer Agent
- **Purpose:** Turn raw research and gap analysis into persuasive, human B2B copy in **PT-PT**.
- **Tone:** Senior sales consultant — direct, polished, urgent (Alygen strategic consulting voice).
- **Formula (PT-PT output):** “Identificámos que [RIVAL A] e [RIVAL B] dominam em [X]. Para superar isto, o/a [NAME] deve [AÇÃO].”

---

## Resilience and fallback

If DuckDuckGo or Groq fail:

1. Use internal CRM competitors (same city/sector, Q-Score ≥ 50).
2. Heuristic fallback **without invented names** — sector-level recommendations only, still in PT-PT for user-facing text.
3. Never HTTP 500 from agent failure; return `{ success: false, error }` or safe fallback copy.

## Runtime (2026)

- **Single engine:** [backend_python/services/agent_orchestration.py](backend_python/services/agent_orchestration.py) at `PYTHON_FASTAPI_URL` (port 3003).
- **Data:** Local Postgres + pgvector (`docker compose up postgres`). Node runtime uses [backend/db/local-client.js](backend/db/local-client.js), not Supabase.
- **Context:** [backend_python/context/context_builder.py](backend_python/context/context_builder.py) + `documents` / `document_chunks` tables (migration 004).
- **Versioned prompts:** [backend_python/prompts/](backend_python/prompts/).
- **MCP:** CRM server via `npm run mcp` ([backend/mcp/server.js](backend/mcp/server.js)); allowlist in [backend_python/config/mcp_servers.json](backend_python/config/mcp_servers.json).
- **Specs:** add or update a file under [specs/](specs/) before new features.
