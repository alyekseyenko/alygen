ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS trace_id TEXT;
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS tokens_in INTEGER;
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS tokens_out INTEGER;
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS cost_eur REAL;
ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS degraded INTEGER;

CREATE INDEX IF NOT EXISTS idx_ai_generations_trace ON ai_generations(trace_id);
