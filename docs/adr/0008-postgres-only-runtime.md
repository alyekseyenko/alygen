# ADR 0008: Postgres-only runtime (no silent SQLite fallback)

## Status
Aceite

## Contexto
ADR 0001 permitia failover SQLite; em produção causava split-brain (Wait nodes, opt-out, logs).

## Decisão
- Runtime Node usa apenas Postgres; falha de query propaga erro (sem re-execução em SQLite).
- DDL core movido para `006_core_tables.sql`; SQLite limitado a testes locais opcionais se necessário.
- Workers de automação e filas usam `db.query` / pg-boss na mesma instância.

## Consequências
- Docker compose deve subir Postgres antes do backend.
- ADR 0001 permanece histórico; comportamento de failover desactivado no runtime.
