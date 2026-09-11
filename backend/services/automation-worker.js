import cron from 'node-cron';
import db from './local-db-service.js';
import { resumeWorkflow } from './automation-engine.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Worker para Processar Estados de Automação Pendentes
 * Corre a cada 1 minuto (ou menos) para verificar se algum "Wait" chegou ao fim.
 */
let lastHeartbeat = null;

export function startAutomationWorker() {
    // Verificar a cada 1 minuto
    cron.schedule('* * * * *', async () => {
        lastHeartbeat = new Date();
        const now = new Date().toISOString();
        
        console.log(`⏱️ Automation Worker: Verificando resumens pendentes em ${new Date().toLocaleTimeString()}...`);

        try {
            const states = db.prepare(`
                SELECT id FROM automation_states WHERE status = 'pending' AND resume_at <= ?
            `).all(now);

            if (states && states.length > 0) {
                console.log(`🔔 Encontrados ${states.length} workflows prontos para retomar!`);
                
                for (const state of states) {
                    try {
                        await resumeWorkflow(state.id);
                    } catch (e) {
                        console.error(`❌ Erro ao retomar state ${state.id}:`, e.message);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erro no Automation Worker ao buscar estados:', error.message);
        }
    });

    console.log('✅ Automation Worker (Checkpoints) Iniciado');
}

export function getAutomationWorkerStatus() {
    return {
        lastHeartbeat,
        active: !!lastHeartbeat && (Date.now() - lastHeartbeat.getTime() < 125000) // 2 mins threshold for cron
    };
}
