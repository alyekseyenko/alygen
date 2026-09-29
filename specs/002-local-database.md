# Spec: Base de dados local (Postgres + pgvector)

## Problema
Eliminar dependência runtime do Supabase; uma fonte de verdade local para CRM, sequências e RAG.

## Critérios de aceitação
- Serviço `postgres` no Docker com pgvector.
- Migrações em `backend/db/migrations/`.
- Runtime usa `db-client.js` + `crm-data-service.js` sobre `local-client.js`.
- Tabelas `leads`, `email_sequences`, `lead_events` disponíveis.

## Métricas
- Zero chamadas `@supabase/supabase-js` nos serviços de produção.
