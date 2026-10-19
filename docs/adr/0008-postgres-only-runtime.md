# ADR 0008: Postgres-only runtime (no silent SQLite fallback)

## Status
Accepted

## Context
ADR 0001 allowed SQLite failover; in production it caused split-brain (wait nodes, opt-out, logs).

## Decision
- Node runtime uses Postgres only; query failures propagate (no silent re-execution on SQLite).
- Core DDL in `006_core_tables.sql`; SQLite limited to optional local tests if needed.
- Automation workers and queues use `db.query` / pg-boss on the same instance.

## Consequences
- Docker Compose must start Postgres before the backend.
- ADR 0001 remains historical; failover behaviour disabled in production runtime.
