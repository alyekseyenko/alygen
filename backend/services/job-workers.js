import { getMarketIntelMultiAgent } from './python-bridge.js';
import { performFullAnalysis } from './analysis-service.js';

/** pg-boss v12+ passes an array of jobs to work handlers. */
function asJobList(jobsOrJob) {
  if (Array.isArray(jobsOrJob)) return jobsOrJob;
  if (jobsOrJob) return [jobsOrJob];
  return [];
}

export async function registerJobWorkers(boss) {
  await boss.work('market-intel', async (jobsOrJob) => {
    const jobs = asJobList(jobsOrJob);
    const results = [];
    for (const job of jobs) {
      const { name, city, sector, website, auditContext, traceId } = job.data || {};
      results.push(
        await getMarketIntelMultiAgent(name, city, sector, website, auditContext, { traceId })
      );
    }
    return jobs.length === 1 ? results[0] : results;
  });

  await boss.work('audit', async (jobsOrJob) => {
    const jobs = asJobList(jobsOrJob);
    const results = [];
    for (const job of jobs) {
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
      if (!url) {
        throw new Error('url required');
      }
      results.push(
        await performFullAnalysis(url, leadData || {}, Boolean(forceReanalyze), {
          phase: phase ?? 3,
          includeIntel: Boolean(includeIntel),
          runId,
          traceId,
          rescoreOnly: Boolean(rescoreOnly),
        })
      );
    }
    return jobs.length === 1 ? results[0] : results;
  });

  console.log('📬 Workers registados: market-intel, audit');
}

export default { registerJobWorkers };
