# 📧 Configuração SMTP - Envio de Emails

## 🎯 Opções Disponíveis

O sistema suporta **2 métodos** de envio de emails:

1. **n8n Webhook** (Recomendado para produção)
2. **SMTP Direto** (Gmail, Outlook, SendGrid, etc.)

---

## 📮 Opção 1: Gmail (Mais Fácil)

### Passo 1: Criar App Password

1. Acesse: https://myaccount.google.com/security
2. Ative **Verificação em 2 etapas** (se ainda não tiver)
3. Vá em **App Passwords**: https://myaccount.google.com/apppasswords
4. Selecione:
   - App: **Mail**
   - Device: **Windows Computer** (ou outro)
5. Clique em **Generate**
6. Copie a senha de 16 caracteres (ex: `abcd efgh ijkl mnop`)

### Passo 2: Configurar .env

```env
# SMTP Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu-email@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM_NAME=Alygen - Marketing Digital
```

### ✅ Pronto! Reinicie o backend.

---

## 📮 Opção 2: Outlook/Hotmail

### Configurar .env

```env
# SMTP Outlook
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=seu-email@outlook.com
SMTP_PASS=sua-senha-aqui
SMTP_FROM_NAME=Alygen - Marketing Digital
```

**Nota:** Outlook usa porta **587** (não 465)

---

## 📮 Opção 3: SendGrid (Profissional)

### Passo 1: Criar Conta

1. Acesse: https://sendgrid.com/
2. Crie conta gratuita (100 emails/dia)
3. Vá em **Settings** → **API Keys**
4. Crie uma API Key com permissão **Mail Send**

### Passo 2: Configurar .env

```env
# SMTP SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.sua-api-key-aqui
SMTP_FROM_NAME=Alygen - Marketing Digital
```

**Nota:** O username é literalmente `apikey`

---

## 📮 Opção 4: n8n Webhook (Avançado)

### Vantagens
- ✅ Mais controle
- ✅ Pode adicionar lógica (ex: salvar em CRM)
- ✅ Logs centralizados
- ✅ Retry automático

### Configurar .env

```env
# n8n Webhook
N8N_WEBHOOK_URL=https://sua-instancia-n8n.com/webhook/send-email
```

### Criar Workflow n8n

1. **Webhook Trigger**
   - Method: POST
   - Path: `/send-email`

2. **HTTP Request Node**
   - Method: POST
   - URL: `https://api.sendgrid.com/v3/mail/send` (ou outro)
   - Headers:
     ```json
     {
       "Authorization": "Bearer SG.sua-api-key",
       "Content-Type": "application/json"
     }
     ```
   - Body:
     ```json
     {
       "personalizations": [{
         "to": [{"email": "{{$json.to}}"}]
       }],
       "from": {"email": "seu-email@dominio.com"},
       "subject": "Oportunidade de Melhoria",
       "content": [{
         "type": "text/html",
         "value": "{{$json.body}}"
       }]
     }
     ```

---

## 🧪 Testar Configuração

### Método 1: Via Frontend

1. Analise um lead
2. Abra o drawer
3. Digite um email de teste
4. Clique em "Enviar Email"
5. Verifique o console do backend

### Método 2: Via cURL

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test",
    "recipient": "seu-email@teste.com",
    "emailBody": "Teste de email do CRM"
  }'
```

---

## 🐛 Troubleshooting

### Erro: "Invalid login"
- ✅ Gmail: Use **App Password**, não a senha normal
- ✅ Outlook: Verifique se 2FA está ativo
- ✅ Verifique se o email/senha estão corretos

### Erro: "Connection timeout"
- ✅ Verifique a porta (465 ou 587)
- ✅ Firewall pode estar bloqueando
- ✅ Tente trocar `secure: true` para `false`

### Erro: "Self signed certificate"
- ✅ Adicione no `.env`:
  ```env
  NODE_TLS_REJECT_UNAUTHORIZED=0
  ```

### Email não chega
- ✅ Verifique **Spam/Lixo Eletrônico**
- ✅ Gmail: Verifique "Todas as mensagens"
- ✅ Verifique logs do backend

---

## 📊 Logs do Backend

Quando enviar email, verá no console:

```
📧 Enviando email para: cliente@exemplo.com
➡️ Usando SMTP direto...
✅ Conexão SMTP verificada
✅ Email enviado via SMTP: <message-id>
```

---

## 🔒 Segurança

### ⚠️ NUNCA commite o .env!

O arquivo `.env` contém senhas. Certifique-se que está no `.gitignore`:

```gitignore
.env
.env.local
.env.production
```

### ✅ Boas Práticas

1. Use **App Passwords** (Gmail)
2. Use **API Keys** (SendGrid)
3. Nunca use senha principal
4. Rotacione credenciais regularmente
5. Use n8n em produção (mais seguro)

---

## 💡 Recomendações

### Para Desenvolvimento
✅ **Gmail** com App Password (mais fácil)

### Para Produção
✅ **SendGrid** (100 emails/dia grátis)  
✅ **n8n** + SendGrid (mais controle)  
✅ **AWS SES** (mais barato em escala)

---

## 📞 Suporte

Se tiver problemas:

1. Verifique logs do backend
2. Teste com cURL primeiro
3. Verifique firewall/antivírus
4. Tente outro provedor SMTP

---

**✅ Configuração completa! Agora pode enviar emails diretamente do CRM.**
