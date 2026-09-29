import express from 'express';
import { runProspectorCampaign } from '../services/prospector-service.js';

const router = express.Router();

router.post('/campaigns', async (req, res) => {
  try {
    const { sector, city, provider, minRating, minReviews } = req.body;
    if (!sector || !city) {
      return res.status(400).json({ success: false, error: 'sector e city são obrigatórios' });
    }
    const result = await runProspectorCampaign({
      sector,
      city,
      provider,
      minRating,
      minReviews,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
