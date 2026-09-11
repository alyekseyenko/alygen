import axios from 'axios';

// Helper to retry operations with exponential backoff
async function withRetry(fn, { retries = 3, baseDelay = 1000, label = 'operation' } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNABORTED' ||
        (err.response?.status >= 500) || err.message?.includes('timeout');
      if (!isRetryable || attempt === retries) break;
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
      console.log(`⚠️ ${label} failed (attempt ${attempt}/${retries}), retrying in ${Math.round(delay)}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

/**
 * Calculates the hypothetical financial impact based on performance scores.
 */
export function calculateFinancialImpact(score, loadTime) {
  const idealLoadTime = 2.0;
  const delay = Math.max(0, loadTime - idealLoadTime);
  const bounceRateIncrease = Math.round(delay * 10);
  const conversionLoss = Math.round(delay * 7);
  const monthlyVisitors = 1000;
  const conversionRate = 0.02;
  const avgOrderValue = 50;

  const potentialConversions = monthlyVisitors * conversionRate;
  const lostConversions = potentialConversions * (conversionLoss / 100);
  const revenueLost = Math.round(lostConversions * avgOrderValue);

  return {
    bounceRate: bounceRateIncrease,
    conversionsLost: Math.round(conversionLoss),
    revenueLost,
    monthlyImpact: `€${revenueLost}/mês`,
    yearlyImpact: `€${revenueLost * 12}/ano`,
    recommendation: score < 50 ? 'URGENTE: Otimização crítica necessária' :
      score < 70 ? 'IMPORTANTE: Melhorias significativas possíveis' :
        'BOM: Manter e monitorar'
  };
}

/**
 * Main PageSpeed Insights API caller
 */
export async function getPageSpeedScore(url) {
  try {
    // Tenta obter a chave de qualquer uma das variáveis comuns no projeto
    const apiKey = process.env.PAGESPEED_API_KEY || process.env.SCRAPER_API_KEY;
    const categories = 'category=performance&category=accessibility&category=best-practices&category=seo';
    const mobileUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}${apiKey ? `&key=${apiKey}` : ''}&strategy=mobile&${categories}`;
    const desktopUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}${apiKey ? `&key=${apiKey}` : ''}&strategy=desktop&${categories}`;

    console.log(`🚀 Chamando PageSpeed API (Mobile + Desktop) para: ${url} (Key: ${apiKey ? 'Presente' : 'Ausente'})`);

    const [mobileRes, desktopRes] = await Promise.all([
      withRetry(() => axios.get(mobileUrl, { timeout: 180000 }), { retries: 3, baseDelay: 2000, label: `PageSpeed-Mobile(${url})` }),
      withRetry(() => axios.get(desktopUrl, { timeout: 180000 }), { retries: 3, baseDelay: 2000, label: `PageSpeed-Desktop(${url})` }).catch(err => {
        console.warn('⚠️ Desktop PageSpeed falhou, usando fallback 0:', err.message);
        return null;
      })
    ]);

    const lighthouse = mobileRes.data.lighthouseResult;
    const desktopScore = desktopRes ? Math.round(desktopRes.data.lighthouseResult.categories.performance.score * 100) : 0;
    const metrics = lighthouse.audits;
    const cruxData = mobileRes.data.loadingExperience?.metrics || {};

    // Core Web Vitals (CrUX)
    const lcp = cruxData.LARGEST_CONTENTFUL_PAINT_MS ? {
      value: cruxData.LARGEST_CONTENTFUL_PAINT_MS.percentile,
      displayValue: `${(cruxData.LARGEST_CONTENTFUL_PAINT_MS.percentile / 1000).toFixed(1)} s`,
      score: cruxData.LARGEST_CONTENTFUL_PAINT_MS.category === 'FAST' ? 'good' : cruxData.LARGEST_CONTENTFUL_PAINT_MS.category === 'AVERAGE' ? 'needs-improvement' : 'poor'
    } : null;

    const fid = cruxData.FIRST_INPUT_DELAY_MS ? {
      value: cruxData.FIRST_INPUT_DELAY_MS.percentile,
      displayValue: `${cruxData.FIRST_INPUT_DELAY_MS.percentile} ms`,
      score: cruxData.FIRST_INPUT_DELAY_MS.category === 'FAST' ? 'good' : cruxData.FIRST_INPUT_DELAY_MS.category === 'AVERAGE' ? 'needs-improvement' : 'poor'
    } : null;

    const cls = cruxData.CUMULATIVE_LAYOUT_SHIFT_SCORE ? {
      value: cruxData.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100,
      displayValue: (cruxData.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100).toFixed(2),
      score: cruxData.CUMULATIVE_LAYOUT_SHIFT_SCORE.category === 'FAST' ? 'good' : cruxData.CUMULATIVE_LAYOUT_SHIFT_SCORE.category === 'AVERAGE' ? 'needs-improvement' : 'poor'
    } : null;

    // Resource Summary
    const resourceSummary = metrics['resource-summary']?.details?.items || [];
    const resources = { total: { requests: 0, size: 0 }, javascript: { requests: 0, size: 0 }, css: { requests: 0, size: 0 }, images: { requests: 0, size: 0 }, fonts: { requests: 0, size: 0 }, other: { requests: 0, size: 0 } };

    resourceSummary.forEach(item => {
      const type = item.resourceType?.toLowerCase() || 'other';
      const size = Math.round((item.transferSize || 0) / 1024);
      const requests = item.requestCount || 0;
      if (type === 'script') { resources.javascript.requests += requests; resources.javascript.size += size; }
      else if (type === 'stylesheet') { resources.css.requests += requests; resources.css.size += size; }
      else if (type === 'image') { resources.images.requests += requests; resources.images.size += size; }
      else if (type === 'font') { resources.fonts.requests += requests; resources.fonts.size += size; }
      else { resources.other.requests += requests; resources.other.size += size; }
      resources.total.requests += requests; resources.total.size += size;
    });

    // Opportunities
    const opportunities = [];
    const checkOpp = (id, label, impact) => {
      if (metrics[id]?.details?.overallSavingsBytes) {
        opportunities.push({ type: label, savings: Math.round(metrics[id].details.overallSavingsBytes / 1024), impact });
      }
    };
    checkOpp('unused-css-rules', 'CSS não utilizado', 'ALTO');
    checkOpp('unused-javascript', 'JavaScript não utilizado', 'ALTO');
    checkOpp('uses-optimized-images', 'Imagens não otimizadas', 'CRÍTICO');
    checkOpp('uses-webp-images', 'Usar WebP/AVIF', 'MÉDIO');

    const performanceScore = Math.round(lighthouse.categories.performance.score * 100);
    const loadTime = parseFloat(metrics['speed-index']?.displayValue) || 0;

    const lighthouseAuditsShort = {
      speedIndex: metrics['speed-index']?.score || 0,
      timeToInteractive: metrics['interactive']?.score || 0,
      firstContentfulPaint: metrics['first-contentful-paint']?.score || 0,
      largestContentfulPaint: metrics['largest-contentful-paint']?.score || 0,
      totalBlockingTime: metrics['total-blocking-time']?.score || 0,
      cumulativeLayoutShift: metrics['cumulative-layout-shift']?.score || 0,
      serverResponseTime: metrics['server-response-time']?.score || 0,
      unusedCssSavings: Math.round((metrics['unused-css-rules']?.details?.overallSavingsBytes || 0) / 1024),
      unusedJsSavings: Math.round((metrics['unused-javascript']?.details?.overallSavingsBytes || 0) / 1024),
      imageOptimizationSavings: Math.round((metrics['uses-optimized-images']?.details?.overallSavingsBytes || 0) / 1024),
    };

    const totalSavingsKB = opportunities.reduce((acc, o) => acc + o.savings, 0);
    const opportunityScore = Math.min(100, Math.round((totalSavingsKB / 1000) * 10));

    return {
      score: performanceScore, // Top-level para o analyzer.js
      desktop: desktopScore,
      mobile: performanceScore,
      accessibilityFromPageSpeed: lighthouse.categories.accessibility ? Math.round(lighthouse.categories.accessibility.score * 100) : null,
      seoFromPageSpeed: lighthouse.categories.seo ? Math.round(lighthouse.categories.seo.score * 100) : null,
      bestPracticesFromPageSpeed: lighthouse.categories['best-practices'] ? Math.round(lighthouse.categories['best-practices'].score * 100) : null,
      pwaFromPageSpeed: lighthouse.categories.pwa ? Math.round(lighthouse.categories.pwa.score * 100) : null,
      loadTime,
      financialImpact: calculateFinancialImpact(performanceScore, loadTime),
      resources,
      opportunities,
      totalSavingsKB,
      opportunityScore,
      lighthouseAudits: lighthouseAuditsShort,
      coreWebVitals: { lcp, fid, cls, hasCruxData: !!(lcp || fid || cls) }
    };
  } catch (error) {
    console.error('⚠️ PageSpeed Error:', error.message);
    return { mobile: 0, desktop: 0, financialImpact: { revenueLost: 0 }, resources: { total: { requests: 0, size: 0 } }, opportunities: [], coreWebVitals: { hasCruxData: false } };
  }
}
