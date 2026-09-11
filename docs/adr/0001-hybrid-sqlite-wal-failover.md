# ADR 0001: Hybrid Dual-Database Topology (SQLite WAL + Cloud Postgres)

## Status
Accepted

## Context
O Alygen CRM opera como uma ferramenta de prospeção de alta velocidade e análise de leads. Depender exclusivamente de um banco na cloud (Supabase) ou de um serviço PostgreSQL remoto gera pontos únicos de falha (SPOF) sob condições de instabilidade de rede, rate-limiting ou cold-starts de provedores serverless.

## Decision
Adotamos uma topologia híbrida com **Local-First Resilient Failsafe**:
1. **Primary Store:** PostgreSQL / Supabase com Row-Level Security (RLS) para persistência em nuvem e sincronização multi-dispositivo.
2. **Local Resilient Cache:** SQLite configurado estritamente com `PRAGMA journal_mode = WAL` (Write-Ahead Logging) via `better-sqlite3`.
3. **Transparent Circuit Breaker:** Se a chamada ao Supabase ou PostgreSQL local falhar por timeout, DNS ou auth, o `local-db-service.js` direciona a consulta e a escrita imediatamente para o SQLite local, sem interromper a interface ou retornar HTTP 500 para o utilizador.

## Consequences
### Positivas
- Uptime operacional de 99.99% para utilizadores locais.
- Consultas ultra-rápidas (< 5ms) para os mais de 5.000 leads carregados localmente.
- Zero perda de dados durante oscilações de conexão.

### Negativas / Mitigações
- Necessidade de reconciliação assíncrona (sync worker) quando a conectividade com o Supabase é restabelecida.
