# ADR 0004: Local Postgres as single source of truth

## Status
Accepted

## Context
Runtime depended on legacy cloud Postgres names/SDKs; real persistence moved to local Postgres with pgvector.

## Decision
- Postgres with pgvector in Docker (`docker compose` / `docker-compose.prod.yml`).
- Adapter `backend/db/local-client.js` + `backend/services/db-client.js` for builder-style queries.
- Domain layer in `backend/services/crm-data-service.js`.
- Numbered migrations in `backend/db/migrations/`.

## Consequences
- No Supabase or `@supabase/supabase-js` in runtime.
- RAG, queues (`pg-boss`), and CRM share one Postgres instance.
- SQLite WAL fallback only when Postgres is unavailable (dev/resilience; see ADR 0008 for production).
