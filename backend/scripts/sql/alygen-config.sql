-- ============================================
-- TABELA: alygen_config
-- Descrição: Armazena dados mestres fiscais (NIF, IBAN, Assinatura) da Central Alygen
-- ============================================

CREATE TABLE IF NOT EXISTS alygen_config (
  id TEXT PRIMARY KEY DEFAULT 'global',
  nif TEXT,
  address TEXT,
  iban TEXT,
  swift TEXT,
  signature_base64 TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- RLS (Row Level Security) - Bypass
-- Permitir total acesso ao service_role e anon para facilitar frontend e backend
-- ============================================

ALTER TABLE alygen_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" 
  ON alygen_config FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert" 
  ON alygen_config FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update" 
  ON alygen_config FOR UPDATE 
  USING (true);

-- Comentários
COMMENT ON TABLE alygen_config IS 'Central de Configurações Fiscais da Alygen (Mestre)';
