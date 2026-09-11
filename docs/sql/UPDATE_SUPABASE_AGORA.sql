-- ================================================================
-- 1) CRIAR TABELA DE CONFIGURAÇÃO FISCAL MESTRE (ALYGEN CONFIG)
-- ================================================================
CREATE TABLE IF NOT EXISTS alygen_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  nif TEXT,
  address TEXT,
  iban TEXT,
  swift TEXT,
  signature_base64 TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- 2) ADICIONAR COLUNAS DE CRM QUE FALTAVAM NA TABELA LEAD_ANALYSES
-- ================================================================
ALTER TABLE lead_analyses
  ADD COLUMN IF NOT EXISTS crm_stage TEXT DEFAULT 'LEAD',
  ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_immune BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS private_notes TEXT,
  ADD COLUMN IF NOT EXISTS client_email TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS client_address TEXT,
  ADD COLUMN IF NOT EXISTS client_nif TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'WEBSITE',
  ADD COLUMN IF NOT EXISTS budget_items JSONB,
  ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;

-- ================================================================
-- 3) REGRAS DE SEGURANÇA (Para não dar bloqueio no painel)
-- ================================================================
-- Permissões para alygen_config
ALTER TABLE alygen_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select" ON alygen_config;
CREATE POLICY "Allow public select" ON alygen_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert" ON alygen_config;
CREATE POLICY "Allow public insert" ON alygen_config FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update" ON alygen_config;
CREATE POLICY "Allow public update" ON alygen_config FOR UPDATE USING (true);

COMMENT ON TABLE alygen_config IS 'Central de Configurações Fiscais da Alygen (Mestre)';

-- ================================================================
-- 4) MIGRAÇÃO DE DADOS (RECUPERAR OS ESCUDOS E CRMS ANTIGOS)
-- ================================================================
-- Como adicionámos estas colunas novas, os clientes antigos perderam as flags.
-- Isto vai extrair o is_immune, budget e o state do JsonB `full_analysis` e
-- colocá-los nas respetivas colunas nativas que acabámos de criar.
UPDATE lead_analyses
SET 
  is_immune = COALESCE((full_analysis->>'is_immune')::boolean, false),
  crm_stage = COALESCE(full_analysis->>'crm_stage', 'LEAD'),
  budget = COALESCE((full_analysis->>'budget')::numeric, 0),
  private_notes = full_analysis->>'private_notes',
  client_email = full_analysis->>'client_email',
  client_phone = full_analysis->>'client_phone',
  client_nif = full_analysis->>'client_nif',
  client_address = full_analysis->>'client_address',
  contact_person = full_analysis->>'contact_person',
  project_type = COALESCE(full_analysis->>'project_type', 'WEBSITE');

