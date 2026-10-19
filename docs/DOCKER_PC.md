# Alygen CRM on Docker (Windows PC)

Recommended stack to run **everything on Docker Desktop**: Postgres, Node backend, Python (market-intel), and frontend (nginx).

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- `backend/.env` with at least **`GROQ_API_KEY`** (optional: SMTP, Telegram, Google Sheets)
- Optional: [Ollama](https://ollama.com) on the **host** for embeddings/RAG (`nomic-embed-text`)

## Quick start

From the project root:

```powershell
# 1) Compose secrets (repo root)
Copy-Item .env.docker.example .env
# Edit .env — PGPASSWORD, JWT_SECRET, ALYGEN_API_KEY

# 2) App config (if you do not have it yet)
Copy-Item backend\.env.example backend\.env
# Edit backend\.env — GROQ_API_KEY or GROQ_API_KEYS=key1,key2,...

# 3) Build and start
docker compose -f docker-compose.prod.yml up -d --build
```

Open: **http://localhost:8080**

## First login

1. Click **“First time? Create administrator account”**
2. Email + password (min. 8 characters)
3. Sign in

The API requires **`ALYGEN_API_KEY`** or JWT on requests; the frontend sends JWT after login and the same API key at build time for registration.

## Ollama on the host (optional)

With Ollama running on Windows (`localhost:11434`), compose already points the backend to:

`http://host.docker.internal:11434`

In `backend/.env` you can confirm:

```ini
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
```

## Useful commands

```powershell
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml down -v   # removes Postgres volume (destructive)
```

## Development mode (hot reload) — stack completo

Tudo corre no Docker: **Postgres**, **backend Node**, **Python**, **frontend Vite**.

```powershell
.\scripts\docker-dev-up.ps1
# ou: docker compose up -d --build
```

| Serviço | URL |
|---------|-----|
| UI | http://localhost:4000 |
| API (host) | http://localhost:3101 se `BACKEND_HOST_PORT=3101` no `.env` raiz |
| Python | http://localhost:3003 |
| Postgres | `localhost:5432` |

O browser usa só **:4000**; o Vite faz proxy `/api` → `backend:3001` na rede Docker.

Teste rápido de auditoria:

```powershell
docker exec alygencrm-backend-1 node scripts/e2e-docker-analyze.mjs "https://zeniteclinic.com/"
```


## Troubleshooting

| Symptom | Fix |
|--------|-----|
| `Bind for 0.0.0.0:3001 failed: port is already allocated` | Backend **outside** Docker is using 3001. Stop the local process or set `BACKEND_HOST_PORT=3002` in root `.env` and run `docker compose up -d` again |
| Only Postgres/Python start; backend stays `Created` | Same issue — port conflict (`netstat -ano \| findstr :3001`) |
| Frontend does not open | Check `HTTP_PORT` in `.env` (default 8080) for **prod**; dev uses port 4000 |
| 401 on API | Sign in at `/login` or fix the key in `.env` |
| Backend unhealthy | `docker logs alygencrm-backend-1` — is Postgres up? |
| Market intel fails | `GROQ_API_KEY` / `GROQ_API_KEYS` in `backend/.env`; check `backend_python` logs |
| Ollama unreachable inside Docker | Compose uses `host.docker.internal`; confirm Ollama is running on the PC |
| `localhost:4000` ERR_EMPTY_RESPONSE | **Prod** image (nginx:80) replaced **dev** (Vite:4000). Run `docker compose build frontend --no-cache` and `up -d` (dev uses `alygencrm-frontend-dev`) |
| “Sync failed or server is unavailable” | Backend crash or API on wrong port. In dev the frontend uses **only** `:4000` (proxy `/api`). Empty list: `docker exec alygencrm-backend-1 node scripts/migrate-to-postgres.js` and/or `node scripts/sync-sheets-to-postgres.js` |
