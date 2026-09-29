import * as cheerio from 'cheerio';
import groqKeyManager from './groq-key-manager.js';
import { resilientFetch } from '../utils/resilient-fetcher.js';
import logger from '../utils/logger.js';

// --- Specialized Analyzers (Modular Architecture) ---
import { analyzeSEO } from './seo-analyzer.js';
import { analyzeSecurity } from './security-analyzer.js';
import { analyzeAccessibility } from './accessibility-analyzer.js';
import { analyzeWithAI } from './ai-analyzer.js';
import { analyzeTechnologies } from './technology-analyzer.js';
import { analyzeConversion } from './conversion-analyzer.js';
import { analyzeContent } from './content-analyzer.js';
import { analyzeSocialMedia } from './social-media-analyzer.js';
import { analyzeGoogleRanking } from './google-ranking-real.js';
import { analyzeAEO } from './aeo-analyzer.js';
import { analyzeGDPR } from './gdpr-analyzer.js';
import { validateEmails } from './email-validator.js';

// Modular New Structures
import { getPageSpeedScore } from './analyzers/performance.js';
import { detectPixels } from './analyzers/pixels.js';
import { analyzeCTA } from './analyzers/cta-analyzer.js';
import { extractEmail, extractPhone } from './analyzers/scraping.js';
import { 
  detectSocialMediaUrl, 
  extractPhoneFromSocialMedia, 
  extractEmailFromSocialMedia, 
  generateWebsiteProposal 
} from './analyzers/social-media.js';
import { calculateQScore } from './analyzers/qscore-calculator.js';
import { scoreWithPython, analyzeStrategic } from './python-bridge.js';
import { assertPublicHttpUrl } from '../utils/ssrf.js';
import { fetchRenderedPage } from './browser-pool.js';

function mapQScorePriorityToPt(priority) {
  const map = { CRITICAL: 'CRÍTICA', HIGH: 'ALTA', MEDIUM: 'MÉDIA', LOW: 'BAIXA' };
  if (map[priority]) return map[priority];
  if (['CRÍTICA', 'ALTA', 'MÉDIA', 'BAIXA'].includes(priority)) return priority;
  return 'MÉDIA';
}

/**
 * THE LEAD ANALYSER ENGINE (Senior Refactored Orchestrator)
 * Agora com Resilient Fetcher para evitar ZEROS em sites protegidos (ex: Tivoli)
 */
export async function analyzeLead(url, leadData = {}, allLeads = [], options = {}, onProgress) {
  const targetPhase = options.phase || 3;
  logger.info(`🔍 Iniciando Análise Modular Senior (Fase ${targetPhase}): ${url}`);
  if (onProgress) onProgress('[1/7] Normalizing URL and verifying firewall rules...');

  const originalUrlInput = url;
  let finalUrl = url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    finalUrl = `https://${url}`;
    logger.info(`✨ Protocolo adicionado automaticamente: ${finalUrl}`);
  }

  const ssrf = await assertPublicHttpUrl(finalUrl);
  if (!ssrf.ok) {
    throw new Error(ssrf.error || 'URL não permitida');
  }

  const dataQuality = {
    html: 'missing',
    renderedHtml: 'missing',
    pageSpeed: 'missing',
    seo: 'missing',
    security: 'missing',
    accessibility: 'missing',
    pixels: 'missing',
  };

  // ─── Phase 0: Presence Detection ───────────────────────────────────────────
  const socialDetection = detectSocialMediaUrl(finalUrl);
  if (socialDetection.isSocialMedia) {
    if (onProgress) onProgress('[2/7] Loading social media presence...');
    return await handleSocialOnlyLead(finalUrl, leadData, socialDetection);
  }
  
  // ─── Phase 1: Shared Data Fetch (Optimization & Resilience) ────────────────
  let html = '';
  let contentSnippet = '';
  let fetchResult = { status: 0, headers: {} };
  let $ = null;
  
  try {
    if (onProgress) onProgress('[2/7] Connecting to server and downloading HTML source...');
    fetchResult = await resilientFetch(finalUrl, { timeout: 20000 });
    html = fetchResult.html || '';
    
    if (html) {
      $ = cheerio.load(html);
      contentSnippet = $('body').text().substring(0, 3000).replace(/\s+/g, ' ');
      dataQuality.html = 'measured';
    } else {
      logger.warn(`⚠️ HTML vazio retornado para ${finalUrl}. Usaremos PageSpeed como fonte primária.`);
    }
  } catch (err) {
    logger.error(`🚨 Falha total no fetch de HTML para ${finalUrl}: ${err.message}`);
  }

  let renderedHtml = html;
  if (targetPhase >= 1) {
    try {
      const rendered = await fetchRenderedPage(finalUrl);
      if (rendered.ok && rendered.html) {
        renderedHtml = rendered.html;
        dataQuality.renderedHtml = 'measured';
        if (!$) $ = cheerio.load(renderedHtml);
      }
    } catch (renderErr) {
      logger.warn(`⚠️ Render partilhado falhou: ${renderErr.message}`);
    }
  }

  // ─── Phase 2 & 3: Run Scanners based on targetPhase ───────────────────────
  logger.info(`⚡ Executando scanners para Fase ${targetPhase} em ${finalUrl}...`);
 
  let performance = { mobile: null, desktop: null, pageSpeedFailed: true };
  let pixels = { totalTracking: 0, dataQuality: 'missing' };
  let cta = [];
  let emails = [];
  let phones = [];
  let seo = { score: null };
  let security = { score: null };
  let accessibility = { score: null };
  let technologies = { industries: [], webserver: 'N/A' };
  let conversion = { score: 50 };
  let content = { score: 50 };
  let social = { links: [] };
  let ranking = 'N/A';
  let strategicInsights = { success: false, tone: 'neutral' };
  let aeo = { score: 50 };
 
  if (targetPhase === 1) {
    // 💨 Fase 1: Apenas scanners locais rápidos (< 1.5s)
    if (onProgress) onProgress('[3/7] Scanning tracking pixels, CTAs, contacts, and basic SEO...');
    const [
      pixelsRes, 
      ctaRes, 
      emailsRes, 
      phonesRes, 
      seoRes,
      securityRes, 
      accessibilityRes, 
      technologiesRes, 
      conversionRes, 
      socialRes, 
      aeoRes
    ] = await Promise.all([
      detectPixels(finalUrl, renderedHtml).catch(() => ({ totalTracking: 0, dataQuality: 'missing' })),
      analyzeCTA(finalUrl, renderedHtml).catch(() => []),
      extractEmail(finalUrl).catch(() => []),
      extractPhone(finalUrl).catch(() => []),
      analyzeSEO(finalUrl, renderedHtml || html).catch(e => ({ score: null, error: e.message })),
      analyzeSecurity(finalUrl, renderedHtml || html, fetchResult.headers).catch(e => ({ score: null, error: e.message })),
      analyzeAccessibility(finalUrl, renderedHtml || html).catch(e => ({ score: null, error: e.message })), 
      analyzeTechnologies(finalUrl, html).catch(e => ({ industries: [], webserver: 'N/A' })),  
      analyzeConversion(finalUrl, html).catch(e => ({ score: 20, error: e.message })),    
      analyzeSocialMedia(finalUrl, html).catch(e => ({ links: [] })),   
      analyzeAEO(finalUrl, html, leadData).catch(e => ({ score: 20 }))
    ]);

    pixels = pixelsRes;
    cta = ctaRes;
    emails = emailsRes;
    phones = phonesRes;
    seo = seoRes;
    security = securityRes;
    accessibility = accessibilityRes;
    technologies = technologiesRes;
    conversion = conversionRes;
    social = socialRes;
    aeo = aeoRes;
  } else {
    // 🔥 Fase 2 ou 3: Correr todos os scanners pesados e APIs externas
    if (onProgress) onProgress('[3/7] Running Google PageSpeed audit (Core Web Vitals)...');
    const [
      performanceRes, 
      pixelsRes, 
      ctaRes, 
      emailsRes, 
      phonesRes, 
      seoRes, 
      securityRes, 
      accessibilityRes, 
      technologiesRes, 
      conversionRes, 
      contentRes, 
      socialRes, 
      rankingRes,
      strategicInsightsRes,
      aeoRes
    ] = await Promise.all([
      getPageSpeedScore(finalUrl).catch(() => ({ mobile: null, desktop: null, pageSpeedFailed: true })),
      detectPixels(finalUrl, renderedHtml).catch(() => ({ totalTracking: 0, dataQuality: 'missing' })),
      analyzeCTA(finalUrl, renderedHtml).catch(() => []),
      extractEmail(finalUrl).catch(() => []),
      extractPhone(finalUrl).catch(() => []),
      analyzeSEO(finalUrl, renderedHtml || html, groqKeyManager.getCurrentKey()).catch(e => ({ score: null, error: e.message })),
      analyzeSecurity(finalUrl, renderedHtml || html, fetchResult.headers).catch(e => ({ score: null, error: e.message })),
      analyzeAccessibility(finalUrl, renderedHtml || html).catch(e => ({ score: null, error: e.message })),
      analyzeTechnologies(finalUrl, renderedHtml || html).catch(e => ({ industries: [], webserver: 'N/A' })),
      analyzeConversion(finalUrl, renderedHtml || html).catch(e => ({ score: null, error: e.message })),
      analyzeContent(finalUrl, renderedHtml || html, groqKeyManager.getCurrentKey()).catch(e => ({ score: null })),
      analyzeSocialMedia(finalUrl, renderedHtml || html).catch(e => ({ links: [] })),   
      analyzeGoogleRanking(finalUrl, leadData).catch(e => ({ ranking: 'N/A' })),
      analyzeStrategic(contentSnippet, finalUrl).catch(e => ({ success: false, tone: 'neutral' })),
      analyzeAEO(finalUrl, html, leadData).catch(e => ({ score: 50 }))
    ]);

    performance = performanceRes;
    pixels = pixelsRes;
    cta = ctaRes;
    emails = emailsRes;
    phones = phonesRes;
    seo = seoRes;
    security = securityRes;
    accessibility = accessibilityRes;
    technologies = technologiesRes;
    conversion = conversionRes;
    content = contentRes;
    social = socialRes;
    ranking = rankingRes;
    strategicInsights = strategicInsightsRes;
    aeo = aeoRes;
  }

  // 👁️ [Google Cloud Vision AI] Análise Visual Avançada do Site (Limite: 1000/mês no escalão gratuito)
  let visionAnalysis = { success: false, error: 'Não executado na Fase 1' };
  if (targetPhase >= 2) {
    if (onProgress) onProgress('[4/7] Capturing screenshot for visual AI analysis...');
    try {
      const { captureWebsiteScreenshot } = await import('./screenshot-service.js');
      const { analyzeImageWithVision } = await import('./cloud-vision-service.js');
      
      const screenshotResult = await captureWebsiteScreenshot(finalUrl, { device: 'desktop' });
      if (screenshotResult.success && screenshotResult.base64) {
        if (onProgress) onProgress('[5/7] Submitting website image to Google Vision AI...');
        const visionResult = await analyzeImageWithVision(screenshotResult.base64);
        if (visionResult.success) {
          visionAnalysis = visionResult;
          logger.info(`👁️ Google Cloud Vision completado para ${finalUrl}`);
        } else {
          visionAnalysis = { success: false, error: visionResult.error };
        }
      } else {
        visionAnalysis = { success: false, error: screenshotResult.error || 'Falha ao capturar ecrã' };
      }
    } catch (visionErr) {
      logger.error(`❌ Erro no fluxo Google Cloud Vision: ${visionErr.message}`);
      visionAnalysis = { success: false, error: visionErr.message };
    }
  }

  if (onProgress) onProgress('[6/7] Verificação GDPR e conformidade...');
  const gdpr = analyzeGDPR(renderedHtml || html, $);
  
  if (onProgress) onProgress('[7/7] Consolidating audited data and calculating overall Q-Score...');
  
  // ─── Phase 3: Enrichment & Intelligent Score Merging ──────────────────────
  // Priorizar PageSpeed mas manter o detalhamento local se disponível
  dataQuality.pageSpeed = performance.pageSpeedFailed ? 'missing' : 'measured';
  if (seo.score != null) dataQuality.seo = 'measured';
  if (security.score != null) dataQuality.security = 'measured';
  if (accessibility.score != null) dataQuality.accessibility = 'measured';
  if (pixels.dataQuality === 'measured' || pixels.totalTracking > 0) dataQuality.pixels = 'measured';

  const finalSEOScore = performance.seoFromPageSpeed ?? seo.score ?? null;
  const refinedSEO = { 
    ...seo, 
    score: finalSEOScore, 
    source: performance.seoFromPageSpeed ? 'PageSpeed Insights' : 'Local Scrapper' 
  };

  const finalA11yScore = performance.accessibilityFromPageSpeed ?? accessibility.score ?? null;
  const refinedA11y = { 
    ...accessibility, 
    score: finalA11yScore, 
    source: performance.accessibilityFromPageSpeed ? 'PageSpeed Insights' : 'Local Scrapper' 
  };

  const finalSecurityScore =
    security?.score != null && security.score > 0
      ? security.score
      : (performance.bestPracticesFromPageSpeed ?? security?.score ?? null);
  const refinedSecurity = { 
    ...security, 
    score: finalSecurityScore,
    hasSSL: security?.hasSSL ?? (String(originalUrlInput).startsWith('https://')),
  };

  // Executar AI apenas se Fase 3 for requerida para economizar tempo/custo
  let aiInsights = { summary: 'Análise rápida concluída com sucesso.', priority: 'MÉDIA' };
  if (targetPhase === 3) {
    aiInsights = await analyzeWithAI({
      lead: leadData,
      performance,
      seo: refinedSEO,
      security: refinedSecurity,
      accessibility: refinedA11y,
      tracking: pixels,
      technologies,
      conversion,
      socialMedia: social,
      content: contentSnippet,
      aeo
    }).catch(e => ({ summary: 'Análise AI temporariamente indisponível.', priority: 'MÉDIA' }));
  }

  const emailList = (emails && emails.length > 0) ? emails : (leadData.email ? [leadData.email] : []);
  let emailValidation = [];
  if (targetPhase === 3 && emailList.length > 0) {
    emailValidation = await validateEmails(emailList).catch(e => []);
  }
  const phoneList = (phones && phones.length > 0) ? phones : (leadData.phone ? [leadData.phone] : []);

  // 🐍 Python-Accelerated Q-Score (com fallback automático para JS)
  const ctaObj = cta && typeof cta === 'object' && !Array.isArray(cta) ? cta : { hasCTA: false };
  const analysisForScoring = {
    performanceMobile: performance.mobile ?? null,
    seo: refinedSEO,
    security: refinedSecurity,
    accessibility: refinedA11y,
    pixelDetails: pixels,
    hasCTA: Boolean(ctaObj.hasCTA),
    googleRanking: typeof ranking === 'object' ? ranking : { score: 0 },
    aeo: aeo
  };
  
  const qScoreData = await scoreWithPython(
    analysisForScoring,
    leadData,
    // JS fallback — chamado se Python estiver offline
    (analysis, lead) => calculateQScore({
      performanceScore: analysis.performanceMobile ?? 0,
      seoScore: analysis.seo?.score || 50,
      securityScore: analysis.security?.score || 50,
      trackingCount: analysis.pixelDetails?.totalTracking || 0,
      hasCTA: analysis.hasCTA,
      hasSSL: analysis.security?.hasSSL,
      googleRanking: analysis.googleRanking,
    }, lead),
    allLeads
  ) || calculateQScore({
    performanceScore: performance.mobile ?? 0,
    seoScore: refinedSEO.score,
    securityScore: refinedSecurity.score,
    trackingCount: pixels.totalTracking || 0,
    hasCTA: Boolean(ctaObj.hasCTA),
    hasSSL: refinedSecurity.hasSSL,
    googleRanking: ranking,
  }, leadData);

  logger.info(`✨ Scores Finais [${url}]: Perf:${performance.mobile} | SEO:${refinedSEO.score} | Sec:${refinedSecurity.score} | Acc:${refinedA11y.score} | QScore:${qScoreData.score}`);

  let enrichRes = null;
  if (targetPhase >= 3) {
    const { shouldRunAuditEnrichment, invokeAuditEnrich } = await import('./audit-enrichment.js');
    const needsEnrich = shouldRunAuditEnrichment({
      targetPhase,
      dataQuality,
      qScore: qScoreData,
      emailList,
      phoneList,
    });
    if (needsEnrich) {
      if (onProgress) onProgress('[7/7] Agente extrator: defeitos e qualificação...');
      const recoverScrape =
        dataQuality.html === 'missing' ||
        dataQuality.renderedHtml === 'missing' ||
        (emailList.length === 0 && phoneList.length === 0);
      enrichRes = await invokeAuditEnrich({
        website: finalUrl,
        leadData,
        htmlSnippet: (renderedHtml || html || contentSnippet).slice(0, 4000),
        metrics: {
          performanceMobile: performance.mobile,
          seoScore: refinedSEO.score,
          securityScore: refinedSecurity.score,
          accessibilityScore: refinedA11y.score,
          tracking: pixels.totalTracking,
          hasCTA: Boolean(ctaObj.hasCTA),
          hasSSL: refinedSecurity.hasSSL,
          aeoScore: aeo?.score,
        },
        dataQuality,
        qScore: qScoreData,
        recoverScrape,
        traceId: options.traceId,
      });
    }
  }

  const result = {
    url: finalUrl,
    originalUrl: url,
    audit_phase: targetPhase,
    performanceMobile: performance.mobile ?? null,
    performanceDesktop: performance.desktop ?? null,
    pageSpeedFailed: Boolean(performance.pageSpeedFailed),
    dataQuality,
    pageSpeedScores: {
      performance: performance.mobile ?? null,
      accessibility: performance.accessibilityFromPageSpeed ?? null,
      seo: performance.seoFromPageSpeed ?? null,
      bestPractices: performance.bestPracticesFromPageSpeed ?? null,
      pwa: performance.pwaFromPageSpeed ?? null,
    },
    lighthouseAudits: performance.lighthouseAudits || {},
    coreWebVitals: performance.coreWebVitals || {},
    financialImpact: performance.financialImpact || {},
    resources: performance.resources || {},
    opportunities: performance.opportunities || [],
    totalSavingsKB: performance.totalSavingsKB || 0,
    opportunityScore: performance.opportunityScore || 0,
    seo: refinedSEO,
    security: refinedSecurity,
    accessibility: refinedA11y,
    pixelDetails: pixels,
    ctaAnalysis: cta,
    extractedEmails: emailList,
    emailValidation,
    extractedPhones: phoneList,
    technologies,
    conversion,
    contentAnalysis: content,
    socialMedia: social,
    googleRanking: ranking,
    aeo: aeo,
    gdpr: gdpr,
    aiInsights,
    strategicInsights,
    visionAnalysis,
    qScore: qScoreData,
    overallScore: qScoreData.score,
    priority: mapQScorePriorityToPt(qScoreData.priority || qScoreData.status),
    analyzedAt: new Date().toISOString()
  };

  if (enrichRes?.success) {
    const { mergeEnrichmentIntoAnalysis } = await import('./audit-enrichment.js');
    mergeEnrichmentIntoAnalysis(result, enrichRes);
  }

  return result;
}

async function handleSocialOnlyLead(url, leadData, socialInfo) {
  const email = await extractEmailFromSocialMedia(url, socialInfo.platform);
  const phone = await extractPhoneFromSocialMedia(url, socialInfo.platform);
  const websiteProposal = generateWebsiteProposal(leadData, socialInfo);
  
  return {
    url,
    category: 'SEM_SITE',
    isSocialMediaOnly: true,
    socialMediaInfo: socialInfo,
    extractedEmails: email ? [email] : [],
    extractedPhones: phone ? [phone] : (leadData.phone ? [leadData.phone] : []),
    websiteProposal,
    overallScore: 0,
    qScore: { score: 0, grade: 'F', status: 'SEM WEBSITE' },
    priority: 'CRÍTICA',
    analyzedAt: new Date().toISOString()
  };
}
