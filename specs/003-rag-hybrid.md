# Spec: RAG híbrido B2B

## Problema
Enriquecer agentes com playbooks Alygen e conhecimento de nicho sem alucinar concorrentes.

## Critérios
- Ingestão POST `/api/rag/documents/ingest` (admin).
- Pesquisa GET `/api/rag/search?q=&sector=` retorna chunks **e citações** (`document_id`, `title`, `chunk_index`, `score`).
- Embeddings: um modelo activo por ambiente (Ollama `nomic-embed-text` **ou** Gemini `text-embedding-004`); coluna `embedding_model` filtrada em todas as queries vectoriais.
- Chunking: ~800 tokens com overlap ~100, parágrafos; embeddings em batch quando possível.
- Índices Postgres: HNSW em `document_chunks.embedding` e `semantic_memories.embedding` (`vector_cosine_ops`); GIN em `tsv`; trigger mantém `tsv` em INSERT/UPDATE.
- Retrieval híbrido: top-k vector + top-k `ts_rank_cd` FTS, fusão **RRF** (k=60); sem misturar modelos de embedding.
- Context pack injetado em `/agent/market-intel` via `rag_context`; Python pode chamar `rag_search` tool.
- Memória semântica: guardar texto `intel` completo; cache só com mesmo `sector`, distância cosine < limiar e TTL (ex. 7 dias).

## Métricas
- Top-5 chunks relevantes em < 500ms (Postgres local com HNSW).
- Taxa de cache semântico incorrecto = 0% (sem frases genéricas substituindo agentes).
