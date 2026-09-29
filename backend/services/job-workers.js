import { getMarketIntelMultiAgent } from './python-bridge.js';
import { performFullAnalysis } from './analysis-service.js';

export async function registerJobWorkers(boss) {
  await boss.work('market-intel', async (job) => {
    const { name, city, sector, website, auditContext, traceId } = job.data || {};
    return getMarketIntelMultiAgent(name, city, sector, website, auditContext, { traceId });
  });

  await boss.work('audit', async (job) => {
    const {
      url,
      leadData,
      forceReanalyze,
      phase,
      includeIntel,
      runId,
      traceId,
      rescoreOnly,
    } = job.data || {};
    if (!url) return { success: false, error: 'url required' };
    return performFullAnalysis(url, leadData || {}, Boolean(forceReanalyze), {
      phase: phase ?? 3,
      includeIntel: Boolean(includeIntel),
      runId,
      traceId,
      rescoreOnly: Boolean(rescoreOnly),
    });
  });

  console.log('📬 Workers registados: market-intel, audit');
}

export default { registerJobWorkers };
