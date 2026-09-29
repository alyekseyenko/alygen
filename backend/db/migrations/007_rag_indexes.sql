CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
  ON document_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_semantic_memories_embedding_hnsw
  ON semantic_memories USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION document_chunks_tsv_trigger() RETURNS trigger AS $$
BEGIN
  NEW.tsv := to_tsvector('portuguese', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_document_chunks_tsv ON document_chunks;
CREATE TRIGGER trg_document_chunks_tsv
  BEFORE INSERT OR UPDATE OF content ON document_chunks
  FOR EACH ROW EXECUTE FUNCTION document_chunks_tsv_trigger();
