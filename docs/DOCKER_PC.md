# Alygen CRM no Docker (PC Windows)

Stack recomendada para correr **tudo no Docker Desktop** do teu PC: Postgres, backend Node, Python (market-intel) e frontend (nginx).

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e a correr
- Ficheiro `backend/.env` com pelo menos **`GROQ_API_KEY`** (e opcional SMTP, Telegram, Google Sheets)
- Opcional: [Ollama](https://ollama.com) no **host** para embeddings/RAG (`nomic-embed-text`)

## Arranque rápido

Na pasta do projeto:

```powershell
# 1) Segredos do Compose (raiz)
Copy-Item .env.docker.example .env
# Editar .env — PGPASSWORD, JWT_SECRET, ALYGEN_API_KEY

# 2) Config da app (se ainda não tiveres)
Copy-Item backend\.env.example backend\.env
# Editar backend\.env — GROQ_API_KEY ou GROQ_API_KEYS=chave1,chave2,...

# 3) Build e subir
docker compose -f docker-compose.prod.yml up -d --build
```

Abrir: **http://localhost:8080**

## Primeiro acesso

1. Clicar em **«Primeira vez? Criar conta administrador»**
2. Email + password (mín. 8 caracteres)
3. Iniciar sessão

A API exige **`ALYGEN_API_KEY`** ou JWT em pedidos; o frontend envia JWT após login e a mesma API key no build para registo.

## Ollama no PC (opcional)

Com Ollama a correr no Windows (`localhost:11434`), o compose já aponta o backend para:

`http://host.docker.internal:11434`

No `backend/.env` podes confirmar:

```ini
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
```

## Comandos úteis

```powershell
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml down -v   # apaga volume Postgres (cuidado)
```

## Modo desenvolvimento (hot reload)

Para editar código com volumes montados:

```powershell
docker compose up -d --build
```

UI em **http://localhost:4000** (Vite) → API em **http://localhost:3001**.

## Problemas comuns

| Sintoma | Solução |
|--------|---------|
| `Bind for 0.0.0.0:3001 failed: port is already allocated` | Tens o backend **fora** do Docker na 3001. Para o processo local ou no `.env` da raiz define `BACKEND_HOST_PORT=3002` e `docker compose up -d` de novo |
| Só Postgres/Python sobem; backend `Created` | Mesmo caso — conflito de portas (`netstat -ano \| findstr :3001`) |
| Frontend não abre | Verificar `HTTP_PORT` no `.env` (default 8080) em **prod**; em dev usa porta 4000 |
| 401 na API | Login em `/login` ou chave errada no `.env` |
| Backend unhealthy | `docker logs alygencrm-backend-1` — Postgres a arrancar? |
| Inteligência de mercado falha | `GROQ_API_KEY` / `GROQ_API_KEYS` em `backend/.env`; ver logs `backend_python` |
| Ollama não responde dentro do Docker | No compose já se usa `host.docker.internal`; confirma Ollama a correr no PC |
| `localhost:4000` ERR_EMPTY_RESPONSE | Imagem **prod** (nginx:80) a substituir a **dev** (Vite:4000). Corre `docker compose build frontend --no-cache` e `up -d` (dev usa imagem `alygencrm-frontend-dev`) |
| «Sync failed or server is unavailable» | Backend em crash ou API na porta errada. Em dev o frontend usa **só** `:4000` (proxy `/api`). Lista vazia: `docker exec alygencrm-backend-1 node scripts/migrate-to-postgres.js` e/ou `node scripts/sync-sheets-to-postgres.js` |
