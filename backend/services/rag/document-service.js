import crypto from 'crypto';
import db from '../local-db-service.js';
import { embedText } from './embedding-service.js';

function chunkText(body, maxLen = 900, overlap = 100) {
  const paragraphs = body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = '';
  for (const p of paragraphs) {
    if ((buf + '\n\n' + p).length > maxLen && buf) {
      chunks.push(buf.trim());
      const tail = buf.slice(-overlap);
      buf = tail ? `${tail}\n\n${p}` : p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) chunks.push(buf.trim());
  if (chunks.length === 0 && body) chunks.push(body.slice(0, maxLen));
  return chunks;
}

const RRF_K = 60;

function rrfMerge(vectorHits, ftsHits, limit = 5) {
  const scores = new Map();
  const meta = new Map();
  vectorHits.forEach((row, rank) => {
    const id = row.id || `${row.document_id}-${row.chunk_index}`;
    scores.set(id, (scores.get(id) || 0) + 1 / (RRF_K + rank + 1));
    meta.set(id, row);
  });
  ftsHits.forEach((row, rank) => {
    const id = row.id || `${row.document_id}-${row.chunk_index}`;
    scores.set(id, (scores.get(id) || 0) + 1 / (RRF_K + rank + 1));
    if (!meta.has(id)) meta.set(id, row);
  });
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, score]) => ({ ...meta.get(id), rrf_score: score }));
}

export async function ingestDocument({ docType, title, sector, body, sourceUri = null, metadata = {} }) {
  const docId = crypto.randomUUID();
  await db.query(
    `INSERT INTO documents (id, doc_type, title, sector, source_uri, body, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [docId, docType, title, sector || null, sourceUri, body, JSON.stringify(metadata)]
  );

  const parts = chunkText(body);
  for (let i = 0; i < parts.length; i++) {
    const chunkId = crypto.randomUUID();
    const emb = await embedText(parts[i]);
    const embJson = emb ? JSON.stringify(emb.vector) : null;
    const model = emb?.model || null;

    await db.query(
      `INSERT INTO document_chunks (id, document_id, chunk_index, content, embedding, embedding_model)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [chunkId, docId, i, parts[i], embJson, model]
    );

    try {
      await db.query(
        `UPDATE document_chunks SET tsv = to_tsvector('portuguese', $1) WHERE id = $2`,
        [parts[i], chunkId]
      );
    } catch {
      /* SQLite: no tsvector */
    }
  }

  return { success: true, documentId: docId, chunks: parts.length };
}

export async function hybridSearch({ query, sector, limit = 5 }) {
  const emb = await embedText(query);
  const model = emb?.model || null;
  let vectorHits = [];
  let ftsHits = [];

  if (emb?.vector) {
    try {
      const vecRes = await db.query(
        `SELECT dc.id, dc.chunk_index, dc.content, dc.document_id, d.title, d.sector,
                (dc.embedding <=> $1::vector) AS distance
         FROM document_chunks dc
         JOIN documents d ON d.id = dc.document_id
         WHERE dc.embedding IS NOT NULL
           AND ($2::text IS NULL OR dc.embedding_model = $2)
           AND ($3::text IS NULL OR d.sector ILIKE $3)
         ORDER BY distance ASC
         LIMIT $4`,
        [JSON.stringify(emb.vector), model, sector ? `%${sector}%` : null, limit * 2]
      );
      vectorHits = vecRes.rows || [];
    } catch {
      /* pgvector unavailable */
    }
  }

  try {
    const ftsRes = await db.query(
      `SELECT dc.id, dc.chunk_index, dc.content, dc.document_id, d.title, d.sector,
              ts_rank_cd(dc.tsv, plainto_tsquery('portuguese', $1)) AS rank
       FROM document_chunks dc
       JOIN documents d ON d.id = dc.document_id
       WHERE dc.tsv @@ plainto_tsquery('portuguese', $1)
         AND ($2::text IS NULL OR d.sector ILIKE $2)
       ORDER BY rank DESC
       LIMIT $3`,
      [query, sector ? `%${sector}%` : null, limit * 2]
    );
    ftsHits = ftsRes.rows || [];
  } catch {
    const term = `%${query}%`;
    const fallback = await db.query(
      `SELECT dc.id, dc.chunk_index, dc.content, dc.document_id, d.title, d.sector
       FROM document_chunks dc
       JOIN documents d ON d.id = dc.document_id
       WHERE dc.content ILIKE $1
       ${sector ? 'AND d.sector ILIKE $3' : ''}
       LIMIT $2`,
      sector ? [term, limit * 2, `%${sector}%`] : [term, limit * 2]
    );
    ftsHits = fallback.rows || [];
  }

  return rrfMerge(vectorHits, ftsHits, limit);
}

export async function buildRagContextPack(sector, city, extraQuery = '') {
  const query = `${sector} em ${city}. ${extraQuery}`.trim();
  const hits = await hybridSearch({ query, sector, limit: 5 });
  if (!hits.length) return { text: '', citations: [] };

  const citations = hits.map((h, i) => ({
    document_id: h.document_id,
    chunk_id: h.id,
    chunk_index: h.chunk_index,
    title: h.title,
    index: i + 1,
    score: h.rrf_score ?? h.distance ?? h.rank,
  }));
  const text = hits.map((h, i) => `[${i + 1}] ${h.title || 'Doc'}: ${h.content}`).join('\n\n');
  return { text, citations };
}

export default { ingestDocument, hybridSearch, buildRagContextPack };
