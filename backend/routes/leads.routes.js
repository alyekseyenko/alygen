import express from 'express';
import { 
  getLeads, 
  analyzeLead, 
  sendLeadEmail,
  trackEmailOpen,
  getQuotaStatus,
  updateEmail,
  getQueueStats,
  getAnalysisStatus,
  clearCompletedQueues,
  getMarketIntel,
  analyzeTester,
  promoteLead,
  eraseLead,
  unsubscribeLead,
  cleanupDataRetention
} from '../controllers/leads.controller.js';
import { validateBody } from '../middleware/validate.js';
import { 
  analyzeLeadSchema, 
  sendLeadEmailSchema, 
  updateEmailSchema, 
  promoteLeadSchema 
} from '../schemas/leads.schema.js';

const router = express.Router();

router.get('/fetch-leads', getLeads);
router.post('/analyze-lead', validateBody(analyzeLeadSchema), analyzeLead);
router.post('/send-email', validateBody(sendLeadEmailSchema), sendLeadEmail);
router.get('/track-open/:id', trackEmailOpen);
router.get('/quota', getQuotaStatus);
router.post('/update-email', validateBody(updateEmailSchema), updateEmail);
router.get('/queue-stats', getQueueStats);
router.get('/analysis-status/:id', getAnalysisStatus);
router.post('/queue-clear', clearCompletedQueues);
router.post('/leads/:id/market-intel', getMarketIntel);
router.post('/analyze-tester', analyzeTester);
router.post('/leads/promote', validateBody(promoteLeadSchema), promoteLead);

// 🛡️ RGPD / EU Compliance Routes
router.delete('/leads/:website/erase', eraseLead);
router.get('/unsubscribe', unsubscribeLead);
router.post('/unsubscribe', unsubscribeLead);
router.post('/leads/cleanup-retention', cleanupDataRetention);

export default router;
