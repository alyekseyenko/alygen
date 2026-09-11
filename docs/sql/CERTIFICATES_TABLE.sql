-- ============================================
-- 📜 TABELA DE CERTIFICADOS ALYGEN
-- Execute no Supabase SQL Editor
-- ============================================

-- Criar tabela de certificados
CREATE TABLE IF NOT EXISTS certificates (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identificação
  certificate_id TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  website TEXT NOT NULL,
  
  -- Scores
  qscore INTEGER NOT NULL,
  qgrade TEXT NOT NULL,
  
  -- Métricas
  metrics JSONB,
  
  -- Datas
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- Certificado completo
  full_certificate JSONB NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_website ON certificates(website);
CREATE INDEX IF NOT EXISTS idx_certificates_qscore ON certificates(qscore);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at DESC);

-- Comentários
COMMENT ON TABLE certificates IS 'Certificados de verificação ALYGEN emitidos para clientes';
COMMENT ON COLUMN certificates.certificate_id IS 'ID único do certificado (ex: ALY-2024-A3F9B2)';
COMMENT ON COLUMN certificates.qscore IS 'Q Score do cliente (0-100)';
COMMENT ON COLUMN certificates.qgrade IS 'Grade do Q Score (A, B, C, D, F)';
COMMENT ON COLUMN certificates.metrics IS 'Métricas detalhadas (performance, SEO, security, etc)';
COMMENT ON COLUMN certificates.valid_until IS 'Data de expiração do certificado (1 ano)';

-- ============================================
-- 🔍 QUERIES ÚTEIS
-- ============================================

-- Ver todos os certificados
SELECT 
  certificate_id,
  company_name,
  qscore,
  qgrade,
  issued_at,
  valid_until
FROM certificates
ORDER BY issued_at DESC;

-- Buscar certificado por ID
SELECT * FROM certificates 
WHERE certificate_id = 'ALY-2024-XXXXXX';

-- Certificados por empresa
SELECT * FROM certificates 
WHERE company_name ILIKE '%nome%'
ORDER BY issued_at DESC;

-- Certificados expirados
SELECT 
  certificate_id,
  company_name,
  valid_until
FROM certificates
WHERE valid_until < NOW()
ORDER BY valid_until DESC;

-- Estatísticas
SELECT 
  COUNT(*) as total_certificados,
  AVG(qscore) as qscore_medio,
  COUNT(CASE WHEN qscore >= 80 THEN 1 END) as grade_a,
  COUNT(CASE WHEN qscore >= 60 AND qscore < 80 THEN 1 END) as grade_b,
  COUNT(CASE WHEN qscore >= 40 AND qscore < 60 THEN 1 END) as grade_c,
  COUNT(CASE WHEN qscore < 40 THEN 1 END) as grade_d_f
FROM certificates;
