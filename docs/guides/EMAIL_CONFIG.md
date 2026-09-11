# 📧 Configuração de Envio de Emails

## Opções de Envio

### 📧 Extração Automática de Email

O sistema **extrai automaticamente** o email do site do cliente:

1. **Busca links mailto:** `<a href="mailto:contato@empresa.com">`
2. **Busca emails no texto:** Regex para encontrar padrões de email
3. **Filtra emails genéricos:** Remove example.com, test.com, etc.

**Prioridade de envio:**
1. Email extraído do site (mais confiável)
2. Phone do Google Sheets
3. Email do Google Sheets

**Exemplo de resultado:**
```json
{
  "extractedEmail": "contato@empresa.com",
  "performanceScore": 45,
  ...
}
```

---

### Opção 1: n8n Webhook (Recomendado)

1. **Criar workflow no n8n:**
   - Webhook Trigger
   - Email Node (Gmail/SMTP)

2. **Configurar .env:**
   ```env
   N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/send-email
   ```

3. **Payload enviado:**
   ```json
   {
     "leadId": 123,
     "to": "cliente@email.com",
     "body": "<html>Email personalizado...</html>",
     "timestamp": "2024-01-01T10:00:00.000Z"
   }
   ```

---

### Opção 2: SMTP Direto (Gmail)

1. **Ativar "App Passwords" no Gmail:**
   - https://myaccount.google.com/apppasswords
   - Criar senha de app

2. **Configurar .env:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_USER=seu-email@gmail.com
   SMTP_PASS=sua-senha-de-app
   ```

3. **Atualizar backend/services/email.js:**
   ```javascript
   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     secure: true,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS
     }
   });
   ```

---

### Opção 3: SendGrid API

1. **Criar conta SendGrid:**
   - https://sendgrid.com/

2. **Obter API Key**

3. **Configurar .env:**
   ```env
   SENDGRID_API_KEY=SG.xxxxx
   SENDGRID_FROM_EMAIL=seu-email@dominio.com
   ```

4. **Instalar:**
   ```bash
   npm install @sendgrid/mail
   ```

5. **Atualizar backend/services/email.js:**
   ```javascript
   import sgMail from '@sendgrid/mail';
   
   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
   
   export async function sendEmail({ recipient, emailBody }) {
     await sgMail.send({
       to: recipient,
       from: process.env.SENDGRID_FROM_EMAIL,
       subject: 'Oportunidade de Melhoria',
       html: emailBody
     });
   }
   ```

---

## Cache e Histórico

### Cache de Análises
- **Duração:** 7 dias
- **Local:** localStorage
- **Chave:** `analysis-${website}`

### Cache de Leads
- **Duração:** 1 hora
- **Local:** localStorage
- **Chave:** `crm-leads`

### Histórico de Emails
- **Local:** localStorage
- **Chave:** `email-history`
- **Formato:**
  ```json
  [
    {
      "leadId": 123,
      "leadName": "Empresa ABC",
      "recipient": "contato@abc.com",
      "sentAt": "2024-01-01T10:00:00.000Z"
    }
  ]
  ```

---

## Limpar Cache

```javascript
// No console do navegador (F12)
localStorage.clear()
```

Ou criar botão no frontend:

```jsx
<button onClick={() => {
  localStorage.removeItem('crm-leads')
  localStorage.removeItem('email-history')
  window.location.reload()
}}>
  Limpar Cache
</button>
```

---

## Testar Envio

```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": 1,
    "recipient": "teste@email.com",
    "emailBody": "<h1>Teste</h1>"
  }'
```

---

## Troubleshooting

### "Erro ao enviar email"
- Verifique se configurou n8n webhook OU SMTP
- Confirme que as credenciais estão corretas
- Teste o webhook manualmente

### Emails não chegam
- Verifique spam
- Confirme que o email do remetente está verificado
- Use SendGrid para melhor deliverability

### Cache não funciona
- Verifique se localStorage está habilitado
- Limpe o cache e teste novamente

---

**Sistema de cache e email configurado! 📧**
