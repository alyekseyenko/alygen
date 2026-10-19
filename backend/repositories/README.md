# Repositories — data access layer

Runtime uses [`backend/db/local-client.js`](../db/local-client.js) via [`../services/db-client.js`](../services/db-client.js).

For complex queries, prefer:
- [`../services/crm-data-service.js`](../services/crm-data-service.js) — analyses, leads, automations
- [`../services/email-sequences.js`](../services/email-sequences.js)
- [`../services/rag/document-service.js`](../services/rag/document-service.js)
