import analysisQueue from '../analysis-queue.js';
import { performFullAnalysis } from './analysis-service.js';

let isRunning = false;

/**
 * Autopilot Worker — Processes pending analysis queue items every 10s
 */
export async function startWorker() {
    if (isRunning) return;
    isRunning = true;
    console.log('🤖 Autopilot Worker iniciado.');
    
    async function work() {
        try {
            analysisQueue.lastHeartbeat = new Date();
            const stats = analysisQueue.getQueueStats();
            
            if (stats.pending > 0 && analysisQueue.canProcess()) {
                const pendingItem = analysisQueue.queue.find(q => q.status === 'pending');

                if (pendingItem) {
                    // The queue stores items as: { id, leadData: { website, name, ... }, status }
                    const leadData = pendingItem.leadData || {};
                    const website = leadData.website;

                    if (!website) {
                        console.error(`❌ [Autopilot] Item sem website na fila (id: ${pendingItem.id}). A ignorar.`);
                        pendingItem.status = 'failed';
                        pendingItem.error = 'Missing website in leadData';
                        analysisQueue.saveQueue();
                    } else {
                        console.log(`🚀 [Autopilot] Iniciando análise de: ${website} (${leadData.name || '?'})`);
                        pendingItem.status = 'processing';
                        analysisQueue.saveQueue();

                        try {
                            const force = pendingItem.forceReanalyze === true;
                            const options = pendingItem.options || {};
                            await performFullAnalysis(website, leadData, force, options, (progressText) => {
                                pendingItem.progressLog = progressText;
                                analysisQueue.saveQueue();
                            });
                            console.log(`✅ [Autopilot] Análise concluída${force ? ' (FORÇADA)' : ''}: ${website}`);
                            pendingItem.status = 'completed';
                            pendingItem.progressLog = 'Análise concluída com sucesso!';
                            analysisQueue.lastProcessedAt = new Date();
                        } catch (error) {
                            console.error(`❌ [Autopilot] Falha na análise de ${website}:`, error.message);
                            pendingItem.status = 'failed';
                            pendingItem.error = error.message;
                        }

                        analysisQueue.saveQueue();
                    }
                }
            }
        } catch (error) {
            console.error('❌ [Autopilot Worker Error]:', error.message);
        }

        setTimeout(work, 10000);
    }

    work();
}
