# ADR 0006: Hybrid RAG with RRF

## Status
Aceite

## Contexto
RAG usava apenas distância cosine e `ILIKE` sem ranking FTS; sem índice HNSW; embeddings de modelos diferentes na mesma coluna.

## Decisão
- Migração `007_rag_indexes.sql`: HNSW + trigger `tsv`.
- `hybridSearch`: vector top-k + FTS top-k, fusão RRF (k=60), filtro `embedding_model`.
- Citações expostas na API e UI.
- Memória semântica partilha o mesmo cliente de embeddings que RAG ingest.

## Consequências
- Re-ingest recomendado ao mudar modelo de embedding.
- Latência de pesquisa alinhada com spec < 500ms para top-5.
