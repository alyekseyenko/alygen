import express from 'express';
import { 
  getCRMConfig, 
  saveCRMConfig, 
  updateLeadCRM 
} from '../controllers/crm.controller.js';

const router = express.Router();

router.get('/alygen-config', getCRMConfig);
router.post('/alygen-config', saveCRMConfig);
router.post('/crm/update', updateLeadCRM);

export default router;
