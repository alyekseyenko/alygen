# 🆓 APIs GRATUITAS - Alternativas ao OpenAI

## 🚀 GROQ (RECOMENDADO - GRÁTIS E RÁPIDO)

### **Por que Groq?**
- ✅ **100% GRATUITO** (sem cartão de crédito)
- ✅ **SUPER RÁPIDO** (mais rápido que GPT-4)
- ✅ **Modelos potentes** (Llama 3.3 70B)
- ✅ **API compatível** com OpenAI

### **Como Configurar:**

1. **Criar conta:**
   - Acesse: https://console.groq.com
   - Faça login com Google/GitHub
   - Sem cartão de crédito necessário!

2. **Gerar API Key:**
   - Vá em: https://console.groq.com/keys
   - Clique em "Create API Key"
   - Copie a key: `gsk-...`

3. **Configurar no `.env`:**
```env
OPENAI_API_KEY=gsk-sua-key-aqui
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
```

4. **Reiniciar backend:**
```bash
cd backend
npm run dev
```

---

## 🌐 OUTRAS ALTERNATIVAS GRATUITAS

### **1. OpenRouter**
- **Site:** https://openrouter.ai
- **Créditos:** $5 grátis
- **Modelos:** GPT-4, Claude, Llama, etc.

```env
OPENAI_API_KEY=sk-or-sua-key-aqui
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=meta-llama/llama-3.3-70b-instruct
```

### **2. Together AI**
- **Site:** https://together.ai
- **Créditos:** $25 grátis
- **Modelos:** Llama, Mixtral, etc.

```env
OPENAI_API_KEY=sua-key-aqui
OPENAI_BASE_URL=https://api.together.xyz/v1
OPENAI_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo
```

### **3. Hugging Face (Inference API)**
- **Site:** https://huggingface.co
- **Grátis:** Sim (rate limited)
- **Modelos:** Llama, Mistral, etc.

```env
OPENAI_API_KEY=hf_sua-key-aqui
OPENAI_BASE_URL=https://api-inference.huggingface.co/models
OPENAI_MODEL=meta-llama/Meta-Llama-3-70B-Instruct
```

---

## 🔧 CONFIGURAÇÃO NO CÓDIGO

O sistema já está preparado! Só precisa configurar o `.env`:

```javascript
// backend/services/openai-service.js (já configurado)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
});

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
```

---

## 📊 COMPARAÇÃO

| Provedor | Grátis | Velocidade | Qualidade | Limite |
|----------|--------|------------|-----------|--------|
| **Groq** | ✅ Sim | 🚀 Muito rápido | ⭐⭐⭐⭐ | 30 req/min |
| OpenRouter | 💰 $5 créditos | ⚡ Rápido | ⭐⭐⭐⭐⭐ | Varia |
| Together AI | 💰 $25 créditos | ⚡ Rápido | ⭐⭐⭐⭐ | 60 req/min |
| Hugging Face | ✅ Sim | 🐌 Lento | ⭐⭐⭐ | Rate limited |
| OpenAI | ❌ Pago | ⚡ Rápido | ⭐⭐⭐⭐⭐ | Pago |

---

## 🎯 RECOMENDAÇÃO

**Use Groq!** É:
- 100% gratuito
- Mais rápido que GPT-4
- Sem cartão de crédito
- API compatível

---

## 🧪 TESTAR

Depois de configurar, teste:

```bash
cd backend
node test-openai.js
```

Ou analise um lead no frontend e veja se os erros de AI sumiram!

---

## ❓ PROBLEMAS?

### **Erro: 401 Unauthorized**
- API key inválida
- Verifique se copiou corretamente

### **Erro: 429 Rate Limit**
- Muitas requisições
- Aguarde 1 minuto

### **Erro: 400 Bad Request**
- Modelo inválido
- Verifique `OPENAI_MODEL` no `.env`

---

**Quer que eu crie um script de teste para verificar se a API está funcionando?** 🚀
