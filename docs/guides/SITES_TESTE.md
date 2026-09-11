# 🧪 SITES PARA TESTAR MULTI-PÁGINA

## ✅ Sites com Múltiplas Páginas

### **WordPress (com sitemap):**
- https://wordpress.org
- https://www.wix.com
- https://www.shopify.com

### **Sites Portugueses:**
- https://www.fnac.pt
- https://www.worten.pt
- https://www.continente.pt

### **Sites Simples (fallback):**
- https://example.com (só homepage)
- https://kpi.pt (só homepage)

---

## 🔍 Como Testar

1. **Limpe o cache:**
```javascript
localStorage.clear()
```

2. **Adicione um destes sites no Google Sheets**

3. **Clique em "Analisar"**

4. **Veja no console:**
```
🌐 Iniciando análise multi-página...
📊 Total páginas: 10, Outras: 9
📈 Performance média outras páginas: 75
✅ Multi-page adicionado
```

5. **Veja na tabela:**
```
Performance (Main / Outras)
     85    /    75
    main      9pg
```

---

## ⚠️ Se Aparecer Só "main"

Significa que o site:
- ❌ Não tem sitemap.xml
- ❌ Não tem páginas comuns (sobre, serviços, contato)
- ❌ Só tem homepage

**Solução:** Teste com outro site da lista acima.
