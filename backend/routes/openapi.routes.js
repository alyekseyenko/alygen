import express from 'express';

const router = express.Router();

router.get('/openapi.json', (req, res) => {
  res.json({
    openapi: '3.0.3',
    info: { title: 'Alygen CRM API', version: '2026.1.0' },
    servers: [{ url: process.env.PUBLIC_API_URL || 'http://localhost:3001' }],
    paths: {
      '/api/fetch-leads': { get: { summary: 'Listar leads enriquecidos' } },
      '/api/analyze-lead': { post: { summary: 'Enfileirar auditoria técnica' } },
      '/api/leads/{id}/market-intel': { post: { summary: 'Inteligência multi-agente' } },
      '/api/rag/search': { get: { summary: 'Pesquisa híbrida RAG' } },
      '/api/auth/login': { post: { summary: 'Login JWT' } },
    },
  });
});

export default router;
