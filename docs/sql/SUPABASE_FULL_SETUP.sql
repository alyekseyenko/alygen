-- ============================================
-- TABELA: lead_analyses
-- Descrição: Armazena todas as análises completas de leads
-- ============================================

CREATE TABLE IF NOT EXISTS lead_analyses (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Lead Information
  lead_name TEXT NOT NULL,
  lead_website TEXT UNIQUE NOT NULL,
  lead_email TEXT,
  lead_phone TEXT,
  lead_address TEXT,
  lead_city TEXT,
  lead_postal_code TEXT,
  lead_type TEXT,
  lead_rating NUMERIC,
  lead_reviews INTEGER,
  
  -- Q Score
  qscore NUMERIC NOT NULL DEFAULT 0,
  qscore_grade TEXT,
  qscore_category TEXT,
  
  -- Performance
  performance_mobile NUMERIC DEFAULT 0,
  performance_desktop NUMERIC DEFAULT 0,
  
  -- SEO
  seo_score NUMERIC DEFAULT 0,
  seo_title TEXT,
  seo_has_title BOOLEAN DEFAULT false,
  seo_has_meta_description BOOLEAN DEFAULT false,
  seo_h1_count INTEGER DEFAULT 0,
  seo_images_without_alt INTEGER DEFAULT 0,
  seo_has_sitemap BOOLEAN DEFAULT false,
  seo_has_robots_txt BOOLEAN DEFAULT false,
  
  -- Security
  security_score NUMERIC DEFAULT 0,
  security_has_ssl BOOLEAN DEFAULT false,
  
  -- Accessibility
  accessibility_score NUMERIC DEFAULT 0,
  accessibility_errors INTEGER DEFAULT 0,
  accessibility_warnings INTEGER DEFAULT 0,
  
  -- Tracking/Pixels
  tracking_total INTEGER DEFAULT 0,
  tracking_facebook BOOLEAN DEFAULT false,
  tracking_ga4 BOOLEAN DEFAULT false,
  tracking_gtm BOOLEAN DEFAULT false,
  tracking_google_ads BOOLEAN DEFAULT false,
  tracking_tiktok BOOLEAN DEFAULT false,
  tracking_linkedin BOOLEAN DEFAULT false,
  tracking_hotjar BOOLEAN DEFAULT false,
  
  -- Google Ranking
  google_ranking_position INTEGER,
  google_ranking_keyword TEXT,
  google_ranking_url TEXT,
  
  -- Core Web Vitals
  cwv_lcp_value TEXT,
  cwv_lcp_score TEXT,
  cwv_fid_value TEXT,
  cwv_fid_score TEXT,
  cwv_cls_value TEXT,
  cwv_cls_score TEXT,
  
  -- CTAs
  cta_count INTEGER DEFAULT 0,
  cta_high_effectiveness INTEGER DEFAULT 0,
  
  -- Priority
  priority TEXT,
  
  -- Q Score Advanced (JSON)
  qscore_advanced_sector TEXT,
  qscore_advanced_region TEXT,
  qscore_advanced_penalties JSONB,
  qscore_advanced_priorities JSONB,
  qscore_advanced_benchmark JSONB,
  qscore_advanced_roi JSONB,
  
  -- Pricing
  pricing_total NUMERIC DEFAULT 0,
  pricing_timeline INTEGER DEFAULT 0,
  pricing_market_average NUMERIC DEFAULT 0,
  pricing_savings NUMERIC DEFAULT 0,
  pricing_percentage_saved NUMERIC DEFAULT 0,
  
  -- Extracted Data
  extracted_emails JSONB,
  
  -- Social Media
  is_social_media_only BOOLEAN DEFAULT false,
  social_media_platform TEXT,
  
  -- Full Analysis Backup
  full_analysis JSONB NOT NULL,
  
  -- Metadata
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analysis_version TEXT DEFAULT '2.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES para melhorar performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_lead_website ON lead_analyses(lead_website);
CREATE INDEX IF NOT EXISTS idx_qscore ON lead_analyses(qscore);
CREATE INDEX IF NOT EXISTS idx_priority ON lead_analyses(priority);
CREATE INDEX IF NOT EXISTS idx_analyzed_at ON lead_analyses(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_ssl ON lead_analyses(security_has_ssl);
CREATE INDEX IF NOT EXISTS idx_lead_city ON lead_analyses(lead_city);

-- ============================================
-- TRIGGER para atualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lead_analyses_updated_at
  BEFORE UPDATE ON lead_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS úteis
-- ============================================

-- View: Leads com problemas críticos
CREATE OR REPLACE VIEW critical_leads AS
SELECT 
  id,
  lead_name,
  lead_website,
  qscore,
  priority,
  security_has_ssl,
  performance_mobile,
  seo_score,
  analyzed_at
FROM lead_analyses
WHERE 
  qscore < 40 
  OR security_has_ssl = false 
  OR performance_mobile < 30
ORDER BY qscore ASC;

-- View: Estatísticas gerais
CREATE OR REPLACE VIEW analytics_stats AS
SELECT 
  COUNT(*) as total_analyses,
  ROUND(AVG(qscore), 2) as avg_qscore,
  ROUND(AVG(performance_mobile), 2) as avg_performance_mobile,
  ROUND(AVG(seo_score), 2) as avg_seo_score,
  COUNT(*) FILTER (WHERE security_has_ssl = false) as without_ssl,
  COUNT(*) FILTER (WHERE priority = 'ALTA') as high_priority,
  ROUND(AVG(tracking_total), 2) as avg_tracking
FROM lead_analyses;

-- View: Top performers
CREATE OR REPLACE VIEW top_performers AS
SELECT 
  id,
  lead_name,
  lead_website,
  qscore,
  performance_mobile,
  seo_score,
  security_score,
  analyzed_at
FROM lead_analyses
WHERE qscore >= 80
ORDER BY qscore DESC
LIMIT 10;

-- ============================================
-- RLS (Row Level Security) - Opcional
-- ============================================

-- Habilitar RLS
ALTER TABLE lead_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir leitura para todos autenticados
CREATE POLICY "Allow read for authenticated users"
  ON lead_analyses
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Permitir insert/update para service_role
CREATE POLICY "Allow insert for service role"
  ON lead_analyses
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow update for service role"
  ON lead_analyses
  FOR UPDATE
  TO service_role
  USING (true);

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE lead_analyses IS 'Armazena análises completas de leads com todas as métricas';
COMMENT ON COLUMN lead_analyses.qscore IS 'Pontuação global de qualidade (0-100)';
COMMENT ON COLUMN lead_analyses.full_analysis IS 'Backup completo da análise em JSON';
COMMENT ON COLUMN lead_analyses.analyzed_at IS 'Data e hora da análise';
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

-- ============================================
-- 🚀 SUPABASE - ATUALIZAÇÃO ÚNICA
-- Execute APENAS este SQL no Supabase SQL Editor
-- ============================================

-- 1️⃣ Adicionar coluna de telefones (se não existir)
ALTER TABLE lead_analyses 
ADD COLUMN IF NOT EXISTS extracted_phones JSONB;

COMMENT ON COLUMN lead_analyses.extracted_phones IS 'Telefones extraídos do website ou redes sociais (array JSON)';

-- ✅ PRONTO! Isso é tudo que precisa.
-- O sistema já guarda 100% dos dados em full_analysis

-- ============================================
-- 📊 VERIFICAR SE FUNCIONOU
-- ============================================

-- Ver estrutura da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lead_analyses'
ORDER BY ordinal_position;

-- Ver análises guardadas
SELECT 
  lead_name,
  lead_website,
  qscore,
  extracted_phones,
  analyzed_at
FROM lead_analyses
ORDER BY analyzed_at DESC
LIMIT 5;
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
-- Tabela para guardar o estado das automações em pausa (Waits e Approvals)
-- Isto garante que se o servidor reiniciar, as automações retomam onde pararam.

CREATE TABLE IF NOT EXISTS public.automation_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,
    current_node_id TEXT NOT NULL,
    context JSONB DEFAULT '{}', -- Guarda variáveis da lead, qScore, etc.
    resume_at TIMESTAMPTZ NOT NULL, -- Data e hora para acordar o nó
    status TEXT DEFAULT 'pending', -- pending, processing, completed
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index para o worker procurar rápido quem está pronto a acordar
CREATE INDEX IF NOT EXISTS idx_automation_resume ON public.automation_states (resume_at) WHERE status = 'pending';

-- Habilitar Realtime (opcional mas bom para debugging)
ALTER PUBLICATION supabase_realtime ADD TABLE automation_states;
-- CREATE EMAIL TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE RESTRICTIONS (RLS)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
DROP POLICY IF EXISTS "Allow public read access to templates" ON public.email_templates;
CREATE POLICY "Allow public read access to templates"
ON public.email_templates FOR SELECT
USING (true);

-- Allow anyone to insert
DROP POLICY IF EXISTS "Allow public insert to templates" ON public.email_templates;
CREATE POLICY "Allow public insert to templates"
ON public.email_templates FOR INSERT
WITH CHECK (true);

-- Allow anyone to update
DROP POLICY IF EXISTS "Allow public update to templates" ON public.email_templates;
CREATE POLICY "Allow public update to templates"
ON public.email_templates FOR UPDATE
USING (true);

-- Allow anyone to delete
DROP POLICY IF EXISTS "Allow public delete to templates" ON public.email_templates;
CREATE POLICY "Allow public delete to templates"
ON public.email_templates FOR DELETE
USING (true);
