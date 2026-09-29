import express from 'express';
import { getMarketIntelMultiAgent } from '../services/python-bridge.js';
import db from '../services/local-db-service.js';

const router = express.Router();

router.post('/leads/:id/market-intel', async (req, res) => {
    const { id } = req.params;

    try {
        const byId = await db.query('SELECT * FROM lead_analyses WHERE id = $1', [id]);
        let lead = byId.rows?.[0];
        if (!lead) {
            const byWeb = await db.query('SELECT * FROM lead_analyses WHERE lead_website = $1', [id]);
            lead = byWeb.rows?.[0];
        }

        if (!lead) {
            return res.status(404).json({ success: false, error: 'Lead não encontrado na base local' });
        }

        const name = lead.lead_name || 'Empresa';
        const city = lead.lead_city || 'Portugal';
        const sector = lead.lead_type || 'Negócios';
        const website = lead.lead_website || '';

        const agentResult = await getMarketIntelMultiAgent(name, city, sector, website);

        if (!agentResult.success || !agentResult.intel) {
            return res.status(500).json({ success: false, error: agentResult.error || 'Agente não gerou intel' });
        }

        await db.query(
            'UPDATE lead_analyses SET agent_intel = $1, agent_intel_at = $2 WHERE id = $3',
            [agentResult.intel, new Date().toISOString(), lead.id]
        );

        return res.json({
            success: true,
            intel: agentResult.intel,
            lead_id: lead.id,
            model: agentResult.model,
            saved: true,
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
