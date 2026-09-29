# ADR 0007: In-repo lead discovery (Prospector)

## Status
Aceite

## Contexto
Descoberta de leads dependia de n8n e Google Sheets fora do repositório.

## Decisão
- Módulo `backend_python/services/prospector/` com providers Google Places (New) e SerpAPI Maps.
- Campanhas persistidas; dedupe por `place_id` / domínio; fila `audit` em pg-boss.
- Import Sheets permanece opcional para migração.

## Consequências
- Chaves `GOOGLE_PLACES_API_KEY` e/ou `SERPAPI_API_KEY` em `.env`.
- UI de campanhas no frontend (`/prospector` ou integrado no pipeline).
