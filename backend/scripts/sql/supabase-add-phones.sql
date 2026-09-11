-- ============================================
-- ADICIONAR COLUNA: extracted_phones
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Adicionar coluna para telefones extraídos
ALTER TABLE lead_analyses 
ADD COLUMN IF NOT EXISTS extracted_phones JSONB;

-- Comentário
COMMENT ON COLUMN lead_analyses.extracted_phones IS 'Telefones extraídos do website ou redes sociais (array JSON)';
