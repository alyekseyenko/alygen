# Alygen Multi-Agent AI System (AGENTS.md)

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

## 🛡️ Resiliência & Graceful Degradation (Failsafe)
Se a pesquisa externa DuckDuckGo ou a Groq API sofrer interrupção:
1. **conhecimento Interno:** O Estrategista recorre a heurísticas locais com base no setor e distrito para gerar análises factuais credíveis.
2. **Uptime de 100%:** O sistema degrada graciosamente para insights estáticos predefinidos de alta relevância setorial em vez de quebrar e retornar erro HTTP 500.
