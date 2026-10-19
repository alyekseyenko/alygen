# ADR 0002: Polyglot Distributed Architecture (Express Gateway + Python ML Services)

## Status
Accepted

## Context
Lead processing in Alygen CRM has two compute profiles:

1. **I/O-bound:** External APIs, WebSockets, notifications, cron, HTTP aggregation.
2. **CPU/data-bound:** NumPy vectors, scikit-learn inference (`lead_model.pkl`), text processing, accessibility/SEO heuristics.

## Decision
Polyglot microservices:

1. **Node.js (Express ESM) as API gateway & orchestrator (port 3001):** Auth, rate limiting, database, WebSockets, follow-up automation.
2. **Python microservices (Flask/FastAPI) as ML & heuristics engine (port 3002+):** Analytics, conversion ML, advanced scraping. Market intel consolidated on FastAPI **3003**.
3. **Resilient circuit breaker (Python bridge):** Node calls Python over HTTP with strict timeout (~5s). If Python is down, Node uses pure JS fallbacks without breaking the user flow.

## Consequences

### Positive
- Clear separation of concerns.
- Python data-science stack without sacrificing Node I/O performance.
- Resilience with native Node fallbacks.
