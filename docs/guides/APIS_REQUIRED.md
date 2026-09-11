# 🔑 APIs e Tokens Necessários

## ✅ Já Configurado

### 1. Google Sheets API
- ✅ Service Account criada
- ✅ JSON de credenciais configurado
- ✅ Sheet compartilhado
- **Custo:** GRÁTIS

### 2. PageSpeed Insights API
- ✅ API Key: `AIzaSy_SUA_API_KEY_AQUI`
- **Custo:** GRÁTIS (25.000 requisições/dia)

---

## 🆕 Precisa Configurar

### 3. Groq API (IA - Recomendado)
**O que é:** API de IA ultrarrápida (Llama 3.1 70B)

**Como obter:**
1. Acesse: https://console.groq.com/
2. Crie conta (grátis)
3. Vá em "API Keys"
4. Crie uma nova key
5. Cole no `.env`:
   ```env
   GROQ_API_KEY=gsk_xxxxxxxxxxxxx
   ```

**Custo:** 
- GRÁTIS: 30 requisições/minuto
- Pago: $0.59 por 1M tokens (muito barato)

**Alternativa:** Se não configurar, usa análise básica (sem IA)

---

## 📊 Resumo de Custos

| Serviço | Custo Mensal | Limite Grátis |
|---------|--------------|---------------|
| Google Sheets API | GRÁTIS | Ilimitado |
| PageSpeed API | GRÁTIS | 25k/dia |
| Groq API | GRÁTIS | 30 req/min |
| **TOTAL** | **€0** | **Suficiente para 1000+ análises/dia** |

---

## 🚀 Setup Rápido

```bash
# 1. Obter Groq API Key
https://console.groq.com/keys

# 2. Adicionar ao .env
echo "GROQ_API_KEY=gsk_sua_key_aqui" >> backend/.env

# 3. Reiniciar backend
npm run dev
```

---

## 🎯 O Que Cada API Faz

### Google Sheets API
- Lê leads do Google Sheets
- Atualiza status de análise

### PageSpeed API
- Performance Score
- Core Web Vitals (LCP, CLS, FID)
- Tempo de carregamento

### Groq API (IA)
- Lead Scoring inteligente
- Análise de tom de voz
- Email personalizado
- Priorização automática
- Insights de negócio

---

## ⚠️ Importante

**Sem Groq API:**
- ✅ Todas as análises técnicas funcionam
- ✅ SEO, Security, Accessibility, Tracking
- ❌ Análise de IA desabilitada
- ❌ Emails menos personalizados

**Com Groq API:**
- ✅ Tudo acima +
- ✅ Lead Scoring com IA
- ✅ Emails ultra-personalizados
- ✅ Insights de negócio automáticos
- ✅ Priorização inteligente

---

## 🔒 Segurança

**NUNCA commite o .env!**

O `.gitignore` já está configurado para proteger:
- `.env`
- `google-credentials.json`

---

## 📈 Escalabilidade

Com as APIs gratuitas você pode:
- ✅ Analisar 1000+ sites/dia
- ✅ Processar 30 análises/minuto
- ✅ Custo zero

Para escalar mais:
- Groq Pro: $0.59/1M tokens
- PageSpeed: Sem limite pago
- Google Sheets: Sempre grátis

---

**Sistema 100% operacional com apenas 1 API key adicional (Groq)! 🚀**
