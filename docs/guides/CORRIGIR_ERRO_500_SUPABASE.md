# 🔧 Correção do Erro 500 - Supabase Analyses

## ❌ Problema
Ao clicar em "Analisar Todos", ocorre erro 500 no endpoint `/api/supabase/analyses`.

**Causa:** Row Level Security (RLS) está bloqueando o acesso da chave anônima (`SUPABASE_ANON_KEY`) à tabela `lead_analyses`.

## ✅ Solução

### Opção 1: Adicionar Service Role Key (RECOMENDADO)

A Service Role Key bypassa o RLS automaticamente:

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto
3. Vá em **Settings** > **API**
4. Copie a **`service_role`** key (NÃO a anon key)
5. Adicione ao arquivo `backend/.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (sua service role key)
```

6. Reinicie o backend:
```bash
cd backend && npm run dev
```

O console deve mostrar: `✅ Supabase conectado (Service Role (bypass RLS))`

---

### Opção 2: Corrigir RLS no Supabase

### Passo 1: Abrir o Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto: `yjlqyyiqjaxezgxfbnfb`
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Executar o SQL de Correção

1. Clique em **New Query**
2. Cole o conteúdo do arquivo `backend/supabase-fix-rls-complete.sql`
3. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar

Após executar, você deve ver:
- ✅ Mensagem: "Políticas RLS aplicadas com sucesso!"
- Lista de políticas aplicadas às tabelas

### Passo 4: Testar

1. Reinicie o backend: `cd backend && npm run dev`
2. No frontend, clique em "Analisar Todos"
3. O erro 500 deve ter desaparecido

---

## 📋 SQL Rápido (copie e cole)

```sql
-- Correção rápida para a tabela lead_analyses
DROP POLICY IF EXISTS "Allow read for authenticated users" ON lead_analyses;
DROP POLICY IF EXISTS "Allow insert for service role" ON lead_analyses;
DROP POLICY IF EXISTS "Allow update for service role" ON lead_analyses;

CREATE POLICY "Allow all for anon"
  ON lead_analyses
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for authenticated"
  ON lead_analyses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all for service_role"
  ON lead_analyses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

SELECT '✅ Corrigido!' as status;
```

---

## 🔍 Diagnóstico

Se o problema persistir, execute este SQL para verificar:

```sql
-- Verificar políticas atuais
SELECT * FROM pg_policies WHERE tablename = 'lead_analyses';

-- Verificar se RLS está ativo
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'lead_analyses';
```

---

## 📁 Arquivos Relacionados

- `backend/supabase-fix-rls-complete.sql` - Script completo de correção
- `backend/supabase-service.js` - Serviço que conecta ao Supabase
- `backend/server.js` - Endpoint `/api/supabase/analyses`