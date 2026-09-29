# RAG and vectors (English)

## Storage
- `documents` — source playbooks, case studies (PT-PT).
- `document_chunks` — `embedding vector(768)`, `embedding_model`, `tsv` (Portuguese).
- `semantic_memories` — cached market-intel text + embedding (sector/district TTL 7d).

## Ingestion
`POST /api/rag/documents/ingest` (admin). Chunking ~900 chars with ~100 overlap; embeddings via Ollama `nomic-embed-text` or Gemini `text-embedding-004` (one model per environment).

## Retrieval
Hybrid **RRF** (k=60): top-k vector (cosine, HNSW index) + top-k `ts_rank_cd` FTS, fused; filter `embedding_model` on vector leg.

## Citations
`buildRagContextPack` and `GET /api/rag/search` return `document_id`, `chunk_id`, `chunk_index`, score.

## Semantic cache
Stores full `intel_text`; hit only if same sector, district match, cosine distance ≤ 0.15, not same website, within TTL. Never returns generic template text.
