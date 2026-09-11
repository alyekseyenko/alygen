# 🚀 Setup Rápido do Supabase

## ✅ Credenciais Configuradas

As credenciais já foram adicionadas ao `.env`:

```
SUPABASE_URL=https://yjlqyyiqjaxezgxfbnfb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Próximos Passos

### 1. Executar o Schema SQL

1. Acesse: https://supabase.com/dashboard/project/yjlqyyiqjaxezgxfbnfb
2. Vá em **SQL Editor** (ícone de banco de dados no menu lateral)
3. Clique em **"New query"**
4. Copie TODO o conteúdo do arquivo `backend/supabase-schema.sql`
5. Cole no editor
6. Clique em **"Run"** (ou Ctrl+Enter)

✅ Você verá: `Success. No rows returned`

---

### 2. Testar a Conexão

Execute o script de teste:

```bash
cd backend
npm run test:supabase
```

Você deve ver:

```
🧪 Testando integração Supabase...

1️⃣ Testando salvamento...
✅ Análise salva com sucesso!

2️⃣ Testando busca específica...
✅ Análise recuperada com sucesso!
   Q-Score: 75
   Cached em: 2024-01-11T10:30:00.000Z

3️⃣ Testando listagem de todas as análises...
✅ 1 análises encontradas!

4️⃣ Testando estatísticas...
✅ Estatísticas calculadas:
   Total: 1
   Q-Score médio: 75.00
   Sem SSL: 0
   Alta prioridade: 0

🎉 Todos os testes concluídos!
```

---

### 3. Iniciar o Backend

```bash
npm run dev
```

Você deve ver:

```
✅ Supabase conectado
🚀 Backend rodando em http://localhost:3005
```

---

## 🎯 Como Funciona

### Cache em Camadas

```
1. Frontend solicita análise
   ↓
2. Backend verifica SUPABASE primeiro ⚡
   ├─ Se encontrar → Retorna (instantâneo)
   └─ Se não encontrar → Continua
   ↓
3. Backend verifica cache LOCAL
   ├─ Se encontrar → Retorna
   └─ Se não encontrar → Continua
   ↓
4. Backend faz análise COMPLETA (APIs)
   ↓
5. Salva no SUPABASE + Cache Local
   ↓
6. Retorna resultado
```

---

## 📊 Endpoints Disponíveis

### Listar Análises
```bash
GET http://localhost:3005/api/supabase/analyses
```

### Buscar Análise Específica
```bash
GET http://localhost:3005/api/supabase/analysis/https://example.com
```

### Estatísticas
```bash
GET http://localhost:3005/api/supabase/stats
```

---

## 🔍 Verificar no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/yjlqyyiqjaxezgxfbnfb
2. Vá em **Table Editor**
3. Selecione a tabela `lead_analyses`
4. Você verá todas as análises salvas

---

## ✅ Checklist

- [x] Credenciais adicionadas ao `.env`
- [ ] Schema SQL executado no Supabase
- [ ] Teste executado com sucesso (`npm run test:supabase`)
- [ ] Backend iniciado e conectado ao Supabase
- [ ] Primeira análise salva e recuperada

---

**🎉 Pronto! Agora suas análises são persistidas permanentemente!**
