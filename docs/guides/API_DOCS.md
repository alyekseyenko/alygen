# 📡 Documentação da API

Base URL: `http://localhost:3001/api`

## Endpoints

### 1. GET /fetch-leads

Busca todos os leads do Google Sheets.

**Request:**
```bash
curl http://localhost:3001/api/fetch-leads
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Empresa ABC",
      "email": "contato@abc.com",
      "website": "https://abc.com",
      "status": "pending"
    }
  ]
}
```

---

### 2. POST /analyze-lead

Analisa um lead completo (Performance + Pixels + CTA).

**Request:**
```bash
curl -X POST http://localhost:3001/api/analyze-lead \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "performanceScore": 85,
    "performanceMobile": 78,
    "hasPixel": true,
    "pixelDetails": {
      "facebook": true,
      "ga4": false
    },
    "hasCTA": true,
    "priority": "BAIXA",
    "analyzedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Campos:**
- `performanceScore`: 0-100 (desktop)
- `performanceMobile`: 0-100 (mobile)
- `hasPixel`: boolean (Meta OU GA4)
- `pixelDetails`: objeto com detalhes
- `hasCTA`: boolean (análise via IA)
- `priority`: "ALTA" | "MÉDIA" | "BAIXA"

**Tempo de resposta:** ~10-15 segundos

---

### 3. POST /send-email

Envia email via n8n ou Nodemailer.

**Request:**
```bash
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": 2,
    "recipient": "contato@abc.com",
    "emailBody": "<html>...</html>"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Email enviado com sucesso"
}
```

---

## Códigos de Status

| Código | Significado |
|--------|-------------|
| 200 | Sucesso |
| 400 | Requisição inválida (falta parâmetro) |
| 500 | Erro interno (API externa falhou) |

---

## Exemplos de Uso

### JavaScript (Fetch)

```javascript
// Buscar leads
const response = await fetch('http://localhost:3001/api/fetch-leads');
const { data } = await response.json();

// Analisar lead
const analysis = await fetch('http://localhost:3001/api/analyze-lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
});
const result = await analysis.json();

// Enviar email
await fetch('http://localhost:3001/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    leadId: 2,
    recipient: 'contato@abc.com',
    emailBody: '<h1>Olá!</h1>'
  })
});
```

### Python (Requests)

```python
import requests

# Buscar leads
response = requests.get('http://localhost:3001/api/fetch-leads')
leads = response.json()['data']

# Analisar lead
analysis = requests.post('http://localhost:3001/api/analyze-lead', json={
    'url': 'https://example.com'
})
result = analysis.json()['data']

# Enviar email
requests.post('http://localhost:3001/api/send-email', json={
    'leadId': 2,
    'recipient': 'contato@abc.com',
    'emailBody': '<h1>Olá!</h1>'
})
```

### cURL (Bash)

```bash
# Buscar leads
curl http://localhost:3001/api/fetch-leads

# Analisar lead
curl -X POST http://localhost:3001/api/analyze-lead \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Enviar email
curl -X POST http://localhost:3001/api/send-email \
  -H "Content-Type: application/json" \
  -d '{"leadId":2,"recipient":"test@example.com","emailBody":"<h1>Test</h1>"}'
```

---

## Rate Limits

**Sem autenticação:**
- 10 requisições/minuto por IP

**Com autenticação (futuro):**
- Free: 100 requisições/dia
- Pro: 1000 requisições/dia
- Enterprise: Ilimitado

---

## Webhooks (Futuro)

Configure webhooks para receber notificações:

```json
POST https://seu-servidor.com/webhook
{
  "event": "lead.analyzed",
  "data": {
    "leadId": 2,
    "url": "https://example.com",
    "priority": "ALTA",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Erros Comuns

### 1. "URL é obrigatória"
```json
{
  "success": false,
  "error": "URL é obrigatória"
}
```
**Solução:** Envie o campo `url` no body.

### 2. "Google Sheets API error"
```json
{
  "success": false,
  "error": "Error: No key or keyFile set."
}
```
**Solução:** Configure o `.env` com as credenciais do Google.

### 3. "OpenAI API error"
```json
{
  "success": false,
  "error": "Incorrect API key provided"
}
```
**Solução:** Verifique a `OPENAI_API_KEY` no `.env`.

---

## Testando a API

### Postman Collection

Importe esta collection:

```json
{
  "info": { "name": "CRM Deals Manager" },
  "item": [
    {
      "name": "Fetch Leads",
      "request": {
        "method": "GET",
        "url": "http://localhost:3001/api/fetch-leads"
      }
    },
    {
      "name": "Analyze Lead",
      "request": {
        "method": "POST",
        "url": "http://localhost:3001/api/analyze-lead",
        "body": {
          "mode": "raw",
          "raw": "{\"url\":\"https://example.com\"}"
        }
      }
    }
  ]
}
```

### Insomnia

```yaml
_type: export
resources:
  - _type: request
    name: Fetch Leads
    method: GET
    url: http://localhost:3001/api/fetch-leads
  - _type: request
    name: Analyze Lead
    method: POST
    url: http://localhost:3001/api/analyze-lead
    body:
      mimeType: application/json
      text: '{"url":"https://example.com"}'
```

---

## Próximas Features da API

- [ ] Autenticação JWT
- [ ] Paginação de leads
- [ ] Filtros avançados
- [ ] Webhooks
- [ ] GraphQL endpoint
- [ ] Documentação Swagger/OpenAPI
