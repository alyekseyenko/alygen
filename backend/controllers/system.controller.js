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
