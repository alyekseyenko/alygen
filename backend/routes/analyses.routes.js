import express from 'express';
import { 
  listAnalyses, 
  getStats, 
  getAnalysisByWebsite 
} from '../controllers/analyses.controller.js';

const router = express.Router();

router.get('/analyses', listAnalyses);
router.get('/analyses/stats', getStats);
router.get('/analyses/:website', getAnalysisByWebsite);

export default router;
