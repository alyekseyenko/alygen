import quotaManager from '../quota-manager.js';

/**
 * Retorna as estatísticas da fila assíncrona de análises e quotas de scraping
 */
export const getQueueStats = async (req, res) => {
  try {
    const { default: analysisQueue } = await import('../analysis-queue.js');
    const stats = analysisQueue.getQueueStats();
    const quota = quotaManager.getQuota();
    res.json({
      success: true,
      queue: stats,
      quota: {
        used: quota.used,
        limit: 500,
        remaining: quota.remaining
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Consulta o estado atual de um job de análise na fila
 */
export const getAnalysisStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { default: analysisQueue } = await import('../analysis-queue.js');
    const status = analysisQueue.getStatus(parseFloat(id));
    
    if (!status) return res.status(404).json({ success: false, error: 'Job não encontrado' });
    
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Limpa os jobs concluídos da fila de processamento
 */
export const clearCompletedQueues = async (req, res) => {
  try {
    const { default: analysisQueue } = await import('../analysis-queue.js');
    analysisQueue.clearCompleted();
    res.json({ success: true, message: 'Fila limpa' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
