# 🗄️ Supabase Setup - Persistência de Análises

## 📋 O Que é o Supabase?

Supabase é um banco de dados PostgreSQL hospedado (alternativa open-source ao Firebase) que permite:

✅ **Persistência permanente** de todas as análises  
✅ **Cache distribuído** entre múltiplas instâncias  
✅ **Consultas SQL avançadas** para relatórios  
✅ **Tier gratuito generoso** (500MB + 2GB bandwidth)  

---

## 🚀 Setup Rápido (5 minutos)

### 1. Criar Conta no Supabase

1. Acesse: https://supabase.com
2. Clique em **"Start your project"**
3. Faça login com GitHub
4. Crie um novo projeto:
   - **Name**: `crm-deals-manager`
   - **Database Password**: Gere uma senha forte
   - **Region**: Escolha a mais próxima (ex: South America)
   - Clique em **"Create new project"**

⏱️ Aguarde 2-3 minutos enquanto o projeto é provisionado.

---

### 2. Criar a Tabela

1. No painel do Supabase, vá em **SQL Editor** (ícone de banco de dados)
2. Clique em **"New query"**
3. Copie todo o conteúdo do arquivo `backend/supabase-schema.sql`
4. Cole no editor SQL
5. Clique em **"Run"** (ou pressione Ctrl+Enter)

✅ Você verá: `Success. No rows returned`

---

### 3. Obter as Credenciais

1. Vá em **Settings** (ícone de engrenagem) → **API**
2. Copie as seguintes informações:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 4. Configurar o Backend

Adicione ao arquivo `backend/.env`:

```env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 5. Testar a Conexão

Reinicie o backend:

```bash
cd backend
npm run dev
```

Você deve ver no console:

```
✅ Supabase conectado
🚀 Backend rodando em http://localhost:3001
```

---

## 📊 Como Funciona?

### Fluxo de Análise com Supabase

```
1. Frontend solicita análise
   ↓
2. Backend verifica Supabase primeiro
   ├─ Se encontrar → Retorna cache (instantâneo)
   └─ Se não encontrar → Continua
   ↓
3. Backend verifica cache local
   ├─ Se encontrar → Retorna cache
   └─ Se não encontrar → Continua
   ↓
4. Backend faz análise completa (APIs)
   ↓
5. Salva no Supabase + Cache Local
   ↓
6. Retorna resultado
```

### Vantagens

- ✅ **Cache persistente** (não perde ao reiniciar servidor)
- ✅ **Compartilhado** entre múltiplas instâncias
- ✅ **Consultas SQL** para relatórios avançados
- ✅ **Backup automático** de todas as análises

---

## 🔍 Endpoints Disponíveis

### 1. Listar Todas as Análises

```bash
GET /api/supabase/analyses
```

**Filtros opcionais:**
- `?minQScore=50` - Q-Score mínimo
- `?maxQScore=80` - Q-Score máximo
- `?priority=ALTA` - Prioridade específica
- `?hasSSL=true` - Apenas com SSL

**Exemplo:**
```bash
curl http://localhost:3001/api/supabase/analyses?minQScore=70&hasSSL=false
```

---

### 2. Buscar Análise Específica

```bash
GET /api/supabase/analysis/:website
```

**Exemplo:**
```bash
curl http://localhost:3001/api/supabase/analysis/https://example.com
```

---

### 3. Estatísticas Gerais

```bash
GET /api/supabase/stats
```

**Retorna:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "avgQScore": 67.5,
    "withoutSSL": 23,
    "highPriority": 45,
    "avgTracking": 3.2
  }
}
```

---

## 📈 Consultas SQL Úteis

### Ver Leads Críticos

```sql
SELECT * FROM critical_leads;
```

### Top 10 Performers

```sql
SELECT * FROM top_performers;
```

### Estatísticas Gerais

```sql
SELECT * FROM analytics_stats;
```

### Leads Sem SSL

```sql
SELECT lead_name, lead_website, qscore
FROM lead_analyses
WHERE security_has_ssl = false
ORDER BY qscore DESC;
```

### Análises por Cidade

```sql
SELECT 
  lead_city,
  COUNT(*) as total,
  ROUND(AVG(qscore), 2) as avg_qscore
FROM lead_analyses
WHERE lead_city IS NOT NULL
GROUP BY lead_city
ORDER BY total DESC;
```

---

## 🎯 Estrutura da Tabela

### Campos Principais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único |
| `lead_website` | TEXT | URL do site (UNIQUE) |
| `qscore` | NUMERIC | Pontuação global (0-100) |
| `priority` | TEXT | ALTA, MÉDIA, BAIXA |
| `performance_mobile` | NUMERIC | Performance mobile |
| `seo_score` | NUMERIC | Score SEO |
| `security_has_ssl` | BOOLEAN | Tem SSL? |
| `tracking_total` | INTEGER | Total de pixels |
| `full_analysis` | JSONB | Análise completa (backup) |
| `analyzed_at` | TIMESTAMP | Data da análise |

### Índices Criados

- `lead_website` - Busca rápida por URL
- `qscore` - Filtros por pontuação
- `priority` - Filtros por prioridade
- `analyzed_at` - Ordenação por data

---

## 🔒 Segurança (RLS)

O schema já vem com **Row Level Security** configurado:

- ✅ **Leitura**: Permitida para usuários autenticados
- ✅ **Escrita**: Apenas via service_role (backend)
- ✅ **Proteção**: Dados não podem ser alterados pelo frontend

---

## 💰 Limites do Tier Gratuito

| Recurso | Limite Gratuito |
|---------|-----------------|
| Database | 500 MB |
| Bandwidth | 2 GB/mês |
| Requests | Ilimitadas |
| Rows | Ilimitadas |

**Estimativa:**
- Cada análise: ~10 KB
- 500 MB = ~50.000 análises
- Mais que suficiente para uso pessoal/portfólio

---

## 🧹 Manutenção

### Limpar Análises Antigas (30+ dias)

```sql
DELETE FROM lead_analyses
WHERE analyzed_at < NOW() - INTERVAL '30 days';
```

### Ver Tamanho do Banco

```sql
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as size;
```

---

## 🚨 Troubleshooting

### Erro: "Supabase não configurado"

✅ Verifique se as variáveis estão no `.env`:
```bash
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

### Erro: "relation 'lead_analyses' does not exist"

✅ Execute o SQL schema novamente no SQL Editor

### Erro: "Invalid API key"

✅ Use a **anon public key**, não a service_role key

---

## 🎓 Recursos Adicionais

- 📚 [Documentação Supabase](https://supabase.com/docs)
- 🎥 [Supabase Crash Course](https://www.youtube.com/watch?v=7uKQBl9uZ00)
- 💬 [Discord Supabase](https://discord.supabase.com)

---

## ✅ Checklist de Setup

- [ ] Conta criada no Supabase
- [ ] Projeto criado
- [ ] Schema SQL executado
- [ ] Credenciais copiadas
- [ ] `.env` configurado
- [ ] Backend reiniciado
- [ ] Mensagem "✅ Supabase conectado" apareceu
- [ ] Primeira análise salva com sucesso

---

**🎉 Pronto! Agora suas análises são persistidas permanentemente no Supabase.**
