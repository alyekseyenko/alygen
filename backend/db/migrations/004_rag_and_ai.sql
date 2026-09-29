CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  doc_type TEXT NOT NULL,
  title TEXT,
  sector TEXT,
  locale TEXT DEFAULT 'pt-PT',
  source_uri TEXT,
  body TEXT NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768),
  tsv tsvector,
  embedding_model TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_tsv ON document_chunks USING GIN(tsv);

CREATE TABLE IF NOT EXISTS ai_generations (
  id TEXT PRIMARY KEY,
  agent_name TEXT NOT NULL,
  prompt_version TEXT,
  lead_website TEXT,
  input_context TEXT,
  output_text TEXT,
  model TEXT,
  latency_ms INTEGER,
  approved INTEGER,
  outcome TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_lead ON ai_generations(lead_website);
