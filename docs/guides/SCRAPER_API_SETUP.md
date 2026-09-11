# 🔍 Configuração ScraperAPI para Google Ranking

## ✅ Vantagens do ScraperAPI

- ✅ **1000 requests/mês GRÁTIS** (vs 100/dia do Google)
- ✅ Resultados reais do Google
- ✅ Sem necessidade de criar Custom Search Engine
- ✅ Rotação automática de IPs
- ✅ Bypass de CAPTCHAs

---

## 🚀 Passo a Passo (2 minutos)

### 1. Criar Conta Grátis

1. Acesse: https://www.scraperapi.com/signup
2. Preencha:
   - Email
   - Senha
3. Clique em **Sign Up**
4. Confirme o email

### 2. Obter API Key

1. Faça login: https://www.scraperapi.com/dashboard
2. Na página inicial, você verá sua **API Key**
3. Copie a chave (algo como: `abc123def456ghi789jkl`)

### 3. Configurar no Projeto

Adicione ao arquivo `.env`:

```env
SCRAPER_API_KEY=sua_api_key_aqui
```

### 4. Testar

Execute no backend:

```bash
node test-scraper-api.js
```

---

## 📊 Limites do Plano Grátis

| Recurso | Limite |
|---------|--------|
| Requests/mês | 1000 |
| Concurrent requests | 5 |
| Geolocation | ✅ Portugal |
| JavaScript rendering | ❌ (plano pago) |

---

## 💡 Como Funciona

```javascript
// Busca no Google via ScraperAPI
const googleUrl = 'https://www.google.com/search?q=Imobiliária+Lisboa';

const response = await axios.get('http://api.scraperapi.com', {
  params: {
    api_key: 'sua_api_key',
    url: googleUrl,
    country_code: 'pt'
  }
});

// Retorna HTML dos resultados do Google
// Sistema extrai posições automaticamente
```

---

## 🎯 Uso no Sistema

O sistema vai:

1. Gerar keywords baseadas no negócio e localização
2. Buscar cada keyword no Google (via ScraperAPI)
3. Extrair posições dos resultados
4. Calcular score de visibilidade (0-100)
5. Integrar ao Q Score (peso de 15%)

---

## ⚠️ Dicas

- **Economize requests:** Sistema busca máximo 5 keywords por lead
- **Cache:** Resultados são salvos no Google Sheets
- **Delay:** 2 segundos entre cada busca para evitar rate limit

---

## 🆙 Upgrade (Opcional)

Se precisar de mais requests:

| Plano | Requests/mês | Preço |
|-------|--------------|-------|
| Hobby | 1,000 | Grátis |
| Startup | 100,000 | $49/mês |
| Business | 1,000,000 | $249/mês |

---

## 🔗 Links Úteis

- Dashboard: https://www.scraperapi.com/dashboard
- Documentação: https://www.scraperapi.com/documentation
- Pricing: https://www.scraperapi.com/pricing

---

## ✅ Pronto!

Depois de configurar, o sistema de ranking vai funcionar automaticamente em cada análise! 🚀
