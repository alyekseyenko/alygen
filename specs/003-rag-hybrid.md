# Spec: Hybrid B2B RAG

## Problem
Enrich agents with Alygen playbooks and niche knowledge without hallucinating competitors.

## Criteria
- Ingestion POST `/api/rag/documents/ingest` (admin).
- Search GET `/api/rag/search?q=&sector=` returns chunks **and citations** (`document_id`, `title`, `chunk_index`, `score`).
- Embeddings: one active model per environment (Ollama `nomic-embed-text` **or** Gemini `text-embedding-004`); `embedding_model` column filtered on all vector queries.
- Chunking: ~800 tokens with ~100 overlap, paragraph-aware; batch embeddings when possible.
- Postgres indexes: HNSW on `document_chunks.embedding` and `semantic_memories.embedding` (`vector_cosine_ops`); GIN on `tsv`; trigger maintains `tsv` on INSERT/UPDATE.
- Hybrid retrieval: top-k vector + top-k `ts_rank_cd` FTS, **RRF** fusion (k=60); do not mix embedding models.
- Context pack injected into `/agent/market-intel` via `rag_context`; Python may call `rag_search` tool.
- Semantic memory: store full `intel` text; cache only with same `sector`, cosine distance below threshold, and TTL (e.g. 7 days).

## Metrics
- Top-5 relevant chunks in < 500ms (local Postgres with HNSW).
- Incorrect semantic cache rate = 0% (no generic phrases replacing agents).
