import express from 'express';
import { ingestDocument, hybridSearch } from '../services/rag/document-service.js';

const router = express.Router();

router.post('/documents/ingest', async (req, res) => {
  try {
    const apiKey = process.env.ALYGEN_API_KEY;
    const headerKey = req.headers['x-api-key'];
    const isAdmin = req.user?.role === 'admin' || (apiKey && headerKey === apiKey);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Admin ou API key necessários' });
    }
    const { docType, title, sector, body, sourceUri, metadata } = req.body;
    if (!body || !docType) {
      return res.status(400).json({ success: false, error: 'docType e body são obrigatórios' });
    }
    const result = await ingestDocument({ docType, title, sector, body, sourceUri, metadata });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const sector = req.query.sector;
    const hits = await hybridSearch({ query: q, sector, limit: parseInt(req.query.limit || '5', 10) });
    const citations = hits.map((h, i) => ({
      document_id: h.document_id,
      chunk_id: h.id,
      chunk_index: h.chunk_index,
      title: h.title,
      index: i + 1,
      score: h.rrf_score ?? h.distance ?? h.rank,
    }));
    res.json({ success: true, hits, citations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
