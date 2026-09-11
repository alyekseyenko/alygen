import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const PYTHON_URL = `http://localhost:${process.env.PYTHON_PORT || 3002}`;

/**
 * POST /api/leads/:id/market-intel
 * Chama o Agente LangChain Python e guarda o resultado no lead.
 */
router.post('/leads/:id/market-intel', async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Ir buscar o lead ao Supabase
        const { data: lead, error: leadErr } = await supabase
            .from('lead_analyses')
            .select('*')
            .eq('id', id)
            .single();

        if (leadErr || !lead) {
            return res.status(404).json({ success: false, error: 'Lead não encontrado' });
        }

        const name    = lead.name || lead.company_name || '';
        const city    = lead.city || lead.address || '';
        const sector  = lead.type || lead.category || 'geral';
        const website = lead.website || '';

        if (!name) {
            return res.status(400).json({ success: false, error: 'Lead sem nome definido' });
        }

        console.log(`🧠 [Market Intel] Acionando agente LangChain para: ${name}`);

        // 2. Chamar o microserviço Python (LangChain Agent) via Axios
        const pythonResult = await axios.post(`${PYTHON_URL}/agent/market-intel`, 
            { name, city, sector, website },
            { timeout: 60000 } // 60s timeout
        );

        const agentResult = pythonResult.data;

        if (!agentResult.success || !agentResult.intel) {
            return res.status(500).json({
                success: false,
                error: agentResult.error || 'Agente não gerou intel'
            });
        }

        // 3. Guardar o intel no lead (campo agent_intel)
        const { error: updateErr } = await supabase
            .from('lead_analyses')
            .update({
                agent_intel: agentResult.intel,
                agent_intel_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateErr) {
            console.warn('⚠️ Intel gerado mas não gravado no Supabase:', updateErr.message);
            // Não falha por causa disto — o intel foi gerado com sucesso
        }

        console.log(`✅ [Market Intel] Gerado para ${name}: "${agentResult.intel.substring(0, 60)}..."`);

        return res.json({
            success: true,
            intel: agentResult.intel,
            lead_id: id,
            model: agentResult.model,
            saved: !updateErr
        });

    } catch (err) {
        console.error('❌ [Market Intel] Erro:', err.message);
        return res.status(500).json({
            success: false,
            error: err.message.includes('fetch') || err.message.includes('ECONNREFUSED')
                ? 'Servidor Python offline. Inicie o microserviço Python para usar esta funcionalidade.'
                : err.message
        });
    }
});

export default router;
