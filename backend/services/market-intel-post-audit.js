import db from './local-db-service.js';
import { getMarketIntelMultiAgent } from './python-bridge.js';
import { buildAuditContextFromAnalysis, parseFullAnalysis } from '../utils/audit-context.js';
import { buildCompetitorSnapshots } from './competitor-snapshot.js';
import { generateEmailTemplate } from './email-template.js';
import { appendRunStep } from './analysis-runs-service.js';

export async function runMarketIntelAfterAudit({
  url,
  leadData,
  analysis,
  savedRow,
  traceId,
  runId,
  allLeads = [],
}) {
  const name = leadData.name || leadData.lead_name || savedRow?.lead_name || url;
  const city = leadData.city || leadData.lead_city || savedRow?.lead_city || 'Portugal';
  const sector = leadData.sector || leadData.type || leadData.lead_type || savedRow?.lead_type || 'Negócios';

  const row = savedRow || { full_analysis: JSON.stringify(analysis) };
  const full = parseFullAnalysis(row);
  const auditContext = buildAuditContextFromAnalysis(row, full);

  let internalCompetitors = [];
  try {
    const dbRes = await db.query(
      `
      SELECT lead_name, lead_website, qscore, qscore_grade
      FROM lead_analyses
      WHERE lead_city ILIKE $1 AND lead_type ILIKE $2 AND lead_website <> $3 AND qscore >= 50
      ORDER BY qscore DESC LIMIT 3
      `,
      [city, sector, url || '']
    );
    internalCompetitors = (dbRes.rows || []).map((r) => ({
      name: r.lead_name,
      url: r.lead_website,
      qscore: r.qscore,
      grade: r.qscore_grade,
    }));
  } catch {
    /* optional */
  }

  const competitorSnapshots = await buildCompetitorSnapshots(internalCompetitors);
  auditContext.competitor_snapshots = competitorSnapshots;

  await appendRunStep(runId, 'market_intel', 'running');

  const intel = await getMarketIntelMultiAgent(name, city, sector, url, auditContext, {
    traceId,
    competitorSnapshots,
  });

  if (!intel?.success || !intel.intel) {
    await appendRunStep(runId, 'market_intel', 'failed', { error: intel?.error });
    return { success: false, intel };
  }

  full.agent_intel = intel.intel;
  full.agent_intel_meta = {
    degraded: intel.degraded,
    trace_id: intel.trace_id || traceId,
    competitors: intel.competitors,
  };

  await db.query(
    `UPDATE lead_analyses SET agent_intel = $1, agent_intel_at = NOW(), full_analysis = $2 WHERE lead_website = $3`,
    [intel.intel, JSON.stringify(full), url]
  );

  await appendRunStep(runId, 'market_intel', 'completed');

  const emailTemplate = await generateEmailTemplate(full, { ...leadData, website: url, agent_intel: intel.intel }, allLeads);
  await appendRunStep(runId, 'email_template', 'completed');

  return { success: true, intel, emailTemplate, analysis: full };
}
