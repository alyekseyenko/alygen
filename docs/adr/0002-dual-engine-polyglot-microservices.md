# ADR 0002: Polyglot Distributed Architecture (Express Gateway + Python ML Services)

## Status
Accepted

## Context
O processamento de leads no Alygen CRM envolve dois perfis de carga computacional distintos:
1. Operações I/O-bound: Chamadas a APIs externas, WebSockets, streaming de notificações, agendamento de cron, e agregação de respostas HTTP.
2. Operações CPU/Data-bound: Cálculos de vetores com NumPy, inferência com scikit-learn (`lead_model.pkl`), processamento de texto e heurísticas de acessibilidade / SEO.

## Decision
Adotamos uma arquitetura de microsserviços poliglota:
1. **Node.js (Express ESM) como API Gateway & Orchestrator (Porta 3001):**
   - Gerencia autenticação, rate limiting, conexões de banco de dados, WebSockets e automação de follow-ups.
2. **Python Microservices (Flask/FastAPI) como ML & Heuristics Engine (Porta 3002):**
   - Dedicado ao processamento analítico, inferência de conversão ML e web scraping avançado.
3. **Resilient Circuit Breaker (Python Bridge):**
   - O Node.js comunica com o Python via HTTP com timeout estrito (5s). Caso o serviço Python esteja indisponível, o Node.js aciona automaticamente implementações de fallback puras em JavaScript sem quebrar o fluxo do utilizador.

## Consequences
### Positivas
- Desacoplamento claro de responsabilidades (*Separation of Concerns*).
- Aproveitamento do ecossistema de Data Science do Python sem abrir mão da performance de I/O do Node.js.
- Resiliência total com fallback nativo no Node.js.
