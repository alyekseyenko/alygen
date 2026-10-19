# Spec: Multi-agent market intel

## Problem
Generate B2B copy in PT-PT with real competitors and technical gaps, persisted in `lead_analyses.agent_intel`.

## Acceptance criteria
- POST `/api/leads/:id/market-intel` uses FastAPI on port `3003` exclusively.
- Response includes `intel` (PT-PT text).
- No invented competitor names in fallback.
- Persisted locally in Postgres/SQLite.

## Python contract
- Input: `{ name, city, sector, website?, internal_competitors? }`
- Output: `{ success, intel, competitors[], model }`

## Metrics
- p95 latency < 60s
- Fallback rate < 20% with a valid `GROQ_API_KEY`
