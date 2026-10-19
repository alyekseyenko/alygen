# ADR 0001: Hybrid Dual-Database Topology (SQLite WAL + Cloud Postgres)

## Status
Accepted (superseded for production runtime by ADR 0008)

## Context
Alygen CRM is a high-velocity prospecting and lead-analysis tool. Relying only on a cloud database (Supabase) or remote PostgreSQL creates single points of failure under network instability, rate limits, or serverless cold starts.

## Decision
We adopted a hybrid topology with **local-first resilient failsafe**:

1. **Primary store:** PostgreSQL / Supabase with RLS for cloud persistence and multi-device sync.
2. **Local resilient cache:** SQLite with `PRAGMA journal_mode = WAL` via `better-sqlite3`.
3. **Transparent circuit breaker:** If Supabase or local PostgreSQL calls fail (timeout, DNS, auth), `local-db-service.js` routes reads/writes to local SQLite without HTTP 500 to the user.

## Consequences

### Positive
- High operational uptime for local users.
- Fast queries (< 5ms) for thousands of locally cached leads.
- No data loss during connectivity blips.

### Negative / mitigations
- Async reconciliation (sync worker) when Supabase connectivity returns.
