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
