/**
 * Canonical Q-Score (aligned with backend/services/analyzers/qscore-calculator.js).
 */
import weightsConfig from '../config/qscore-weights.json';

function detectSector(leadData = {}) {
  const typeStr = String(leadData.type || leadData.category || '').toLowerCase();
  if (/loja|shop|store|ecommerce|comércio|comercio/.test(typeStr)) return 'ecommerce';
  if (/restaurante|café|cafe|bar|pastelaria|pizzaria|food/.test(typeStr)) return 'restaurante';
  if (/clínica|clinica|médico|medico|dentista|saúde|saude|farmácia/.test(typeStr)) return 'saude';
  if (/consultoria|agência|agencia|tecnologia|software|\bit\b|b2b/.test(typeStr)) return 'b2b';
  if (/serviço|servico|reparação|instalação|manutenção|advogado|contabilidade/.test(typeStr)) return 'servicos';
  return 'default';
}

function toGrade(score) {
  for (const [threshold, grade] of weightsConfig.grades) {
    if (score >= threshold) return grade;
  }
  return 'F';
}

function toPriority(score) {
  for (const [threshold, priority] of weightsConfig.priority) {
    if (score >= threshold) return priority;
  }
  return 'CRITICAL';
}

function statusFromScore(score) {
  if (score > 80) return 'OTIMIZADO';
  if (score > 60) return 'ESTÁVEL';
  if (score > 40) return 'MELHORÁVEL';
  return 'CRÍTICO';
}

export function analysisToScoringPayload(analysis = {}) {
  const cta = analysis.cta && typeof analysis.cta === 'object' ? analysis.cta : {};
  return {
    performanceScore: analysis.performanceMobile ?? analysis.performanceScore ?? 0,
    seoScore: analysis.seo?.score ?? analysis.seoScore ?? 0,
    securityScore: analysis.security?.score ?? analysis.securityScore ?? 0,
    trackingCount: analysis.pixelDetails?.totalTracking ?? analysis.trackingCount ?? 0,
    hasCTA: Boolean(analysis.hasCTA ?? cta.hasCTA ?? (analysis.conversion?.score > 0)),
    hasSSL: analysis.security?.hasSSL ?? analysis.hasSSL,
    googleRanking: analysis.googleRanking,
  };
}

export function computeQScoreCore(data, leadData = {}) {
  const sector = detectSector(leadData);
  const w = weightsConfig[sector] || weightsConfig.default;

  const perf = data.performanceScore ?? 0;
  const seo = data.seoScore ?? 0;
  const security = data.securityScore ?? 0;
  const trackingNorm = Math.min(100, ((data.trackingCount || 0) / 4) * 100);
  const conversion = data.hasCTA ? 100 : 0;

  let raw =
    perf * w[0] + seo * w[1] + security * w[2] + trackingNorm * w[3] + conversion * w[4];

  let penalties = 0;
  let bonus = 0;
  if (data.hasSSL === false) penalties += 20;
  if (perf < 30) penalties += 10;
  if ((data.trackingCount || 0) === 0) penalties += 10;
  if (data.performanceScore == null) penalties += 5;

  const rankScore = data.googleRanking?.score ?? data.googleRanking?.rankingScale;
  if (rankScore != null) {
    if (rankScore < 25) penalties += 5;
    else if (rankScore >= 70) bonus += 3;
  }
  if (perf >= 95) bonus += 5;
  if (perf >= 80 && seo >= 80 && security >= 80) bonus += 10;

  const finalScore = Math.max(0, Math.min(100, Math.round(raw + bonus - penalties)));
  const grade = toGrade(finalScore);
  const priority = toPriority(finalScore);

  return {
    score: finalScore,
    grade,
    priority,
    status: statusFromScore(finalScore),
    sector,
    breakdown: {
      performance: perf,
      seo,
      security,
      tracking: trackingNorm,
      conversion,
    },
  };
}

export function calculateQScoreFromAnalysis(analysis, leadData = {}) {
  const payload = analysisToScoringPayload(analysis);
  return computeQScoreCore(payload, {
    type: leadData.type || analysis.sector || analysis.category || analysis.type,
    category: leadData.category || analysis.category,
    ...leadData,
  });
}
