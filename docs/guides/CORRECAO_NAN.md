# ✅ CORREÇÃO: ERRO NaN NO Q SCORE

## 🐛 PROBLEMA
```
Warning: Received NaN for the `children` attribute
```

**Causa:** Leads sem site não têm `performanceMobile` ou `performanceScore`, resultando em `NaN`.

## ✅ CORREÇÕES APLICADAS

### **1. Quick Stats (Header)**
```javascript
// ANTES
{qScore.score}
{analysis.performanceMobile}
{pricing.total}

// DEPOIS
{qScore.score || 'N/A'}
{analysis?.performanceMobile || 'N/A'}
{pricing.total || 0}
```

### **2. Cálculo de Q Score**
```javascript
// ANTES
const qScore = calculateQScore(analysis)

// DEPOIS
const qScore = isNoWebsite 
  ? { score: 0, grade: 'N/A', category: 'Sem Site' }
  : calculateQScore(analysis)
```

### **3. Aba Q Score**
```javascript
// ANTES
<QScoreDetailed qScore={qScore} />

// DEPOIS
{!isNoWebsite ? (
  <QScoreDetailed qScore={qScore} />
) : (
  <div>🚨 SEM SITE PRÓPRIO</div>
)}
```

### **4. Aba Detalhes**
```javascript
// ANTES
{analysis.seo && ...}

// DEPOIS
{!isNoWebsite ? (
  {analysis?.seo && ...}
) : (
  <div>🚨 Análise não aplicável</div>
)}
```

## 🧪 TESTAR

```bash
cd frontend
npm run dev
```

1. Analisar lead com Facebook
2. Ver Relatório
3. Clicar em "🏆 Q Score"
4. ✅ Deve mostrar "SEM SITE PRÓPRIO" (não erro)

## ✅ RESULTADO

**Antes:** Erro NaN + tela preta  
**Depois:** Mensagem clara "SEM SITE PRÓPRIO"
