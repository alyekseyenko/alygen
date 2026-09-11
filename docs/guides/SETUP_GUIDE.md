# ⚡ Setup Completo - Passo a Passo

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta Google (para Google Sheets API)
- Conta OpenAI (para análise de CTAs)

---

## 🚀 Passo 1: Instalar Dependências

```bash
# Backend
cd backend
npm install

# Frontend (novo terminal)
cd frontend
npm install
```

---

## 🔑 Passo 2: Configurar Google Sheets API

### 2.1 Criar Service Account

1. Acesse: https://console.cloud.google.com/
2. Crie um projeto: "CRM Deals Manager"
3. Ative a **Google Sheets API**:
   - Menu → APIs & Services → Library
   - Busque "Google Sheets API" → Enable

4. Criar credenciais:
   - Menu → APIs & Services → Credentials
   - Create Credentials → Service Account
   - Nome: `crm-sheets-reader`
   - Role: **Viewer**
   - Done

5. Gerar chave JSON:
   - Clique na service account criada
   - Keys → Add Key → Create new key → JSON
   - Baixe o arquivo

### 2.2 Compartilhar o Google Sheet

1. Abra: https://docs.google.com/spreadsheets/d/1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY/edit

2. Clique em **Compartilhar**

3. Cole o email da service account (do JSON):
   ```
   crm-sheets-reader@seu-projeto.iam.gserviceaccount.com
   ```

4. Permissão: **Viewer**

5. Desmarque "Notify people"

6. **Compartilhar**

### 2.3 Configurar .env

Abra o JSON baixado e copie:

```json
{
  "client_email": "crm-sheets-reader@projeto.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

Crie `backend/.env`:

```env
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=crm-sheets-reader@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nCOLE_A_CHAVE_COMPLETA_AQUI\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY

# OpenAI (adicione depois)
OPENAI_API_KEY=sk-seu-key-aqui

# Server
PORT=3001
```

**⚠️ IMPORTANTE:** Mantenha as aspas duplas e os `\n` na private key!

---

## ✅ Passo 3: Testar Conexão

```bash
cd backend
npm run test:sheets
```

**Resultado esperado:**
```
✅ Conexão bem-sucedida!
📊 Total de leads encontrados: 50

📋 Primeiros 3 leads:
1. Empresa ABC
   Website: https://abc.com
   ...
```

**Se der erro:**
- Aguarde 1-2 minutos após compartilhar o Sheet
- Verifique se copiou a private key completa
- Confirme que o Sheet ID está correto

---

## 🤖 Passo 4: Configurar OpenAI (Opcional)

1. Acesse: https://platform.openai.com/api-keys
2. Create new secret key
3. Copie a key (começa com `sk-proj-...`)
4. Adicione no `.env`:

```env
OPENAI_API_KEY=sk-proj-sua-key-aqui
```

**Nota:** Sem a OpenAI key, a análise de CTAs não funcionará, mas o resto sim.

---

## 🎨 Passo 5: Iniciar Aplicação

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

**Saída esperada:**
```
🚀 Backend rodando em http://localhost:3001
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

**Saída esperada:**
```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:3000/
```

---

## 🌐 Passo 6: Acessar Dashboard

1. Abra: http://localhost:3000
2. Clique no ícone ☀️/🌙 para alternar tema
3. Os leads devem aparecer automaticamente
4. Clique em **Analisar** em um lead

---

## 🔍 Estrutura do Google Sheet

O sistema busca dados da **aba "Results"**:

| Coluna | Uso |
|--------|-----|
| title | Nome do negócio |
| website | URL (obrigatório) |
| phone | Telefone |
| rating | Avaliação |
| reviews | Número de reviews |
| type | Tipo de negócio |
| address | Endereço |

**Apenas linhas com `website` preenchido serão importadas.**

---

## 🐛 Troubleshooting

### Backend não inicia
```bash
# Reinstalar dependências
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend não inicia
```bash
# Reinstalar dependências
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### "Cannot connect to backend"
- Verifique se o backend está rodando na porta 3001
- Confirme que não há firewall bloqueando

### "Google Sheets API error"
- Aguarde 2 minutos após compartilhar
- Verifique se a private key está completa no .env
- Confirme que o Sheet ID está correto

### Nenhum lead aparece
- Verifique se a aba "Results" existe
- Confirme que a coluna `website` está preenchida
- Execute: `npm run test:sheets` para debugar

---

## 📊 Fluxo Completo

1. **Carregar Leads** → Sistema busca do Google Sheets
2. **Analisar Lead** → 3 APIs em paralelo (10s)
   - PageSpeed: Performance
   - Puppeteer: Pixels (Meta/GA4)
   - OpenAI: Análise de CTAs
3. **Ver Relatório** → Drawer com análise completa
4. **Copiar Email** → Template personalizado
5. **Enviar Email** → Via n8n ou Nodemailer

---

## 🎯 Próximos Passos

1. ✅ Testar com 2-3 leads
2. ✅ Personalizar templates de email
3. ✅ Configurar n8n (opcional)
4. ✅ Deploy em produção (Railway + Vercel)

---

## 📚 Documentação Adicional

- **[SHEET_CONFIG.md](SHEET_CONFIG.md)** - Detalhes do Google Sheet
- **[API_DOCS.md](API_DOCS.md)** - Endpoints da API
- **[DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)** - Sistema de design
- **[DEPLOY.md](DEPLOY.md)** - Deploy em produção

---

**Sistema pronto para uso! 🚀**
