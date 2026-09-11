import express from 'express';
import { 
  listAnalyses, 
  getStats, 
  getAnalysisByWebsite 
} from '../controllers/analyses.controller.js';

const router = express.Router();

router.get('/supabase/analyses', listAnalyses);
router.get('/supabase/stats', getStats);
router.get('/supabase/analysis/:website', getAnalysisByWebsite);

export default router;
