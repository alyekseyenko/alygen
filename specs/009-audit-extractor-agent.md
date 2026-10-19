# Spec 009: Audit extractor and qualifier agent

## Problem
Deterministic scanners do not prioritise defects or interpret copy/UX; scrape failures leave leads without contacts. Full market-intel LLM is too heavy per URL.

## Acceptance criteria
- `POST /agent/audit-enrich` (FastAPI): input with HTML snippet, metrics, `dataQuality`, Q-Score; structured JSON output (defects, priority, email hook).
- Optional recovery: if `recover_scrape=true` and HTML is short, `deep_scrape_website` returns emails/phones.
- Node: `shouldRunAuditEnrichment` — phase 3 and (confidence &lt; 60 OR missing html/render OR zero emails and phones).
- Result in `analysis.auditEnrichment`; priority may be raised if agent suggests CRITICAL/HIGH.
- Telemetry in `ai_generations` (`agent_name: audit_enrich`).

## Non-goals
- Replace PageSpeed, Python Q-Score, or LangGraph market-intel.
