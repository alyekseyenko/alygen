# Cost Guardrails & Budget Management (COST_GUARDRAILS.md)

Este documento estabelece as diretrizes de governança de custos e orçamentação para o ecossistema Alygen CRM, garantindo que o uso de APIs pagas e serviços cloud (GCP, Groq, PageSpeed) permaneça estritamente sob controlo.

---

## 🛡️ 1. Deterministic Caching (Bypass de Custo)

A regra número um para evitar custos desnecessários é o **cacheamento determinístico**:
- **Geração de Chave Unívoca:** Toda a URL de site analisada é convertida para uma chave MD5 (ex: `md5("https://exemplo.com")`).
- **SQLite Cache Layer:** Antes de acionar qualquer scraping Playwright, chamada PageSpeed API ou análise Groq, o sistema consulta a tabela local de cache.
- **Expiration Policy:** Os dados de análise são válidos por 14 dias (congelados em Supabase `full_analysis`). Consultas repetidas dentro desta janela retornam latência zero e custo zero.

---

## 💰 2. GCP & Cloud Run Budget Guardrails

Para o deploy do Alygen Python no Google Cloud Platform (GCP):
- **Scale-to-Zero (Cloud Run):** O contentor Docker deve ser configurado com o número mínimo de instâncias em `0` (`--min-instances 0`). Quando inativo, o custo do servidor é rigorosamente €0,00.
- **Concurrency & Limits:** Definir limite máximo de instâncias para `5` ou `10` (`--max-instances 10`) para prevenir faturamento excessivo sob ataques de DDoS ou loops infinitos de análise.
- **Billing Alerts:** Configurar alertas de cobrança no GCP Console para disparar e-mails automáticos quando o consumo mensal atingir 50%, 80% e 100% de um limite definido (ex: €10,00/mês).

---

## 🔑 3. Gestão e Rotação de Chaves de API (Groq & PageSpeed)

Para prevenir bloqueios por Rate Limits ou estouro de quotas:
- **Rate Limiters:** O FastAPI implementa restrições locais de até 10 requisições/minuto para análises de inteligência artificial pesadas por IP.
- **Groq Key Rotation:** Possibilidade de registar múltiplas chaves Groq em vetor. Em caso de erro `429 Too Many Requests`, o sistema roda para a próxima chave, mantendo alta disponibilidade de graça.
