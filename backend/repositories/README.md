# Repositórios — camada de acesso a dados

Runtime usa [`backend/db/local-client.js`](../db/local-client.js) via [`../services/db-client.js`](../services/db-client.js).

Para queries complexas, preferir:
- [`../services/crm-data-service.js`](../services/crm-data-service.js) — análises, leads, automações
- [`../services/email-sequences.js`](../services/email-sequences.js)
- [`../services/rag/document-service.js`](../services/rag/document-service.js)
