# 🔧 TROUBLESHOOTING - Multi-Page não aparece

## ❓ Problema
Ao analisar um lead, só aparece o score da página principal (main) e não aparece o score de outras páginas.

---

## ✅ CHECKLIST DE VERIFICAÇÃO

### **1️⃣ Backend está rodando?**
```bash
cd backend
npm run dev

# Deve mostrar:
# 🚀 Backend rodando em http://localhost:3001
```

### **2️⃣ Endpoint existe?**
Abra o navegador e acesse:
```
http://localhost:3001/api/analyze-multipage
```

Deve retornar erro 400 (esperado, pois não enviou URL):
```json
{"success":false,"error":"URL é obrigatória"}
```

### **3️⃣ Teste o endpoint manualmente**
```bash
# Windows PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/api/analyze-multipage" -Method POST -ContentType "application/json" -Body '{"url":"https://example.com"}'

# Ou use Postman/Insomnia
POST http://localhost:3001/api/analyze-multipage
Body: {"url": "https://example.com"}
```

### **4️⃣ Verifique os logs do backend**
Ao analisar um lead, o backend deve mostrar:
```
🔍 Iniciando análise completa de: https://exemplo.com
✅ Análise concluída - Score: 85/100
🌐 Descobrindo páginas de: https://exemplo.com
✅ Sitemap encontrado: 10 URLs
🔍 Analisando 10 páginas...
  ➡️ Analisando: https://exemplo.com/
  ➡️ Analisando: https://exemplo.com/servicos
  ...
✅ Análise completa. Resultados: 10
```

**Se NÃO aparecer "🌐 Descobrindo páginas":**
- O endpoint multi-page não está sendo chamado
- Verifique o frontend (passo 5)

### **5️⃣ Verifique os logs do frontend**
Abra o Console do navegador (F12) e analise um lead.

Deve mostrar:
```
🔍 Analisando página principal: https://exemplo.com
✅ Análise principal completa
🌐 Iniciando análise multi-página...
📊 Multi-page data: {success: true, data: {...}}
📊 Outras páginas encontradas: 5
📈 Performance média outras páginas: 72
✅ Multi-page adicionado: {totalPages: 10, otherPagesCount: 5, ...}
```

**Se aparecer "⚠️ Multi-page analysis failed":**
- Veja o erro completo no console
- Pode ser timeout (site muito lento)
- Pode ser erro no backend

### **6️⃣ Limpe o cache**
O sistema usa cache. Para forçar nova análise:

**Opção A - Limpar localStorage:**
```javascript
// No console do navegador (F12)
localStorage.clear()
location.reload()
```

**Opção B - Usar botão Re-analisar:**
- Clique no ícone de refresh (🔄) ao lado de "Ver Relatório"

### **7️⃣ Verifique se o site tem outras páginas**
Alguns sites têm apenas homepage. Teste com:
```
https://example.com  ← Só tem homepage
https://wordpress.org ← Tem várias páginas
```

---

## 🐛 ERROS COMUNS

### **Erro: "Cannot find module 'xml2js'"**
```bash
cd backend
npm install xml2js
```

### **Erro: "discoverPages is not a function"**
O módulo não foi importado corretamente. Verifique `backend/server.js`:
```javascript
import { discoverPages, analyzeMultiplePages, aggregateResults } from './services/multi-page-analyzer.js';
```

### **Erro: "Timeout of 5000ms exceeded"**
O site está muito lento. Aumente o timeout em `multi-page-analyzer.js`:
```javascript
// Linha 30
const response = await axios.get(url, { timeout: 10000 }); // 10s
```

### **Erro: "analysis.multiPage is undefined"**
A análise multi-página falhou silenciosamente. Verifique:
1. Logs do backend
2. Logs do frontend (console)
3. Se o site tem outras páginas

---

## 🧪 TESTE MANUAL COMPLETO

### **1. Reinicie tudo:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **2. Limpe o cache:**
```javascript
// Console do navegador (F12)
localStorage.clear()
```

### **3. Analise um lead:**
1. Acesse http://localhost:3000/
2. Clique em "Analisar" em qualquer lead
3. Aguarde 30-60 segundos
4. Verifique os logs no console (F12)
5. Verifique os logs no terminal do backend

### **4. Verifique a tabela:**
Deve aparecer:
```
Performance (Main / Outras)
     85    /    72
    main      5pg
```

Se aparecer só:
```
Performance
     85
    main
```

Então a análise multi-página não funcionou.

---

## 🔍 DEBUG AVANÇADO

### **Adicione breakpoint no código:**

**Frontend (App.jsx linha ~70):**
```javascript
if (otherPages.length > 0) {
  debugger; // ← Adicione aqui
  const avgOtherPerformance = ...
}
```

**Backend (server.js linha ~60):**
```javascript
const discovery = await discoverPages(url);
console.log('DEBUG discovery:', JSON.stringify(discovery, null, 2)); // ← Adicione
```

### **Teste com curl:**
```bash
curl -X POST http://localhost:3001/api/analyze-multipage \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

---

## 📞 AINDA NÃO FUNCIONA?

### **Envie estas informações:**

1. **Logs do backend** (copie tudo do terminal)
2. **Logs do frontend** (F12 → Console → copie tudo)
3. **URL do site** que está testando
4. **Screenshot** da tabela mostrando só "main"
5. **Versão do Node.js:** `node --version`

---

## ✅ SOLUÇÃO RÁPIDA

Se nada funcionar, tente esta versão simplificada:

**1. Desabilite multi-page temporariamente:**

Em `frontend/src/App.jsx`, comente o bloco multi-page:
```javascript
// 2️⃣ Análise multi-página (outras páginas)
/*
try {
  const { data: multiPageData } = await axios.post...
  ...
} catch (mpError) {
  console.warn('Multi-page analysis failed:', mpError)
}
*/
```

**2. Teste se a análise normal funciona**

**3. Se funcionar, o problema está no multi-page**

**4. Reative linha por linha para encontrar o erro**

---

**Precisa de ajuda?** Envie os logs! 🚀
