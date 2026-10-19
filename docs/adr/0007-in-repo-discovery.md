# ADR 0007: In-repo lead discovery (Prospector)

## Status
Accepted

## Context
Lead discovery depended on n8n and Google Sheets outside the repository.

## Decision
- Module `backend_python/services/prospector/` with Google Places (New) and SerpAPI Maps providers.
- Persisted campaigns; dedupe by `place_id` / domain; `audit` queue via pg-boss.
- Sheets import remains optional for migration.

## Consequences
- `GOOGLE_PLACES_API_KEY` and/or `SERPAPI_API_KEY` in `.env`.
- Campaign UI in the frontend (`/prospector` or integrated in the pipeline).
