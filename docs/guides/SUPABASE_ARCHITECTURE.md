# 🗄️ Arquitetura Supabase - Cache Inteligente

## 📊 Estratégia de Armazenamento

### ✅ Versão 3.0 (Atual - Simplificada)

```sql
CREATE TABLE lead_analyses (
  id BIGSERIAL PRIMARY KEY,
  
  -- 🔍 Campos para BUSCA/FILTRO (indexados)
  lead_name TEXT,
  lead_website TEXT UNIQUE NOT NULL,
  lead_city TEXT,
  lead_type TEXT,
  
  qscore INTEGER,
  qscore_grade TEXT,
  priority TEXT,
  
  performance_mobile INTEGER,
  security_has_ssl BOOLEAN,
  tracking_total INTEGER,
  
  is_social_media_only BOOLEAN,
  
  -- 💾 ANÁLISE COMPLETA (100% dos dados)
  full_analysis JSONB NOT NULL,
  
  -- 📅 Metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  analysis_version TEXT DEFAULT '3.0'
);
```

---

## 🎯 Por Que Esta Arquitetura?

### ❌ Problema Anterior (v2.0)
- 50+ colunas individuais
- Dados duplicados (coluna + JSON)
- Difícil manter sincronizado
- Estrutura rígida

### ✅ Solução Atual (v3.0)
- **10 colunas** essenciais para queries
- **1 coluna JSONB** com 100% dos dados
- Flexível: adicionar campos sem ALTER TABLE
- Sempre sincronizado

---

## 📦 O Que Está em `full_analysis`?

```json
{
  "url": "https://example.com",
  "performanceMobile": 85,
  "performanceScore": 90,
  "seo": { "score": 75, "title": "...", ... },
  "security": { "score": 100, "hasSSL": true, ... },
  "accessibility": { "score": 80, ... },
  "pixelDetails": { "facebook": true, "ga4": true, ... },
  "ctaAnalysis": { "hasCTA": true, "quality": 8, ... },
  "extractedEmails": ["email@example.com"],
  "extractedPhones": ["+351 912 345 678"],
  "qScore": { "score": 78, "grade": "B", ... },
  "qScoreAdvanced": { "score": 82, ... },
  "technologies": { ... },
  "conversion": { ... },
  "contentAnalysis": { ... },
  "socialMedia": { ... },
  "googleRanking": { ... },
  "aiInsights": { ... },
  "emailTemplate": { ... },
  "leadData": {
    "name": "Empresa XYZ",
    "website": "https://example.com",
    "city": "Lisboa",
    "type": "restaurant",
    ...
  }
}
```

**Tudo está guardado!** 🎉

---

## 🔍 Como Funciona?

### 1. **Salvar Análise**
```javascript
await saveAnalysisToSupabase(leadData, analysis);
// ✅ Guarda full_analysis (100%)
// ✅ Extrai campos essenciais para busca
```

### 2. **Recuperar Análise**
```javascript
const result = await getAnalysisFromSupabase(website);
// ✅ Retorna full_analysis completo
// ✅ Nenhum dado perdido
```

### 3. **Buscar/Filtrar**
```sql
-- Buscar por Q Score
SELECT * FROM lead_analyses WHERE qscore > 70;

-- Buscar por cidade
SELECT * FROM lead_analyses WHERE lead_city = 'Lisboa';

-- Buscar sem SSL
SELECT * FROM lead_analyses WHERE security_has_ssl = false;

-- Buscar por prioridade
SELECT * FROM lead_analyses WHERE priority = 'ALTA';
```

---

## 🚀 Vantagens

| Aspecto | v2.0 (Antiga) | v3.0 (Nova) |
|---------|---------------|-------------|
| Colunas | 50+ | 10 essenciais |
| Dados perdidos | ❌ Possível | ✅ Impossível |
| Flexibilidade | ❌ Rígida | ✅ Total |
| Manutenção | ❌ Complexa | ✅ Simples |
| Performance | ⚠️ Média | ✅ Ótima |
| Sincronização | ❌ Manual | ✅ Automática |

---

## 📈 Índices Recomendados

```sql
-- Busca por website (já é UNIQUE)
CREATE INDEX idx_lead_website ON lead_analyses(lead_website);

-- Busca por Q Score
CREATE INDEX idx_qscore ON lead_analyses(qscore);

-- Busca por cidade
CREATE INDEX idx_city ON lead_analyses(lead_city);

-- Busca por prioridade
CREATE INDEX idx_priority ON lead_analyses(priority);

-- Busca por data
CREATE INDEX idx_analyzed_at ON lead_analyses(analyzed_at DESC);

-- Busca em full_analysis (JSONB)
CREATE INDEX idx_full_analysis_gin ON lead_analyses USING GIN (full_analysis);
```

---

## 🔄 Migração de v2.0 → v3.0

Se já tem dados na v2.0, não precisa migrar! O sistema funciona com ambas:

```sql
-- Opcional: Limpar colunas antigas (se quiser)
ALTER TABLE lead_analyses 
  DROP COLUMN IF EXISTS lead_email,
  DROP COLUMN IF EXISTS lead_phone,
  DROP COLUMN IF EXISTS seo_score,
  -- ... etc
```

Mas **não é necessário** - o sistema usa apenas `full_analysis` + campos essenciais.

---

## 💡 Exemplo de Query Avançada

```sql
-- Buscar leads de Lisboa com Q Score > 70 e sem SSL
SELECT 
  lead_name,
  lead_website,
  qscore,
  full_analysis->>'extractedEmails' as emails,
  full_analysis->>'extractedPhones' as phones
FROM lead_analyses
WHERE 
  lead_city = 'Lisboa'
  AND qscore > 70
  AND security_has_ssl = false
ORDER BY qscore DESC;
```

---

## ✅ Checklist de Implementação

- [x] Simplificar `saveAnalysisToSupabase()` (apenas campos essenciais)
- [x] Incluir `leadData` dentro de `full_analysis`
- [x] Versão 3.0 no metadata
- [x] Documentação completa
- [ ] Criar índices no Supabase (opcional)
- [ ] Testar recuperação de análises antigas

---

## 🎯 Conclusão

**Agora o Supabase guarda 100% da análise!**

- ✅ Nenhum dado perdido
- ✅ Estrutura flexível
- ✅ Fácil manutenção
- ✅ Performance otimizada

**Versão:** 3.0  
**Data:** 2024
