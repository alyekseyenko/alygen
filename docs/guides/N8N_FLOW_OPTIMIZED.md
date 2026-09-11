# 🔄 Fluxo N8N Otimizado - Sheets → Análise → CRM

## 📊 Seu Fluxo Atual:
```
Google Sheets → N8N → CRM
```

## 🚀 Fluxo Otimizado Proposto:
```
Google Sheets → N8N → API Análise → Enriquecimento → 
Scoring → Email Automático → CRM → Follow-up
```

---

## 🎯 Fluxo Completo N8N

### **Node 1: Google Sheets Trigger**
```json
{
  "name": "Google Sheets",
  "type": "n8n-nodes-base.googleSheets",
  "parameters": {
    "operation": "append",
    "sheetId": "1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY",
    "range": "Results!A:Z"
  },
  "credentials": "Google Sheets API"
}
```

**Trigger:** Nova linha adicionada

---

### **Node 2: Validar Dados**
```javascript
// Code Node
const lead = $input.item.json;

// Validar campos obrigatórios
if (!lead.website || !lead.name) {
  return { 
    skip: true, 
    reason: 'Dados incompletos' 
  };
}

// Validar URL
const urlRegex = /^https?:\/\/.+/;
if (!urlRegex.test(lead.website)) {
  lead.website = 'https://' + lead.website;
}

return { lead };
```

---

### **Node 3: Verificar se Já Foi Analisado**
```javascript
// Code Node
const lead = $input.item.json.lead;
const cache = $node["Cache"].json;

// Verificar cache (últimos 7 dias)
const cacheKey = `analysis_${lead.website}`;
const cached = cache[cacheKey];

if (cached && Date.now() - cached.timestamp < 604800000) {
  return {
    skip: true,
    reason: 'Já analisado recentemente',
    analysis: cached.data
  };
}

return { lead };
```

---

### **Node 4: Chamar API de Análise**
```json
{
  "name": "Analisar Lead",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "http://localhost:3001/api/analyze-lead",
    "jsonParameters": true,
    "options": {
      "timeout": 120000
    },
    "bodyParametersJson": {
      "url": "={{ $json.lead.website }}",
      "leadData": {
        "name": "={{ $json.lead.name }}",
        "type": "={{ $json.lead.type }}",
        "address": "={{ $json.lead.address }}",
        "rating": "={{ $json.lead.rating }}",
        "reviews": "={{ $json.lead.reviews }}"
      }
    }
  }
}
```

**Timeout:** 2 minutos (análise pode demorar)

---

### **Node 5: Calcular Q Score**
```javascript
// Code Node
const analysis = $input.item.json.data;

// Calcular Q Score (simplificado)
const qScore = Math.round(
  (analysis.performanceMobile * 0.25) +
  (analysis.seo.score * 0.20) +
  (analysis.security.score * 0.15) +
  (analysis.accessibility.score * 0.10) +
  (analysis.conversion.score * 0.15) +
  (analysis.technologies.score * 0.10) +
  (analysis.pixelDetails.totalTracking * 5)
);

// Determinar prioridade
let priority = 'BAIXA';
if (qScore < 50) priority = 'ALTA';
else if (qScore < 70) priority = 'MÉDIA';

// Determinar grade
let grade = 'F';
if (qScore >= 90) grade = 'A+';
else if (qScore >= 85) grade = 'A';
else if (qScore >= 80) grade = 'B+';
else if (qScore >= 75) grade = 'B';
else if (qScore >= 70) grade = 'C+';
else if (qScore >= 60) grade = 'C';
else if (qScore >= 50) grade = 'D';

return {
  ...analysis,
  qScore,
  priority,
  grade
};
```

---

### **Node 6: Enriquecer com Dados Externos** (Opcional)
```json
{
  "name": "Hunter.io - Buscar Email",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "https://api.hunter.io/v2/domain-search",
    "qs": {
      "domain": "={{ $json.lead.website.replace('https://', '').replace('http://', '').split('/')[0] }}",
      "api_key": "YOUR_HUNTER_API_KEY"
    }
  }
}
```

**Dados Adicionais:**
- Emails da empresa
- Nomes de decisores
- LinkedIn profiles

---

### **Node 7: Switch - Roteamento por Prioridade**
```json
{
  "name": "Switch Priority",
  "type": "n8n-nodes-base.switch",
  "parameters": {
    "rules": [
      {
        "output": 0,
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.priority }}",
              "value2": "ALTA"
            }
          ]
        }
      },
      {
        "output": 1,
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.priority }}",
              "value2": "MÉDIA"
            }
          ]
        }
      }
    ],
    "fallbackOutput": 2
  }
}
```

**Rotas:**
- Output 0: ALTA → Enviar email + CRM + Notificar vendedor
- Output 1: MÉDIA → CRM + Email sequence
- Output 2: BAIXA → Apenas CRM

---

### **Node 8A: Email Imediato (Prioridade ALTA)**
```json
{
  "name": "Enviar Email - Alta Prioridade",
  "type": "n8n-nodes-base.emailSend",
  "parameters": {
    "fromEmail": "contacto@alygen.com",
    "toEmail": "={{ $json.extractedEmails[0] || $json.lead.email }}",
    "subject": "Análise Técnica - {{ $json.lead.name }}",
    "text": "Exmo(a). Sr(a). {{ $json.lead.name }},\n\n🎯 AVALIAÇÃO: {{ $json.qScore }}/100 (Grade {{ $json.grade }})\n\n[... resto do template ...]",
    "options": {
      "allowUnauthorizedCerts": false
    }
  },
  "credentials": "SMTP Account"
}
```

---

### **Node 8B: Adicionar a Sequência (Prioridade MÉDIA)**
```json
{
  "name": "ActiveCampaign - Add to Sequence",
  "type": "n8n-nodes-base.activeCampaign",
  "parameters": {
    "operation": "create",
    "resource": "contact",
    "email": "={{ $json.extractedEmails[0] }}",
    "updateIfExists": true,
    "additionalFields": {
      "firstName": "={{ $json.lead.name.split(' ')[0] }}",
      "tags": ["Lead Médio", "{{ $json.lead.type }}"],
      "fieldValues": {
        "qScore": "={{ $json.qScore }}",
        "website": "={{ $json.lead.website }}",
        "priority": "={{ $json.priority }}"
      }
    }
  }
}
```

---

### **Node 9: Atualizar Google Sheets**
```json
{
  "name": "Update Google Sheets",
  "type": "n8n-nodes-base.googleSheets",
  "parameters": {
    "operation": "update",
    "sheetId": "1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY",
    "range": "Results!A{{ $json.rowNumber }}:Z{{ $json.rowNumber }}",
    "options": {
      "valueInputMode": "USER_ENTERED"
    },
    "dataToSend": "defineInNode",
    "values": {
      "Q Score": "={{ $json.qScore }}",
      "Grade": "={{ $json.grade }}",
      "Priority": "={{ $json.priority }}",
      "Performance": "={{ $json.performanceMobile }}",
      "SEO": "={{ $json.seo.score }}",
      "Security": "={{ $json.security.score }}",
      "Status": "Analisado",
      "Analyzed At": "={{ $now.toISO() }}"
    }
  }
}
```

---

### **Node 10: Enviar para CRM**
```json
{
  "name": "HubSpot - Create Deal",
  "type": "n8n-nodes-base.hubspot",
  "parameters": {
    "resource": "deal",
    "operation": "create",
    "properties": {
      "dealname": "{{ $json.lead.name }} - Otimização Web",
      "amount": "={{ $json.pricing.total }}",
      "dealstage": "appointmentscheduled",
      "pipeline": "default",
      "closedate": "={{ $now.plus({ days: 30 }).toISO() }}",
      "hubspot_owner_id": "AUTO_ASSIGN"
    },
    "additionalFields": {
      "q_score": "={{ $json.qScore }}",
      "priority": "={{ $json.priority }}",
      "website": "={{ $json.lead.website }}",
      "performance_score": "={{ $json.performanceMobile }}",
      "seo_score": "={{ $json.seo.score }}"
    }
  }
}
```

**Alternativas:**
- Pipedrive
- Salesforce
- Monday.com
- Notion

---

### **Node 11: Notificar Vendedor (Prioridade ALTA)**
```json
{
  "name": "Slack - Notify Sales",
  "type": "n8n-nodes-base.slack",
  "parameters": {
    "resource": "message",
    "operation": "post",
    "channel": "#vendas",
    "text": "🔥 *LEAD QUENTE DETECTADO!*\n\n*Cliente:* {{ $json.lead.name }}\n*Q Score:* {{ $json.qScore }}/100 ({{ $json.grade }})\n*Prioridade:* {{ $json.priority }}\n*Website:* {{ $json.lead.website }}\n*Valor Estimado:* €{{ $json.pricing.total }}\n\n*Principais Problemas:*\n• Performance: {{ $json.performanceMobile }}/100\n• SEO: {{ $json.seo.score }}/100\n• Sem Pixel: {{ $json.pixelDetails.totalTracking === 0 ? 'Sim ⚠️' : 'Não' }}\n\n<link_to_crm|Ver no CRM> | <link_to_report|Ver Relatório>"
  }
}
```

**Alternativas:**
- Email para vendedor
- WhatsApp (Twilio)
- Microsoft Teams
- Discord

---

### **Node 12: Agendar Follow-up**
```json
{
  "name": "Schedule Follow-up",
  "type": "n8n-nodes-base.schedule",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "days",
          "daysInterval": 3
        }
      ]
    },
    "triggerData": {
      "leadId": "={{ $json.lead.id }}",
      "email": "={{ $json.extractedEmails[0] }}",
      "followUpNumber": 1
    }
  }
}
```

**Sequência de Follow-up:**
- Dia 3: "Teve oportunidade de ver a análise?"
- Dia 7: Case study relevante
- Dia 14: Proposta personalizada
- Dia 21: Desconto limitado

---

## 📊 Fluxo Visual Completo

```
┌─────────────────┐
│ Google Sheets   │ (Trigger: Nova linha)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Validar Dados   │ (Website válido? Nome existe?)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check Cache     │ (Já analisado nos últimos 7 dias?)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ API Análise     │ (POST /api/analyze-lead)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Calcular Q Score│ (Score + Grade + Priority)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Enriquecer Dados│ (Hunter.io, Clearbit, LinkedIn)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Switch Priority │
└────┬────┬───┬───┘
     │    │   │
  ALTA MÉDIA BAIXA
     │    │   │
     ▼    ▼   ▼
┌─────┐ ┌──┐ ┌──┐
│Email│ │Seq│ │CRM│
│+CRM │ │+  │ │   │
│+Slack│ │CRM│ │   │
└─────┘ └──┘ └──┘
     │    │   │
     └────┴───┘
         │
         ▼
┌─────────────────┐
│ Update Sheets   │ (Adicionar scores)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Schedule        │ (Follow-up em 3 dias)
│ Follow-up       │
└─────────────────┘
```

---

## 🎯 Configuração Rápida

### 1. Importar Workflow N8N

Copie este JSON e importe no N8N:

```json
{
  "name": "CRM Deals Manager - Complete Flow",
  "nodes": [
    {
      "parameters": {
        "operation": "append",
        "sheetId": "1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY"
      },
      "name": "Google Sheets Trigger",
      "type": "n8n-nodes-base.googleSheetsTrigger",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "http://localhost:3001/api/analyze-lead",
        "method": "POST",
        "jsonParameters": true,
        "options": {
          "timeout": 120000
        }
      },
      "name": "Analyze Lead",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    }
  ],
  "connections": {
    "Google Sheets Trigger": {
      "main": [[{"node": "Analyze Lead", "type": "main", "index": 0}]]
    }
  }
}
```

### 2. Configurar Credenciais

- Google Sheets API
- SMTP (contacto@alygen.com)
- HubSpot/Pipedrive API
- Slack Webhook (opcional)
- Hunter.io API (opcional)

### 3. Ativar Workflow

---

## 🚀 Melhorias Adicionais

### **A. Competitor Monitoring**
```
Cron (diário) → Analisar Concorrentes → 
Comparar com Cliente → Alertar se Mudanças
```

### **B. Bulk Analysis**
```
Google Sheets (100 leads) → 
Split in Batches (10) → 
Parallel Analysis → 
Aggregate Results → 
Send Report
```

### **C. Lead Scoring Preditivo**
```
Historical Data → 
Machine Learning Model → 
Predict Conversion Probability → 
Prioritize Leads
```

---

## 📊 Métricas para Monitorar

| Métrica | Objetivo | Alerta |
|---------|----------|--------|
| Tempo de Análise | <30s | >60s |
| Taxa de Sucesso | >95% | <90% |
| Leads/Dia | 50+ | <20 |
| Taxa de Conversão | >10% | <5% |
| Email Open Rate | >25% | <15% |

---

## 💡 Quick Wins

**Implementar Hoje (2h):**
1. ✅ Node de validação de dados
2. ✅ Switch por prioridade
3. ✅ Notificação Slack para leads quentes
4. ✅ Update automático do Google Sheets

**Implementar Esta Semana (8h):**
1. ✅ Enriquecimento com Hunter.io
2. ✅ Integração HubSpot/Pipedrive
3. ✅ Sequência de follow-up
4. ✅ Cache de análises

---

## 🎓 Recursos

- **N8N Docs:** https://docs.n8n.io/
- **N8N Templates:** https://n8n.io/workflows/
- **Community:** https://community.n8n.io/

---

**🚀 Com este fluxo, você automatiza 95% do trabalho manual!**
