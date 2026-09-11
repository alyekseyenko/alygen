import express from 'express';
import { 
  createReportPDF, 
  createProposalPDF 
} from '../controllers/proposals.controller.js';
import { generateAICopywriter } from '../controllers/leads.controller.js';

const router = express.Router();

router.post('/generate-pdf', createReportPDF);
router.post('/generate-proposal', createProposalPDF);
router.post('/leads/:id/ai-copy', generateAICopywriter);

export default router;
