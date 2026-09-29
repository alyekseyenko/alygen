-- Store full market-intel text for semantic cache (no generic templates)
ALTER TABLE semantic_memories ADD COLUMN IF NOT EXISTS intel_text TEXT;
