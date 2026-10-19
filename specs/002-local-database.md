# Spec: Local database (Postgres + pgvector)

## Problem
Remove runtime dependency on Supabase; one local source of truth for CRM, sequences, and RAG.

## Acceptance criteria
- `postgres` service in Docker with pgvector.
- Migrations in `backend/db/migrations/`.
- Runtime uses `db-client.js` + `crm-data-service.js` on top of `local-client.js`.
- Tables `leads`, `email_sequences`, `lead_events` available.

## Metrics
- Zero `@supabase/supabase-js` calls in production services.
