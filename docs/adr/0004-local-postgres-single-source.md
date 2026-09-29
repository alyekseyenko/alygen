# ADR 0004: Postgres local como fonte única de verdade

## Status
Aceite

## Contexto
O runtime dependia de nomes e SDK legados de cloud Postgres; a persistência real passou para Postgres local com pgvector.

## Decisão
- Postgres com pgvector no Docker (`docker compose` / `docker-compose.prod.yml`).
- Adaptador `backend/db/local-client.js` + `backend/services/db-client.js` para queries estilo builder.
- Camada de domínio em `backend/services/crm-data-service.js`.
- Migrações numeradas em `backend/db/migrations/`.

## Consequências
- Sem Supabase nem `@supabase/supabase-js` no runtime.
- RAG, filas (`pg-boss`) e CRM partilham a mesma instância Postgres.
- Fallback SQLite WAL apenas se Postgres estiver indisponível (dev/resiliência).
