import crypto from 'crypto';
import { logAiGeneration } from './ai-generations.js';

/**
 * Persist per-node rows from Python market-intel graph.
 */
export async function logMarketIntelTelemetry({
  telemetry = [],
  traceId,
  leadWebsite,
  pipelineDegraded,
  model,
}) {
  const trace = traceId || crypto.randomUUID();
  const rows = Array.isArray(telemetry) ? telemetry : [];

  if (rows.length === 0) {
    await logAiGeneration({
      agentName: 'market_intel_pipeline',
      promptVersion: '1.0.0',
      leadWebsite,
      traceId: trace,
      model,
      degraded: pipelineDegraded,
      outputText: '',
      inputContext: { nodes: 0 },
    });
    return trace;
  }

  for (const row of rows) {
    await logAiGeneration({
      agentName: row.agent_name || 'market_intel_node',
      promptVersion: row.prompt_version || '1.0.0',
      leadWebsite,
      traceId: trace,
      model: row.model || model,
      latencyMs: row.latency_ms,
      tokensIn: row.tokens_in,
      tokensOut: row.tokens_out,
      costEur: row.cost_eur,
      degraded: row.degraded ?? pipelineDegraded,
      outputText: row.output_text || '',
      inputContext: { agent: row.agent_name },
    });
  }
  return trace;
}
