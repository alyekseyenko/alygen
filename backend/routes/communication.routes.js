import express from 'express';
import { 
  getTemplates, 
  saveTemplate, 
  removeTemplate,
  getWhatsAppConnectionStatus,
  startWhatsApp,
  sendWhatsAppMsg,
  listContactsLog
} from '../controllers/communication.controller.js';

const router = express.Router();

// Templates
router.get('/templates', getTemplates);
router.post('/templates', saveTemplate);
router.delete('/templates/:id', removeTemplate);

// WhatsApp
router.get('/whatsapp/status', getWhatsAppConnectionStatus);
router.post('/whatsapp/init', startWhatsApp);
router.post('/send-whatsapp', sendWhatsAppMsg);

// Contacts Log
router.get('/contacts-log', listContactsLog);

export default router;
