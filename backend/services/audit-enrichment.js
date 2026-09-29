import axios from 'axios';
import { getPythonFastApiUrl } from '../config/python-url.js';
import { pythonAuthHeaders, getPythonStatus } from './python-bridge.js';
import { logAiGeneration } from './ai-generations.js';

const CONFIDENCE_THRESHOLD = parseInt(process.env.AUDIT_ENRICH_CONFIDENCE_THRESHOLD || '60', 10);

/**
 * Gatilhos spec 009 — evita LLM em auditorias já completas.
 */
export function shouldRunAuditEnrichment({
  targetPhase,
  dataQuality,
  qScore,
  emailList = [],
  phoneList = [],
}) {
  if (targetPhase < 3) return false;
  const confidence = qScore?.confidence ?? 100;
  if (confidence < CONFIDENCE_THRESHOLD) return true;
  if (dataQuality?.html === 'missing' || dataQuality?.renderedHtml === 'missing') return true;
  const hasContact = emailList.length > 0 || phoneList.length > 0;
  if (!hasContact) return true;
  return false;
}

function mapSuggestedPriority(pt) {
  const p = String(pt || '').toUpperCase();
  const map = {
    CRITICAL: 'CRÍTICA',
    HIGH: 'ALTA',
    MEDIUM: 'MÉDIA',
    LOW: 'BAIXA',
  };
  return map[p] || null;
}

const PRIORITY_RANK = { CRÍTICA: 4, ALTA: 3, MÉDIA: 2, BAIXA: 1 };

export function mergeEnrichmentIntoAnalysis(analysis, enrichResponse) {
  if (!enrichResponse?.success || !enrichResponse.enrichment) {
    return analysis;
  }
  const enrichment = enrichResponse.enrichment;
  analysis.auditEnrichment = enrichment;

  if (enrichResponse.recovery?.success) {
    const emails = enrichResponse.recovery.emails || [];
    const phones = enrichResponse.recovery.phones || [];
    if (emails.length && (!analysis.extractedEmails || analysis.extractedEmails.length === 0)) {
      analysis.extractedEmails = emails.slice(0, 3);
    }
    if (phones.length && (!analysis.extractedPhones || analysis.extractedPhones.length === 0)) {
      analysis.extractedPhones = phones.slice(0, 3);
    }
    analysis.scrapeRecovery = enrichResponse.recovery;
  }

  const suggested = mapSuggestedPriority(enrichment.suggested_priority);
  if (suggested) {
    const current = (analysis.priority || 'MÉDIA').toUpperCase();
    const curRank = PRIORITY_RANK[current] || 2;
    const sugRank = PRIORITY_RANK[suggested] || 2;
    if (sugRank > curRank) {
      analysis.priority = suggested;
      analysis.prioritySource = 'audit_enrich';
    }
  }

  if (enrichment.qualification_summary) {
    analysis.aiInsights = {
      ...(analysis.aiInsights || {}),
      summary: enrichment.qualification_summary,
      emailHook: enrichment.email_hook,
      topDefects: enrichment.top_defects,
      priority: enrichment.suggested_priority,
    };
  }

  return analysis;
}

export async function invokeAuditEnrich({
  website,
  leadData,
  htmlSnippet,
  metrics,
  dataQuality,
  qScore,
  recoverScrape,
  traceId,
}) {
  const py = await getPythonStatus();
  if (!py.fast?.engine2026 && !py.online) {
    return { success: false, error: 'FastAPI offline' };
  }

  const PYTHON_URL = getPythonFastApiUrl();
  const headers = pythonAuthHeaders();
  if (traceId) headers['X-Trace-Id'] = traceId;

  const started = Date.now();
  try {
    const { data } = await axios.post(
      `${PYTHON_URL}/agent/audit-enrich`,
      {
        website,
        name: leadData?.name || leadData?.lead_name || '',
        city: leadData?.city || leadData?.lead_city || 'Portugal',
        sector: leadData?.sector || leadData?.type || leadData?.lead_type || '',
        html_snippet: htmlSnippet || '',
        metrics,
        data_quality: dataQuality,
        qscore: qScore?.score ?? null,
        confidence: qScore?.confidence ?? null,
        recover_scrape: Boolean(recoverScrape),
        trace_id: traceId,
      },
      { timeout: 55_000, headers }
    );

    if (data?.success) {
      await logAiGeneration({
        agentName: 'audit_enrich',
        promptVersion: '1.0.0',
        leadWebsite: website,
        traceId: traceId || data.trace_id,
        model: data.usage?.model || 'llm_gateway',
        latencyMs: data.usage?.latency_ms ?? Date.now() - started,
        tokensIn: data.usage?.tokens_in,
        tokensOut: data.usage?.tokens_out,
        costEur: data.usage?.cost_eur,
        degraded: Boolean(data.degraded),
        outputText: JSON.stringify(data.enrichment || {}).slice(0, 4000),
      });
    }

    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}
