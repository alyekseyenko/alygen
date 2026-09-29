# AI Agents Reference (English)

Product copy remains **European Portuguese (PT-PT)**. Runtime rules: root [AGENTS.md](../../AGENTS.md).

## Prospector
- **Purpose:** In-repo lead discovery by sector × city.
- **Tools:** Google Places Text Search or SerpAPI Maps.
- **Output:** Deduped `LeadCandidate[]` with `qualification` (`QUALIFIED`, `SEM WEBSITE`, etc.).
- **Rules:** Dedupe by `place_id` / domain; pre-qualify before audit enqueue.

## Auditor (Node)
- **Purpose:** Technical and commercial site audit.
- **Inputs:** URL, lead metadata, phase 1–3.
- **Outputs:** `full_analysis` JSON, sub-scores, screenshots.
- **LLM use:** CTA, SEO, content, insights, copywriter, automation pitch — **Python `/llm/chat` first** (`llm-client.js`), Groq/Ollama fallback on Node.
- **Audit enrich:** `POST /agent/audit-enrich` — extrator/qualificador on low confidence, missing HTML, or no contacts (spec 009); optional Playwright recovery.
- **Python `/llm/chat`:** Groq pool (`GROQ_API_KEYS`) then **Ollama** (`OLLAMA_URL`); `usage.degraded=true` when Ollama is used.

## Scorer (Python `core/qscore.py`)
- **Purpose:** Sector-weighted Q-Score 0–100, grade, priority, ROI hint.
- **Inputs:** performance, SEO, security, tracking booleans, CTA flag, ranking score.
- **Rules:** SSL from probe (not forced HTTPS); PageSpeed failure penalized, not masked as 50.

## Researcher (LangGraph)
- **Purpose:** Competitor research.
- **Tools:** DuckDuckGo search, CRM internal competitors, RAG context pack.
- **Guardrails:** Untrusted text in `<untrusted>` blocks; no invented names in fallback.

## Strategist
- **Purpose:** Gap analysis vs competitors.
- **Inputs:** Research + optional `audit_context` from Node.
- **Model:** Groq `llama-3.3-70b-versatile`, temperature 0.3.

## Synthesizer
- **Purpose:** PT-PT verdict paragraph (Alygen formula).
- **Rules:** Max 4 sentences; no placeholders; PT-PT lexicon enforced by Critic.

## Critic
- **Purpose:** Deterministic guardrails (placeholders, PT-BR terms, length); optional one rewrite loop.
- **Output:** `degraded: true` if still failing after rewrite.

## Copywriter (Node)
- **Purpose:** Email/WhatsApp copy from audit + `agent_intel`.
- **Personas:** consultant_senior, technical, direct-response.
