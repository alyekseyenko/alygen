/**
 * Build audit_context payload for Python market-intel Strategist.
 */
export function buildAuditContextFromAnalysis(leadRow = {}, fullAnalysis = {}) {
  const a = fullAnalysis && typeof fullAnalysis === 'object' ? fullAnalysis : {};
  const pixels = a.pixelDetails || {};
  const boolKeys = ['facebook', 'ga4', 'gtm', 'linkedin', 'hotjar', 'tiktok', 'clarity'];
  const trackingCount =
    pixels.totalTracking ??
    boolKeys.filter((k) => Boolean(pixels[k])).length;

  const cta = a.ctaAnalysis;
  const hasCTA =
    typeof cta === 'object' && cta !== null && !Array.isArray(cta)
      ? Boolean(cta.hasCTA)
      : Boolean(a.hasCTA);

  return {
    qscore: leadRow.qscore ?? a.qScore?.score ?? a.overallScore ?? null,
    qscore_grade: leadRow.qscore_grade ?? a.qScore?.grade ?? null,
    performanceMobile: a.performanceMobile ?? leadRow.performance_mobile ?? null,
    hasSSL: a.security?.hasSSL ?? null,
    aeoScore: a.aeo?.score ?? null,
    trackingCount,
    hasCTA,
    seoScore: a.seo?.score ?? leadRow.seo_score ?? null,
    securityScore: a.security?.score ?? leadRow.security_score ?? null,
    accessibilityScore: a.accessibility?.score ?? leadRow.accessibility_score ?? null,
    googleRankingScore: a.googleRanking?.score ?? null,
    breakdown: a.qScore?.breakdown ?? null,
  };
}

export function parseFullAnalysis(leadRow) {
  if (!leadRow) return {};
  let full = leadRow.full_analysis;
  if (typeof full === 'string') {
    try {
      full = JSON.parse(full);
    } catch {
      full = {};
    }
  }
  return full || {};
}
