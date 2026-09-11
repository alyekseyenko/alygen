import { 
  initWhatsApp, 
  sendWhatsApp, 
  getWhatsAppStatus 
} from '../services/whatsapp.js';

import { 
  getEmailTemplates, 
  upsertEmailTemplate, 
  deleteEmailTemplate,
  getContactsLog
} from '../services/supabase-service.js';

export const getTemplates = async (req, res) => {
  const result = await getEmailTemplates();
  res.status(result.success ? 200 : 500).json(result);
};

export const saveTemplate = async (req, res) => {
  const result = await upsertEmailTemplate(req.body);
  res.status(result.success ? 200 : 500).json(result);
};

export const removeTemplate = async (req, res) => {
  const result = await deleteEmailTemplate(req.params.id);
  res.status(result.success ? 200 : 500).json(result);
};

export const getWhatsAppConnectionStatus = async (req, res) => {
  try {
    const status = await getWhatsAppStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const startWhatsApp = async (req, res) => {
  try {
    await initWhatsApp();
    res.json({ success: true, message: 'WhatsApp a inicializar.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const sendWhatsAppMsg = async (req, res) => {
  try {
    const { phone, message, leadName, website } = req.body;
    if (!phone || !message) return res.status(400).json({ success: false, error: 'phone e message são obrigatórios' });
    const result = await sendWhatsApp(phone, message, leadName, website);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const listContactsLog = async (req, res) => {
  try {
    const { website } = req.query;
    const result = await getContactsLog(website);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, data: [], error: error.message });
  }
};
