# 🔑 Como Criar Service Account - Passo a Passo

## ⚠️ IMPORTANTE
Você criou um **OAuth Client ID**, mas precisa de uma **Service Account**.

---

## 📝 Passo a Passo Correto

### 1️⃣ Acessar Google Cloud Console
```
https://console.cloud.google.com/
```

### 2️⃣ Selecionar ou Criar Projeto
- Se já tem projeto: Selecione no topo
- Se não: Clique em "Novo Projeto" → Nome: "CRM Deals Manager"

### 3️⃣ Ativar Google Sheets API
1. Menu lateral → **APIs & Services** → **Library**
2. Buscar: "Google Sheets API"
3. Clicar em **Enable**

### 4️⃣ Criar Service Account (NÃO OAuth!)
1. Menu lateral → **APIs & Services** → **Credentials**
2. Clicar em **+ CREATE CREDENTIALS** (topo)
3. Selecionar: **Service account** (NÃO "OAuth client ID")
4. Preencher:
   - Service account name: `crm-sheets-reader`
   - Service account ID: (gerado automaticamente)
   - Description: "CRM Deals Manager - Read Google Sheets"
5. Clicar em **CREATE AND CONTINUE**
6. Role: Selecionar **Basic** → **Viewer**
7. Clicar em **CONTINUE**
8. Clicar em **DONE**

### 5️⃣ Gerar Chave JSON
1. Na lista de Service Accounts, clicar na que você criou
2. Ir na aba **KEYS**
3. Clicar em **ADD KEY** → **Create new key**
4. Tipo: **JSON**
5. Clicar em **CREATE**
6. Um arquivo JSON será baixado automaticamente

### 6️⃣ Copiar Credenciais do JSON

Abra o arquivo JSON baixado. Ele terá este formato:

```json
{
  "type": "service_account",
  "project_id": "seu-projeto-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "crm-sheets-reader@seu-projeto-123456.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

**Copie apenas 2 campos:**

1. **client_email** (exemplo: `crm-sheets-reader@projeto.iam.gserviceaccount.com`)
2. **private_key** (começa com `-----BEGIN PRIVATE KEY-----`)

### 7️⃣ Colar no .env

Edite `backend/.env`:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=crm-sheets-reader@seu-projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

**⚠️ IMPORTANTE:**
- Mantenha as aspas duplas `"` ao redor da private_key
- Mantenha os `\n` (quebras de linha)
- Cole a chave COMPLETA (é longa, ~1600 caracteres)

### 8️⃣ Compartilhar o Google Sheet

1. Abra: https://docs.google.com/spreadsheets/d/1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY/edit

2. Clicar em **Compartilhar** (botão verde no topo direito)

3. No campo "Adicionar pessoas e grupos", cole o email da service account:
   ```
   crm-sheets-reader@seu-projeto.iam.gserviceaccount.com
   ```

4. Permissão: **Viewer** (apenas visualização)

5. **DESMARCAR** a opção "Notificar pessoas"

6. Clicar em **Compartilhar**

### 9️⃣ Testar

```bash
cd backend
npm run check
```

**Resultado esperado:**
```
✅ Google Service Account Email (OBRIGATÓRIO)
✅ Google Private Key (OBRIGATÓRIO)
✅ Google Sheet ID (OBRIGATÓRIO)
✅ PageSpeed API Key (OPCIONAL)
```

Depois:
```bash
npm run test:sheets
```

**Resultado esperado:**
```
✅ Conexão bem-sucedida!
📊 Total de leads encontrados: 50
```

---

## 🆘 Troubleshooting

### "The caller does not have permission"
- Aguarde 1-2 minutos após compartilhar o Sheet
- Verifique se compartilhou com o email CORRETO da service account

### "No key or keyFile set"
- Verifique se copiou a private_key COMPLETA
- Confirme que manteve as aspas duplas e os `\n`

### "Cannot find module"
- Execute: `npm install` no diretório backend

---

## ✅ Checklist Final

- [ ] Service Account criada (NÃO OAuth Client)
- [ ] JSON baixado
- [ ] client_email copiado para .env
- [ ] private_key copiado para .env (completo)
- [ ] Sheet compartilhado com o email da service account
- [ ] `npm run check` passou
- [ ] `npm run test:sheets` retornou leads

---

**Após completar, execute: `npm run dev` 🚀**
