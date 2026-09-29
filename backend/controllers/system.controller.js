import { 
  captureWebsiteScreenshot, 
  captureMultipleScreenshots, 
  cleanupOldScreenshots 
} from '../services/screenshot-service.js';

import { 
  generateCertificate, 
  saveCertificate, 
  getCertificate 
} from '../services/certificate-service.js';
import db from '../services/local-db-service.js';

export const getAnalysisRunById = async (req, res) => {
  try {
    const { getAnalysisRun } = await import('../services/analysis-runs-service.js');
    const result = await getAnalysisRun(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const postAiGenerationFeedback = async (req, res) => {
  try {
    const { traceId, id, approved, outcome } = req.body || {};
    if (!traceId && !id) {
      return res.status(400).json({ success: false, error: 'traceId ou id obrigatório' });
    }
    const approvedVal = approved === true || approved === 1 || approved === '1';
    const params = [];
    let sql = 'UPDATE ai_generations SET approved = $1, outcome = $2 WHERE ';
    if (id) {
      sql += 'id = $3';
      params.push(approvedVal ? 1 : 0, outcome || null, id);
    } else {
      sql += 'trace_id = $3';
      params.push(approvedVal ? 1 : 0, outcome || null, traceId);
    }
    const result = await db.query(sql, params);
    if (!result.rowCount) {
      return res.status(404).json({ success: false, error: 'Geração não encontrada' });
    }
    res.json({ success: true, updated: result.rowCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getAiMetrics = async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE degraded = 1)::int AS degraded_count,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95_latency_ms,
        COALESCE(SUM(cost_eur), 0) AS total_cost_eur,
        COUNT(*) FILTER (WHERE approved = 1)::int AS approved_count
      FROM ai_generations
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    const row = stats.rows?.[0] || {};
    const total = row.total || 0;
    res.json({
      success: true,
      window_days: 7,
      total_generations: total,
      fallback_rate: total ? (row.degraded_count || 0) / total : 0,
      p95_latency_ms: row.p95_latency_ms,
      total_cost_eur: row.total_cost_eur,
      approval_rate: total ? (row.approved_count || 0) / total : 0,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getScreenshots = async (req, res) => {
  try {
    const { url, device } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL é obrigatória' });
    
    const result = await captureWebsiteScreenshot(url, { device: device || 'mobile' });
    if (result.success) {
      res.json({ success: true, data: { filename: result.filename, url: `/screenshots/${result.filename}`, base64: result.base64, device: result.device } });
    } else res.status(500).json({ success: false, error: result.error });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMultipleScreenshots = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL é obrigatória' });
    const results = await captureMultipleScreenshots(url);
    res.json({ success: true, data: { mobile: results.mobile, desktop: results.desktop } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const clearScreenshots = (req, res) => {
  try {
    const result = cleanupOldScreenshots();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCertificate = async (req, res) => {
  try {
    const { companyName, website, qscore, qgrade, metrics } = req.body;
    if (!companyName || !website || qscore === undefined) return res.status(400).json({ success: false, error: 'Dados incompletos' });
    
    const existing = await getCertificate(website);
    if (existing.success) return res.json({ success: true, certificate: existing.certificate, cached: true });
    
    const certificate = generateCertificate(companyName, website, qscore, qgrade, metrics);
    const saved = await saveCertificate(certificate);
    
    if (saved.success) res.json({ success: true, certificate, cached: false });
    else res.status(500).json({ success: false, error: saved.error });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCertificateByWebsite = async (req, res) => {
  try {
    const website = decodeURIComponent(req.params.website);
    const result = await getCertificate(website);
    if (result.success) res.json({ success: true, certificate: result.certificate });
    else res.status(404).json({ success: false, error: 'Certificado não encontrado' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const handleCalendly = async (req, res) => {
  try {
    const webhookSecret = process.env.CALENDLY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : req.headers['x-calendly-webhook-secret'];
      if (token !== webhookSecret) {
        return res.status(401).json({ success: false, error: 'Webhook Calendly não autorizado' });
      }
    }

    const { event, payload } = req.body;
    if (event === 'invitee.created') {
        const { handleCalendlyBooking } = await import('../services/calendly-service.js');
        await handleCalendlyBooking(payload);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
