# Security and compliance (English)

## Auth
- JWT (24h) for SPA; optional `ALYGEN_API_KEY` on API (not embedded in frontend bundle).
- Python FastAPI validates `X-API-Key` when `ALYGEN_API_KEY` is set (Node bridge sends it).

## SSRF
`assertPublicHttpUrl` on lead analysis URLs, screenshots, CTA fetch, automation webhooks.

## Prompt injection
External content (DuckDuckGo, RAG, scrape) wrapped in `<untrusted>` with instruction hierarchy in LangGraph prompts.

## GDPR
- Unsubscribe HMAC tokens on all SMTP emails (`appendUnsubscribeQuery`).
- Opt-out / immunity checks before send and in timed automations.
- Retention cron and erasure endpoints documented in backend tests.

## Human-in-the-loop
Telegram approval for sensitive automations; optional before outbound send.
