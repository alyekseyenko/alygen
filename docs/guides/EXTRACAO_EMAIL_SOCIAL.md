# 📧 EXTRAÇÃO DE EMAIL DE PERFIS SOCIAIS

## 🎯 PROBLEMA

Cliente tem Facebook como website: `https://www.facebook.com/almiroeferreira`  
Email está visível no perfil, mas não é detectado.

## ✅ SOLUÇÃO IMPLEMENTADA

### **Múltiplos Métodos de Extração:**

1. **Método 1: Regex Melhorado**
   - Busca emails no HTML público
   - Filtra emails inválidos (facebook.com, example.com, etc.)
   - Remove duplicados

2. **Método 2: Meta Tags**
   - Busca em `<meta>` tags
   - Procura por `content="email@domain.com"`

3. **Método 3: JSON-LD / Structured Data**
   - Busca em `<script type="application/ld+json">`
   - Extrai campo `email` se existir

### **Validação Rigorosa:**
- ❌ Bloqueia domínios de redes sociais
- ❌ Bloqueia extensões de arquivo (.jpg, .png, etc.)
- ❌ Bloqueia emails genéricos (noreply, support, etc.)
- ✅ Valida formato correto
- ✅ Verifica tamanho razoável (5-50 caracteres)

---

## 🧪 COMO TESTAR

### **1. Criar Lead de Teste**
No Google Sheets:
```
Nome: Almiro e Ferreira
Website: https://www.facebook.com/almiroeferreira
Tipo: Restaurante
```

### **2. Analisar Lead**
```bash
# Backend
cd backend
npm run dev

# Frontend (novo terminal)
cd frontend
npm run dev
```

### **3. Ver Logs**
No terminal do backend, procurar:
```
📘 ALERTA: Lead usa apenas Facebook como website
🔍 Tentando extrair email do perfil Facebook...
✅ 1 email(s) extraído(s): email@example.com
```

### **4. Verificar no Dashboard**
1. Filtro "🚨 Sem Site Próprio"
2. Ver Relatório
3. Aba "📧 Email" deve mostrar email extraído

---

## 📊 LIMITAÇÕES

### **Facebook:**
- ✅ Emails públicos no perfil
- ❌ Emails privados (apenas amigos)
- ❌ Emails em fotos/imagens

### **Instagram:**
- ✅ Email na bio
- ❌ Email em stories/posts

### **LinkedIn:**
- ✅ Email público no perfil
- ❌ Email privado (apenas conexões)

---

## 🔧 SE NÃO ENCONTRAR EMAIL

### **Opção 1: Email do Google Maps**
Se o lead veio do Google Maps, pode ter email lá:
```javascript
leadData.email // Email do Google Maps
leadData.phone // Telefone do Google Maps
```

### **Opção 2: Sugerir Busca Manual**
No drawer, mostrar:
```
⚠️ Email não encontrado automaticamente

Sugestões:
1. Verificar perfil manualmente
2. Usar telefone para contato
3. Enviar mensagem pelo Facebook
```

### **Opção 3: Usar Telefone**
Converter telefone em WhatsApp:
```javascript
const phone = leadData.phone.replace(/\D/g, ''); // Remove não-dígitos
const whatsappUrl = `https://wa.me/351${phone}`;
```

---

## 💡 MELHORIAS FUTURAS

### **1. Puppeteer para Scraping Avançado**
```javascript
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(url);

// Esperar carregar
await page.waitForSelector('[data-testid="email"]');

// Extrair email
const email = await page.$eval('[data-testid="email"]', el => el.textContent);
```

### **2. API do Facebook Graph**
```javascript
// Requer token de acesso
const response = await fetch(
  `https://graph.facebook.com/v18.0/${pageId}?fields=emails&access_token=${token}`
);
```

### **3. OCR em Imagens**
Se email estiver em imagem de capa/perfil:
```javascript
import Tesseract from 'tesseract.js';

const { data: { text } } = await Tesseract.recognize(imageUrl);
const emailMatch = text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
```

---

## 📝 EXEMPLO REAL

### **Input:**
```
URL: https://www.facebook.com/almiroeferreira
```

### **Output Esperado:**
```javascript
{
  category: 'SEM_SITE',
  isSocialMediaOnly: true,
  socialMediaInfo: {
    platform: 'Facebook',
    icon: '📘',
    profileUrl: 'https://www.facebook.com/almiroeferreira'
  },
  extractedEmails: ['almiro@example.com'], // Se encontrado
  websiteProposal: { ... },
  priority: 'CRÍTICA'
}
```

### **Se Email Não Encontrado:**
```javascript
{
  extractedEmails: [],
  // Usar email do Google Maps se disponível
  fallbackContact: {
    phone: leadData.phone,
    whatsapp: `https://wa.me/351${phone}`,
    facebookMessage: `https://m.me/almiroeferreira`
  }
}
```

---

## ✅ CHECKLIST

- [x] Detector de redes sociais
- [x] Extração de email (3 métodos)
- [x] Validação rigorosa
- [x] Integração no analyzer
- [x] Logs detalhados
- [ ] Fallback para telefone/WhatsApp
- [ ] Sugestão de contato alternativo
- [ ] Puppeteer para scraping avançado (futuro)

---

## 🎯 RESULTADO

**Antes:**
- ❌ Email não detectado
- ❌ Sem forma de contato

**Depois:**
- ✅ Tenta extrair email (3 métodos)
- ✅ Valida rigorosamente
- ✅ Mostra no dashboard
- ✅ Fallback para telefone/WhatsApp (se implementado)

**Taxa de Sucesso Esperada:** 30-50% (depende da privacidade do perfil)
