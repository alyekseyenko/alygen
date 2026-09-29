# Spec: Prospector Agent (in-repo discovery)

## Problem
Lead discovery depends on external n8n + Google Sheets. Portfolio and operations need first-class discovery inside the repo with deduplication and audit queueing.

## Acceptance criteria
- Campaign input: `{ sector, city, district?, radius_km?, provider: "google_places" | "serpapi_maps" }`.
- Providers implement `LeadProvider.search(campaign) -> LeadCandidate[]`.
- Normalise PT phone and website domain; dedupe by `place_id` or normalised domain.
- Upsert into `lead_analyses` (stub or update metadata); no duplicate websites.
- Pre-qualify: tag `SEM WEBSITE` when no website; optional min rating/reviews and sector allowlist.
- Enqueue `audit` jobs via pg-boss (replace JSON file queue for new campaigns).
- Optional: keep Sheets sync as importer (`GET /api/fetch-leads`).
- API: `POST /api/prospector/campaigns` (auth required), `GET /api/prospector/campaigns/:id/status`.

## Contracts
- Python: `backend_python/services/prospector/` with `GooglePlacesProvider`, `SerpApiMapsProvider`.
- Node: route proxies to Python or runs provider via python-bridge; persists via `crm-data-service`.

## Metrics
- Dedupe collision rate < 1% false merges on domain.
- Campaign of 50 leads ingested in < 120s (provider-dependent).
