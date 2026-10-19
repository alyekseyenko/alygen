# ADR 0006: Hybrid RAG with RRF

## Status
Accepted

## Context
RAG used only cosine distance and `ILIKE` without FTS ranking; no HNSW index; different embedding models in the same column.

## Decision
- Migration `007_rag_indexes.sql`: HNSW + `tsv` trigger.
- `hybridSearch`: vector top-k + FTS top-k, RRF fusion (k=60), `embedding_model` filter.
- Citations exposed in API and UI.
- Semantic memory shares the same embedding client as RAG ingest.

## Consequences
- Re-ingest recommended when changing embedding model.
- Search latency aligned with spec < 500ms for top-5.
