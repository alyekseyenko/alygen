# Alygen CRM — Enterprise Architecture Specification (ARCHITECTURE.md)

Este documento descreve a arquitetura técnica, fluxo de dados e os princípios de design de alto desempenho adotados no ecossistema Alygen CRM.

---

## 1. Visão Geral da Arquitetura

O sistema é construído como uma aplicação híbrida de microsserviços acoplados de forma assíncrona, operando com uma filosofia **Python-First** para análise pesada de dados, e **Node.js** para orquestração de APIs e frontend em tempo real.

```
                  ┌──────────────────────┐
                  │   Vite + React UI    │
                  └──────────┬───────────┘
                             │ REST / SWR
                             ▼
                  ┌──────────────────────┐
                  │  Express API (4000)  │
                  └──────────┬───────────┘
                             │ python-bridge
                             ▼
                  ┌──────────────────────┐
                  │ FastAPI Engine (3003)│
                  └──────────────────────┘
```

---

## 2. Divisão de Responsabilidades

### A. Frontend (React 19 + Vite)
- **TanStack Query (SWR):** Cache inteligente e deduplicação de requisições de rede.
- **Three.js / React Flow:** Visualizações interativas 3D e canvas de automação.

### B. Gateway de Orquestração (Node.js + Express)
- **Gestão de Filas:** Gerencia a fila persistente de leads pendentes para análise.
- **Integração de Canais:** Dispara templates via Nodemailer (e-mail) ou WhatsApp Web.js.
- **Telegram Bot:** Hub de aprovação humana inline para envio de e-mails em lote.

### C. Motor Analítico Principal (FastAPI + Python 3.12+)
- **FastAPI Engine (Porta 3003):** Executa de forma assíncrona todas as análises pesadas.
- **NumPy Vectorization:** Calcula o Q-Score utilizando operações vetorizadas de alta velocidade.
- **lxml/selectolax Parsing:** Realiza análises de acessibilidade WCAG em sub-milisegundos.
- **Playwright Stealth:** Scraping de sites pesados em JS, capturas em PDF e rankings de Google.
- **LangChain Core:** Orquestração de agentes de IA para inteligência de concorrentes locais.
- **RandomForest Model:** Treina e avalia a probabilidade de fecho de cada negócio.

---

## 3. Estratégia de Resiliência de Dados
Para garantir 100% de estabilidade, o Alygen CRM usa um padrão de **Triple Fallback**:
1. **Swift Fetch:** Chamada HTTP rápida e assíncrona com `httpx` (timeout de 3s).
2. **Stealth Browser:** Se falhar ou for bloqueado por anti-bots, inicia navegador `Playwright Stealth`.
3. **Google PageSpeed API:** Fallback final consultando diretamente o motor do Google Lighthouse.
