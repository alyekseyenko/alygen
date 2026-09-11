# 🌐 MULTI-PAGE ANALYZER - Documentação

## 📋 O Que Faz?

Analisa **múltiplas páginas** de um site automaticamente:

1. **Tenta buscar sitemap.xml** (WordPress, Yoast, etc.)
2. **Fallback inteligente** com variações PT/EN/ES
3. **Valida URLs** em paralelo
4. **Categoriza páginas** (homepage, serviços, contato, etc.)
5. **Analisa até 10 páginas prioritárias**
6. **Agrega resultados** com recomendações

---

## 🚀 Como Usar

### **1️⃣ Endpoint da API**

```bash
POST http://localhost:3001/api/analyze-multipage
Content-Type: application/json

{
  "url": "https://exemplo.com"
}
```

### **2️⃣ Resposta**

```json
{
  "success": true,
  "data": {
    "discovery": {
      "total": 45,
      "analyzed": 10,
      "source": "sitemap",
      "pages": [
        "https://exemplo.com",
        "https://exemplo.com/servicos",
        "https://exemplo.com/sobre",
        "https://exemplo.com/contacto"
      ],
      "categories": {
        "homepage": ["https://exemplo.com"],
        "services": ["https://exemplo.com/servicos"],
        "about": ["https://exemplo.com/sobre"],
        "contact": ["https://exemplo.com/contacto"]
      }
    },
    "analysis": {
      "summary": {
        "total": 10,
        "successful": 9,
        "failed": 1,
        "avgPerformance": 72,
        "totalPixels": 2,
        "totalCTAs": 15
      },
      "pages": [
        {
          "url": "https://exemplo.com",
          "success": true,
          "data": {
            "performance": { "score": 85 },
            "pixels": { "detected": ["Meta Pixel"] },
            "ctas": { "count": 3 }
          }
        }
      ],
      "recommendations": [
        {
          "type": "performance",
          "priority": "high",
          "message": "Performance inconsistente: 45-85. Otimizar páginas mais lentas."
        },
        {
          "type": "tracking",
          "priority": "high",
          "message": "Pixels ausentes em 3 páginas. Implementar tracking global."
        }
      ]
    }
  }
}
```

---

## 🎯 Variações de URLs (PT/EN/ES)

O sistema tenta automaticamente estas variações:

| Categoria | Variações |
|-----------|-----------|
| **Sobre** | sobre, sobre-nos, quem-somos, about, about-us, nosotros, acerca-de |
| **Serviços** | servicos, serviços, services, servicios |
| **Contato** | contacto, contato, contactos, contact, contactar |
| **Portfolio** | portfolio, portfólio, trabalhos, projetos, projects |
| **Blog** | blog, noticias, notícias, news, artigos |
| **Preços** | precos, preços, pricing, tarifas, planos |
| **FAQ** | faq, perguntas, ajuda, help |
| **Equipa** | equipa, equipe, team, equipo |
| **Carreiras** | carreiras, careers, emprego, jobs, trabalhe-conosco |
| **Testemunhos** | testemunhos, depoimentos, testimonials, clientes |

---

## 🔍 Estratégia de Descoberta

### **1️⃣ Sitemap (Prioridade)**

Tenta buscar:
- `/sitemap.xml`
- `/sitemap_index.xml`
- `/sitemap-index.xml`
- `/wp-sitemap.xml` (WordPress)

### **2️⃣ Fallback (Se não houver sitemap)**

Gera URLs comuns:
```
https://exemplo.com/
https://exemplo.com/servicos
https://exemplo.com/services
https://exemplo.com/servicios
https://exemplo.com/sobre
https://exemplo.com/about
...
```

Valida cada URL com `HEAD` request (rápido).

---

## 📊 Priorização de Páginas

O sistema analisa **até 10 páginas** nesta ordem:

1. **Homepage** (1 página)
2. **Serviços** (até 2 páginas)
3. **Sobre** (1 página)
4. **Contato** (1 página)
5. **Portfolio** (até 2 páginas)
6. **Blog** (1 página)
7. **Outras** (até 2 páginas)

---

## 💡 Recomendações Geradas

### **Performance Inconsistente**
```
"Performance inconsistente: 45-85. Otimizar páginas mais lentas."
```

### **Pixels Faltando**
```
"Pixels ausentes em 3 páginas. Implementar tracking global."
```

### **CTAs Ausentes**
```
"5 páginas sem CTAs. Adicionar calls-to-action."
```

---

## 🛠️ Uso Programático

```javascript
const { discoverPages, analyzeMultiplePages, aggregateResults } = require('./services/multi-page-analyzer');

// 1️⃣ Descobrir páginas
const discovery = await discoverPages('https://exemplo.com');
console.log(`Encontradas ${discovery.total} páginas`);

// 2️⃣ Analisar páginas
const results = await analyzeMultiplePages(discovery.pages, analyzeLead);

// 3️⃣ Agregar resultados
const aggregated = aggregateResults(results);
console.log(`Performance média: ${aggregated.summary.avgPerformance}`);
```

---

## ⚙️ Configuração

### **Limites**

```javascript
// multi-page-analyzer.js

// Máximo de páginas do sitemap
return urls.slice(0, 20); // Linha 48

// Máximo de páginas analisadas
.slice(0, 10); // Linha 157

// Timeout de validação
timeout: 3000 // Linha 78
```

### **Adicionar Novas Variações**

```javascript
const PAGE_VARIATIONS = {
  // Adicione aqui
  pricing: ['precos', 'preços', 'pricing', 'tarifas', 'planos'],
  newCategory: ['variacao1', 'variation1', 'variacion1']
};
```

---

## 🎯 Casos de Uso

### **1️⃣ Auditoria Completa**
Analisa todas as páginas principais para relatório completo.

### **2️⃣ Detecção de Inconsistências**
Identifica páginas com performance baixa ou sem tracking.

### **3️⃣ Priorização de Otimizações**
Mostra quais páginas precisam de mais atenção.

### **4️⃣ Análise Multilíngue**
Detecta automaticamente páginas em PT/EN/ES.

---

## 📈 Performance

- **Sitemap parsing:** ~500ms
- **Validação de URLs:** ~100ms por URL (paralelo)
- **Análise completa:** ~30s para 10 páginas

---

## 🚀 Próximos Passos

- [ ] Cache de sitemaps (Redis)
- [ ] Análise de páginas de produto (e-commerce)
- [ ] Detecção de idioma automática
- [ ] Comparação entre páginas
- [ ] Exportar relatório PDF multi-página

---

**Quer integrar no frontend?** Veja `FRONTEND_INTEGRATION.md`
