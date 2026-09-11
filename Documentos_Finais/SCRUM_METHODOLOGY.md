# Alygen CRM v4.6: Scrum Methodology & Sprint Breakdown
### Project Management & Agile Architecture (PSM I Framework)

Este documento detalha a aplicação prática da metodologia **Scrum** no desenvolvimento do Alygen CRM, demonstrando como as competências de **Professional Scrum Master™ I** foram aplicadas para transformar uma visão complexa em incrementos de produto funcionais e de alto valor.

---

## 📋 Framework Scrum Aplicado

Para garantir a agilidade e a resposta rápida a falhas técnicas (fail-fast), o projeto foi dividido em **5 Sprints de 1 semana**, focadas em entregar valor quantificável ao final de cada iteração.

### Artifacts Técnicos:
- **Product Backlog:** Centralizado no Notion/Jira para rastreio de User Stories.
- **Sprint Backlog:** Foco em tickets de engenharia (Backend, AI, WebGL).
- **Increment:** Demonstração funcional das capacidades de auditoria e automação.

---

## 🗺️ Arquitetura do Produto & Sitemap

Para além da metodologia, o projeto foi estruturado em módulos funcionais que compõem o ecossistema Alygen:

### Páginas do Sistema (Sitemap)
- **📊 [Dashboard Central](file:///c:/Users/Habitarmos/Desktop/Nova%20pasta%20%282%29/CRM%20Deals%20Manager/frontend/src/pages/Dashboard.jsx):** Visão panorâmica de saúde do negócio, taxas de conversão e volume de leads.
- **🗂️ [Pipeline (Kanban)](file:///c:/Users/Habitarmos/Desktop/Nova%20pasta%20%282%29/CRM%20Deals%20Manager/frontend/src/pages/Pipeline.jsx):** Gestão visual de oportunidades com Drag & Drop e sincronização instantânea com Supabase.
- **🌐 [Universo 3D](file:///c:/Users/Habitarmos/Desktop/Nova%20pasta%20%282%29/CRM%20Deals%20Manager/frontend/src/pages/Universo.jsx):** Visualização massiva de dados em WebGL (Three.js) para análise de clusters de mercado.
- **🤖 [Health & Automation](file:///c:/Users/Habitarmos/Desktop/Nova%20pasta%20%282%29/CRM%20Deals%20Manager/frontend/src/pages/Automation.jsx):** Painel de controlo de orquestradores n8n, scrapers e monitorização de uptime de microserviços.
- **📧 [Follow-ups & Sequences](file:///c:/Users/Habitarmos/Desktop/Nova%20pasta%20%282%29/CRM%20Deals%20Manager/frontend/src/pages/Followups.jsx):** Motor de sequências de e-mail automatizadas com rastreio de abertura (pixel tracking).
- **📅 [Meetings Hub](file:///c:/Users/Habitarmos/Desktop/Nova%20pasta%20%282%29/CRM%20Deals%20Manager/frontend/src/pages/Meetings.jsx):** Integração com Calendly para fecho automático de reuniões no fluxo do CRM.
- **📑 [Templates Management](file:///c:/Users/Habitarmos/Desktop/Nova%20pasta%20%282%29/CRM%20Deals%20Manager/frontend/src/pages/Templates.jsx):** Editor de design sistémico para e-mails de outreach e propostas.
- **🔬 [AI Lab (Tester)](file:///c:/Users/Habitarmos/Desktop/Nova%20pasta%20%282%29/CRM%20Deals%20Manager/frontend/src/pages/Tester.jsx):** Ambiente de teste para o Agente RAG e validações de Prompt Engineering.

---

## 🚀 Matriz de Funcionalidades (Feature Matrix)

O Alygen v4.6 não é apenas um CRM, é um ecossistema de venda consultiva:
1.  **Agentic AI Orchestrator:** Pesquisa autónoma via DuckDuckGo + Groq para análise de concorrência local.
2.  **Machine Learning Preditivo:** Algoritmo RandomForest que prevê a probabilidade de fecho (0-100%) baseado em 15 features.
3.  **Visual Data Storytelling:** Renderização 3D de saúde digital do cliente para máxima perceção de valor.
4.  **Auto-Mockup Engine:** Captura automática do site do lead injetado em representações de dispositivos móveis.
5.  **Multi-Tenant Architecture:** Isolamento de dados via Postgres RLS para suporte a múltiplas agências.
6.  **Real-Time Bridge:** Integração bidirecional entre Google Sheets e Dashboard via Node.js Webhooks.

---

## 🏃 Sprint Breakdown

### Sprint 1: Fundação & Extração Massiva (Harvesting)
**Objetivo:** Estabelecer a infraestrutura core e a capacidade de captar dados brutos.
- **Backlog Items:**
  - Setup do Supabase com Row Level Security (RLS).
  - Implementação do Scraper multithread (n8n + Python).
  - Arquitetura de base de dados para 10.000+ leads.
- **Definição de Pronto (DoD):** Dados injetados no Supabase e visíveis no dashboard básico.

### Sprint 2: Inteligência Preditiva & Refinamento (Brain)
**Objetivo:** Transformar dados brutos em "Business Intelligence".
- **Backlog Items:**
  - Integração do motor Machine Learning (RandomForest) para cálculo de ROI.
  - Desenvolvimento do sistema **Q-Score** (algoritmo de 15 métricas).
  - Configuração do orquestrador de busca (LangChain + DuckDuckGo).
- **Definição de Pronto (DoD):** Cálculo de probabilidade de conversão funcional por Lead.

### Sprint 3: Automação de Alcance (Outreach)
**Objetivo:** Conectar a inteligência ao cliente final de forma automatizada.
- **Backlog Items:**
  - Motor de templates dinâmicos em React-Email.
  - Integração com o Gateway de Telegram para notificações em tempo real.
  - Implementação do Kanban interativo para gestão de Pipeline.
- **Definição de Pronto (DoD):** Envio de email personalizado com dados dinâmicos da análise.

### Sprint 4: Storytelling Visual & Humanização (UX/UI)
**Objetivo:** Elevar a percepção de valor e remover barreiras de comunicação.
- **Backlog Items:**
  - Desenvolvimento da visualização 3D de dados (WebGL/Three.js).
  - Engine de capturas automatizadas para mockups de dispositivos.
  - **Refactor de Linguagem:** Remoção total de "Jargão AI" para humanizar o tom do email.
- **Definição de Pronto (DoD):** Leads visualizam os problemas do seu site num ecrã 3D premium.

### Sprint 5: Hardening & Preparação de Mercado (Launch)
**Objetivo:** Estabilização e documentação técnica para stakeholders.
- **Backlog Items:**
  - Implementação de sistema de cache para evitar regeneração desnecessária de análise.
  - Auditoria final de performance (Core Web Vitals) no CRM.
  - Criação da documentação técnica e arquitetural (Technical Spec).
- **Definição de Pronto (DoD):** Sistema pronto para operação comercial v1.0.

---

## 📊 Métricas de Agilidade (Metrics)

| Métrica | Resultado | Impacto |
| :--- | :--- | :--- |
| **Ciclo de Entrega** | 7 dias/Sprint | Iteração rápida para correção de bugs de API. |
| **Lead Time** | 4h | Tempo desde a descoberta do lead até ao email enviado. |
| **Value Delivered** | 18.000€ | Valor de funil qualificado nos primeiros 30 dias. |

---

> [!TIP]
> **Scrum Master Insight:** A utilização de Sprints curtas foi crucial para lidar com a volatilidade das APIs de Scraping e as mudanças frequentes nos modelos da Groq (Llama-3.1), permitindo pivotar a estratégia técnica em menos de 24 horas.

---
**Vadym Alyekseyenko**  
*Senior Solutions Architect & Professional Scrum Master™ I*
