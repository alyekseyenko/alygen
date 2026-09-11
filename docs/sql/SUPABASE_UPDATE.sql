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
