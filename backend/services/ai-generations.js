import crypto from 'crypto';
import db from './local-db-service.js';

export async function logAiGeneration({
  agentName,
  promptVersion,
  leadWebsite,
  inputContext,
  outputText,
  model,
  latencyMs,
  approved = null,
  outcome = null,
  traceId = null,
  tokensIn = null,
  tokensOut = null,
  costEur = null,
  degraded = null,
}) {
  try {
    const id = crypto.randomUUID();
    await db.query(
      `INSERT INTO ai_generations (id, agent_name, prompt_version, lead_website, input_context, output_text, model, latency_ms, approved, outcome, trace_id, tokens_in, tokens_out, cost_eur, degraded)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        id,
        agentName,
        promptVersion || '1.0.0',
        leadWebsite || null,
        typeof inputContext === 'string' ? inputContext : JSON.stringify(inputContext || {}),
        outputText || '',
        model || null,
        latencyMs || null,
        approved === null ? null : approved ? 1 : 0,
        outcome || null,
        traceId,
        tokensIn,
        tokensOut,
        costEur,
        degraded === null ? null : degraded ? 1 : 0,
      ]
    );
    return { success: true, id };
  } catch (err) {
    console.warn('⚠️ ai_generations log failed:', err.message);
    return { success: false };
  }
}

export default { logAiGeneration };
