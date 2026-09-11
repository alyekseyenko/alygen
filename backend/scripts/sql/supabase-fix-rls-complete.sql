-- ============================================
-- CORREÇÃO COMPLETA: Políticas RLS para todas as tabelas
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- ============================================
-- TABELA: lead_analyses
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Allow read for authenticated users" ON lead_analyses;
DROP POLICY IF EXISTS "Allow insert for service role" ON lead_analyses;
DROP POLICY IF EXISTS "Allow update for service role" ON lead_analyses;
DROP POLICY IF EXISTS "Allow all for anon" ON lead_analyses;
DROP POLICY IF EXISTS "Allow all for authenticated" ON lead_analyses;
DROP POLICY IF EXISTS "Allow all for service_role" ON lead_analyses;

-- Criar novas políticas que permitem acesso com anon key
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

-- ============================================
-- TABELA: automations (se existir)
-- ============================================

-- Verificar se a tabela existe e aplicar políticas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automations') THEN
    -- Habilitar RLS
    ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas antigas
    DROP POLICY IF EXISTS "Allow all for anon" ON automations;
    DROP POLICY IF EXISTS "Allow all for authenticated" ON automations;
    DROP POLICY IF EXISTS "Allow all for service_role" ON automations;
    
    -- Criar novas políticas
    CREATE POLICY "Allow all for anon"
      ON automations
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all for authenticated"
      ON automations
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all for service_role"
      ON automations
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- TABELA: automation_logs (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automation_logs') THEN
    -- Habilitar RLS
    ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas antigas
    DROP POLICY IF EXISTS "Allow all for anon" ON automation_logs;
    DROP POLICY IF EXISTS "Allow all for authenticated" ON automation_logs;
    DROP POLICY IF EXISTS "Allow all for service_role" ON automation_logs;
    
    -- Criar novas políticas
    CREATE POLICY "Allow all for anon"
      ON automation_logs
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all for authenticated"
      ON automation_logs
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all for service_role"
      ON automation_logs
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- TABELA: contacts_log (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts_log') THEN
    -- Habilitar RLS
    ALTER TABLE contacts_log ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas antigas
    DROP POLICY IF EXISTS "Allow all for anon" ON contacts_log;
    DROP POLICY IF EXISTS "Allow all for authenticated" ON contacts_log;
    DROP POLICY IF EXISTS "Allow all for service_role" ON contacts_log;
    
    -- Criar novas políticas
    CREATE POLICY "Allow all for anon"
      ON contacts_log
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all for authenticated"
      ON contacts_log
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all for service_role"
      ON contacts_log
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- TABELA: email_sequences (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_sequences') THEN
    -- Habilitar RLS
    ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas antigas
    DROP POLICY IF EXISTS "Allow all for anon" ON email_sequences;
    DROP POLICY IF EXISTS "Allow all for authenticated" ON email_sequences;
    DROP POLICY IF EXISTS "Allow all for service_role" ON email_sequences;
    
    -- Criar novas políticas
    CREATE POLICY "Allow all for anon"
      ON email_sequences
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all for authenticated"
      ON email_sequences
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all for service_role"
      ON email_sequences
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- TABELA: certificates (se existir)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'certificates') THEN
    -- Habilitar RLS
    ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
    
    -- Remover políticas antigas
    DROP POLICY IF EXISTS "Allow all for anon" ON certificates;
    DROP POLICY IF EXISTS "Allow all for authenticated" ON certificates;
    DROP POLICY IF EXISTS "Allow all for service_role" ON certificates;
    
    -- Criar novas políticas
    CREATE POLICY "Allow all for anon"
      ON certificates
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all for authenticated"
      ON certificates
      FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

    CREATE POLICY "Allow all for service_role"
      ON certificates
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

-- Listar todas as políticas aplicadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Mensagem de sucesso
SELECT '✅ Políticas RLS aplicadas com sucesso!' as status;