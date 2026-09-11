# 🎯 Pitch para Recrutadores

## O Problema

Empresas de marketing digital perdem **horas** analisando manualmente sites de leads:
- Verificando performance no PageSpeed
- Procurando pixels de conversão no código-fonte
- Avaliando qualidade de CTAs
- Escrevendo emails personalizados

## A Solução

**CRM Deals Manager** é uma solução de Sales-Ops que automatiza 90% desse processo.

## Fluxo de Dados

```
Google Sheets (Base de Leads)
    ↓
Backend Node.js (Orquestração)
    ├─→ PageSpeed API (Performance)
    ├─→ Puppeteer (Detecção de Pixels)
    └─→ OpenAI GPT-4o (Análise de CTA)
    ↓
Dashboard React (Painel Tático)
    ↓
Email Automático (n8n/Nodemailer)
```

## Stack Técnica

### Backend (Node.js + Express)
- **Google Sheets API**: Fonte de dados (sem banco de dados tradicional)
- **PageSpeed API**: Score de performance (SEO)
- **Puppeteer**: Web scraping para detectar pixels (Meta/GA4)
- **OpenAI GPT-4o**: Análise semântica de CTAs
- **Nodemailer/n8n**: Envio de emails

### Frontend (React + Vite)
- **Tailwind CSS**: Design system moderno
- **Lucide React**: Ícones
- **Axios**: Comunicação com API
- **UI/UX 2026**: Dark mode, gradientes, micro-interações

## Diferenciais Técnicos

1. **Arquitetura Serverless-Ready**: Pode rodar em AWS Lambda/Vercel
2. **Multi-API Orchestration**: 3 APIs diferentes trabalhando em paralelo
3. **IA Generativa**: Não é regex, é análise semântica real
4. **Real-time Dashboard**: Atualização instantânea de status
5. **Zero Database**: Google Sheets como banco de dados (reduz custos)

## Demonstração ao Vivo

### 1. Mostrar o Dashboard
- "Este é o painel de comando. Cada linha é um lead."
- "Veja os filtros: posso ver apenas leads sem pixel, ou com performance baixa."

### 2. Clicar em "Analisar"
- "Ao clicar, o sistema dispara 3 análises simultâneas."
- "Em 10 segundos, tenho um diagnóstico completo."

### 3. Abrir o Relatório
- "Este drawer mostra o relatório detalhado."
- "Performance, pixels, CTAs... tudo automatizado."

### 4. Mostrar o Email
- "O sistema já gerou um email personalizado."
- "Baseado nos dados reais da análise."
- "Um clique e o email é enviado via n8n."

## Métricas de Impacto

- **Tempo de análise manual**: ~15 minutos por lead
- **Tempo com o sistema**: ~10 segundos
- **Redução de tempo**: 98.9%
- **Escalabilidade**: 100+ leads/hora

## Próximos Passos (Roadmap)

- [ ] Análise de concorrentes (comparar com top 3 do nicho)
- [ ] Score de "Probabilidade de Conversão" (ML)
- [ ] Integração com CRMs (HubSpot, Pipedrive)
- [ ] Relatórios em PDF automatizados
- [ ] Dashboard de métricas (taxa de resposta, conversão)

## Como Apresentar

**Não diga:** "Fiz um sistema que lê o Google Sheets e analisa sites."

**Diga:** "Desenvolvi uma solução de Sales Intelligence que processa múltiplas APIs em paralelo, utiliza IA generativa para análise semântica, e entrega um dashboard tático que reduz o ciclo de prospecção em 90%. O sistema é serverless-ready e pode escalar para milhares de leads sem custo adicional de infraestrutura."

---

## Perguntas Comuns

**P: Por que Google Sheets e não um banco de dados?**  
R: Reduz complexidade, custo zero, e os times de vendas já usam Sheets. É uma decisão de produto, não técnica.

**P: Como você garante que o Puppeteer não seja bloqueado?**  
R: User-agent rotation, headless mode, e fallback para Cheerio em caso de bloqueio.

**P: E se a OpenAI ficar cara?**  
R: Cache de análises, rate limiting, e possibilidade de usar modelos locais (Llama 3).

**P: Isso escala?**  
R: Sim. Com filas (Bull/Redis) e workers, pode processar 10k+ leads/dia.
