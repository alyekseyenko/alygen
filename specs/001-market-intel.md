# Spec: Market Intel Multi-Agente

## Problema
Gerar copy B2B em PT-PT com concorrentes reais e gaps técnicos, persistindo em `lead_analyses.agent_intel`.

## Critérios de aceitação
- POST `/api/leads/:id/market-intel` usa FastAPI `3003` exclusivamente.
- Saída contém campo `intel` (texto PT-PT).
- Sem nomes de concorrentes inventados no fallback.
- Gravação local em Postgres/SQLite.

## Contrato Python
- Entrada: `{ name, city, sector, website?, internal_competitors? }`
- Saída: `{ success, intel, competitors[], model }`

## Métricas
- Latência p95 < 60s
- Taxa de fallback < 20% com `GROQ_API_KEY` válida
