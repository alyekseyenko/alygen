-- ============================================
-- CORREÇÃO: Políticas RLS para permitir anon key
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Allow read for authenticated users" ON lead_analyses;
DROP POLICY IF EXISTS "Allow insert for service role" ON lead_analyses;
DROP POLICY IF EXISTS "Allow update for service role" ON lead_analyses;

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
