# Alygen Multi-Agent AI System (AGENTS.md)

**English reference (portfolio):** [docs/architecture/AGENTS.md](docs/architecture/AGENTS.md)

O Alygen CRM utiliza uma arquitetura **Multi-Agent Orchestrator** para enriquecer a prospeção com inteligência profunda de mercado local.

## 👥 Agentes e Responsabilidades

A análise de inteligência de mercado (/agent/market-intel) segue um padrão de cadeia (chain of agents) sequencial assíncrona:

```
[ Lead Website/Metadata ] 
          │
          ▼
🕵️ Agente Investigador (Researcher) ──► Pesquisa concorrentes reais locais no DuckDuckGo
          │
          ▼
📉 Agente Estrategista (Strategist) ──► Identifica fraquezas, forças e "Hook de Vendas"
          │
          ▼
✍️ Agente Sintetizador (Synthesizer) ──► Redige veredicto em Português Europeu
          │
          ▼
[ Veredicto Persuasivo de Elite ]
```

### 1. 🕵️ Agente Investigador (Researcher Agent)
- **Objetivo:** Encontrar concorrentes diretos reais na área geográfica (cidade/distrito) do lead.
- **Ferramentas:** DuckDuckGo Search.
- **Funcionamento:** Pesquisa termos como `"[setor] em [cidade] concorrentes portugal"` excluindo o próprio nome e site do lead para evitar duplicidade.

### 2. 📉 Agente Estrategista (Strategist Agent)
- **Objetivo:** Cruzar dados de desempenho técnico obtidos nas auditorias (Lighthouse, SSL, pixels) com dados dos concorrentes detetados.
- **Funcionamento:** Formula o posicionamento estratégico, destacando o "Content Gap" (lacunas de conteúdo) ou "Technical Gap" (performance inferior) que o lead apresenta frente aos concorrentes reais.

### 3. ✍️ Agente Sintetizador (Synthesizer Agent)
- **Objetivo:** Transformar dados brutos e análises de mercado em copy persuasiva, humana e direta, em Português Europeu (PT-PT).
- **Tom de Voz:** Consultor sénior de vendas, direto, elegante e urgente (Voz de Consultoria Estratégica Alygen).
- **Fórmula:** "Identificámos que [RIVAL A] e [RIVAL B] dominam em [X]. Para superar isto, o/a [NAME] deve [AÇÃO]."

---

## Resiliência e fallback
Se DuckDuckGo ou Groq falharem:
1. Usar concorrentes internos do CRM (mesma cidade/setor, Q-Score ≥ 50).
2. Fallback heurístico **sem nomes fictícios** — apenas recomendações setoriais em PT-PT.
3. Nunca HTTP 500 por falha do agente; responder `{ success: false, error }` ou texto de fallback.

## Runtime (2026)
- **Motor único:** [backend_python/services/agent_orchestration.py](backend_python/services/agent_orchestration.py) em `PYTHON_FASTAPI_URL` (porta 3003).
- **Dados:** Postgres local + pgvector (`docker compose up postgres`). Runtime Node usa [backend/db/local-client.js](backend/db/local-client.js), não Supabase.
- **Contexto:** [backend_python/context/context_builder.py](backend_python/context/context_builder.py) + tabelas `documents` / `document_chunks` (migração 004).
- **Prompts versionados:** [backend_python/prompts/](backend_python/prompts/).
- **MCP:** servidor CRM em `npm run mcp` ([backend/mcp/server.js](backend/mcp/server.js)); allowlist em [backend_python/config/mcp_servers.json](backend_python/config/mcp_servers.json).
- **Specs:** cada feature nova em [specs/](specs/) antes do código.
