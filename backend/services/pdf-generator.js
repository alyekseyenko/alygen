import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generatePDFReport(analysis, leadData) {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Carregar logo
    const cleanLogoPath = path.join(__dirname, '../../logo/alygen-logo.png');
    const legacyLogoPath = path.join(__dirname, '../../logo/cropped-Vadym-Alyekseyenko-Multimedia-Graphic-Designer-logo.png');
    const activeLogoPath = fs.existsSync(cleanLogoPath) ? cleanLogoPath : legacyLogoPath;
    const logoBase64 = fs.existsSync(activeLogoPath) 
      ? `data:image/png;base64,${fs.readFileSync(activeLogoPath).toString('base64')}`
      : '';
    
    const whatsappLink = process.env.WHATSAPP_PHONE 
      ? `https://wa.me/${process.env.WHATSAPP_PHONE}` 
      : (process.env.CALENDLY_URL || 'https://calendly.com/alygen/30min');
    
    const qScore = analysis.qScore || analysis.qScoreAdvanced || { score: 0, grade: 'N/A' };
    const qScoreAdvanced = analysis.qScoreAdvanced || null;
    const performance = {
      mobile: analysis.performanceMobile || 0,
      desktop: analysis.performanceScore || 0
    };
    const seo = analysis.seo || { score: 0 };
    const security = analysis.security || { score: 0, hasSSL: false };
    const accessibility = analysis.accessibility || { score: 0 };
    const pixelDetails = analysis.pixelDetails || { totalTracking: 0 };
    const coreWebVitals = analysis.coreWebVitals || null;
    const googleRanking = analysis.googleRanking || null;
    const ctaAnalysis = analysis.ctaAnalysis || null;
    
    // Capturar screenshot se disponível
    let screenshotBase64 = null;
    if (leadData.website) {
      try {
        const { captureWebsiteScreenshot } = await import('./screenshot-service.js');
        const screenshot = await captureWebsiteScreenshot(leadData.website, { device: 'mobile', quality: 60 });
        if (screenshot.success) {
          screenshotBase64 = screenshot.base64;
        }
      } catch (error) {
        console.log('⚠️ Não foi possível capturar screenshot para o PDF');
      }
    }
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
      line-height: 1.6;
      color: #e5e7eb;
      background: #000000;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 40px; }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #FF4F00;
    }
    .logo { height: 60px; }
    .brand-name {
      color: #FF4F00;
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 2px;
      margin-top: 10px;
    }
    .header-info { text-align: right; }
    .header-info h1 { font-size: 28px; color: #ffffff; margin-bottom: 5px; }
    .header-info p { color: #9ca3af; font-size: 14px; }
    
    /* Client Info */
    .client-info {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    .client-info h2 { font-size: 32px; margin-bottom: 10px; }
    .client-info p { font-size: 16px; opacity: 0.9; }
    
    /* Q Score Section */
    .qscore-section {
      text-align: center;
      padding: 40px;
      background: #1f2937;
      border-radius: 12px;
      margin-bottom: 30px;
      border: 2px solid #374151;
    }
    .qscore-circle {
      width: 200px;
      height: 200px;
      margin: 0 auto 20px;
      border-radius: 50%;
      background: conic-gradient(
        #FF4F00 0deg ${(qScore.score / 100) * 360}deg,
        #374151 ${(qScore.score / 100) * 360}deg 360deg
      );
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qscore-inner {
      width: 160px;
      height: 160px;
      background: #111827;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .qscore-value { font-size: 48px; font-weight: bold; color: #FF4F00; }
    .qscore-grade { font-size: 24px; color: #9ca3af; margin-top: 5px; }
    .qscore-label { font-size: 18px; color: #9ca3af; margin-top: 10px; }
    
    /* Screenshot Section */
    .screenshot-section {
      margin-bottom: 30px;
      background: #1f2937;
      border-radius: 12px;
      padding: 30px;
      border: 2px solid #374151;
    }
    .screenshot-section h2 {
      color: #ffffff;
      font-size: 24px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #374151;
    }
    .screenshot-frame {
      text-align: center;
      margin: 20px 0;
    }
    .screenshot-frame img {
      max-width: 300px;
      border-radius: 20px;
      border: 8px solid #111827;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    
    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: #1f2937;
      border: 2px solid #374151;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
    }
    .metric-card h3 {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .metric-value.good { color: #10b981; }
    .metric-value.warning { color: #f59e0b; }
    .metric-value.critical { color: #ef4444; }
    .metric-label { font-size: 12px; color: #6b7280; }
    
    /* Section */
    .section {
      background: #1f2937;
      border: 2px solid #374151;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 24px;
      color: #ffffff;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #374151;
    }
    .section h3 {
      font-size: 18px;
      color: #ffffff;
      margin: 20px 0 10px 0;
    }
    
    /* Core Web Vitals */
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .vital-card {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    .vital-card h4 {
      font-size: 12px;
      color: #9ca3af;
      margin-bottom: 8px;
    }
    .vital-value {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .vital-label {
      font-size: 10px;
      color: #6b7280;
    }
    
    /* Tracking Grid */
    .tracking-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 20px 0;
    }
    .tracking-item {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .tracking-item.active {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }
    .tracking-name {
      color: #e5e7eb;
      font-size: 14px;
      font-weight: 500;
    }
    .tracking-status {
      font-size: 18px;
    }
    .tracking-status.active { color: #10b981; }
    .tracking-status.inactive { color: #6b7280; }
    
    /* SEO Details */
    .seo-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
      margin: 20px 0;
    }
    .seo-item {
      background: #111827;
      border: 1px solid #374151;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .seo-label {
      color: #9ca3af;
      font-size: 14px;
    }
    .seo-value {
      color: #e5e7eb;
      font-size: 14px;
      font-weight: 600;
    }
    
    /* Issues */
    .issue-item {
      background: rgba(239, 68, 68, 0.1);
      border-left: 4px solid #ef4444;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 6px;
    }
    .issue-item h4 {
      color: #fca5a5;
      font-size: 16px;
      margin-bottom: 5px;
    }
    .issue-item p {
      color: #fecaca;
      font-size: 14px;
      line-height: 1.5;
    }
    
    /* Opportunities */
    .opportunity-item {
      background: rgba(16, 185, 129, 0.1);
      border-left: 4px solid #10b981;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 6px;
    }
    .opportunity-item h4 {
      color: #6ee7b7;
      font-size: 16px;
      margin-bottom: 5px;
    }
    .opportunity-item p {
      color: #a7f3d0;
      font-size: 14px;
      line-height: 1.5;
    }
    
    /* Google Ranking */
    .ranking-card {
      background: #111827;
      border: 2px solid #374151;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .ranking-card.good {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }
    .ranking-card.bad {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.05);
    }
    .ranking-position {
      font-size: 48px;
      font-weight: bold;
      text-align: center;
      margin: 20px 0;
    }
    .ranking-position.good { color: #10b981; }
    .ranking-position.bad { color: #ef4444; }
    
    /* CTAs */
    .cta-item {
      background: #111827;
      border-left: 3px solid #6b7280;
      padding: 12px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .cta-item.high { border-color: #10b981; }
    .cta-item.medium { border-color: #f59e0b; }
    .cta-item.low { border-color: #ef4444; }
    .cta-text {
      color: #e5e7eb;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .cta-meta {
      color: #9ca3af;
      font-size: 12px;
    }
    
    /* Footer */
    .footer {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #374151;
      text-align: center;
      page-break-inside: avoid;
    }
    .footer h3 {
      color: #ffffff;
      font-size: 20px;
      margin-bottom: 10px;
    }
    .footer p {
      color: #9ca3af;
      font-size: 14px;
      margin-bottom: 5px;
    }
    .footer .contact {
      margin-top: 15px;
      font-size: 13px;
      color: #6b7280;
    }
    .footer .contact a {
      color: #FF4F00;
      text-decoration: none;
      font-weight: 600;
    }
    .whatsapp-btn {
      display: inline-block;
      background: #25D366;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 15px;
      font-size: 14px;
    }
    
    /* Page Break */
    .page-break { page-break-after: always; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        <img src="${logoBase64}" alt="Logo" class="logo" />
        <div class="brand-name">ALYGEN</div>
      </div>
      <div class="header-info">
        <h1>Relatório de Análise Digital</h1>
        <p>Gerado em ${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>
    
    <!-- Client Info -->
    <div class="client-info">
      <h2>${leadData.name || leadData.company_name}</h2>
      <p>${leadData.website || 'Website não disponível'}</p>
      ${leadData.address ? `<p>${leadData.address}</p>` : ''}
    </div>
    
    <!-- Q Score -->
    <div class="qscore-section">
      <div class="qscore-circle">
        <div class="qscore-inner">
          <div class="qscore-value">${Math.round(qScore.score)}</div>
          <div class="qscore-grade">${qScore.grade}</div>
        </div>
      </div>
      <p class="qscore-label">Pontuação Global de Qualidade</p>
    </div>
    
    ${screenshotBase64 ? `
    <!-- Screenshot -->
    <div class="screenshot-section">
      <h2>📱 Como os Clientes Veem o Seu Site</h2>
      <div class="screenshot-frame">
        <img src="${screenshotBase64}" alt="Screenshot do site" />
        <p style="color: #9ca3af; font-size: 12px; margin-top: 15px;">Screenshot capturado em tempo real</p>
      </div>
    </div>
    ` : ''}
    
    <!-- Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Performance Mobile</h3>
        <div class="metric-value ${performance.mobile >= 80 ? 'good' : performance.mobile >= 50 ? 'warning' : 'critical'}">
          ${performance.mobile}
        </div>
        <div class="metric-label">/100</div>
      </div>
      
      <div class="metric-card">
        <h3>Performance Desktop</h3>
        <div class="metric-value ${performance.desktop >= 80 ? 'good' : performance.desktop >= 50 ? 'warning' : 'critical'}">
          ${performance.desktop}
        </div>
        <div class="metric-label">/100</div>
      </div>
      
      <div class="metric-card">
        <h3>SEO Score</h3>
        <div class="metric-value ${seo.score >= 80 ? 'good' : seo.score >= 50 ? 'warning' : 'critical'}">
          ${seo.score}
        </div>
        <div class="metric-label">/100</div>
      </div>
      
      <div class="metric-card">
        <h3>Segurança</h3>
        <div class="metric-value ${security.hasSSL ? 'good' : 'critical'}">
          ${security.score}
        </div>
        <div class="metric-label">/100 ${security.hasSSL ? '(SSL ✓)' : '(SSL ✗)'}</div>
      </div>
      
      <div class="metric-card">
        <h3>Acessibilidade</h3>
        <div class="metric-value ${accessibility.score >= 80 ? 'good' : accessibility.score >= 50 ? 'warning' : 'critical'}">
          ${accessibility.score}
        </div>
        <div class="metric-label">/100</div>
      </div>
      
      <div class="metric-card">
        <h3>Tracking</h3>
        <div class="metric-value ${pixelDetails.totalTracking >= 5 ? 'good' : pixelDetails.totalTracking >= 3 ? 'warning' : 'critical'}">
          ${pixelDetails.totalTracking}
        </div>
        <div class="metric-label">/7 ferramentas</div>
      </div>
    </div>
    
    ${coreWebVitals ? `
    <!-- Core Web Vitals -->
    <div class="section">
      <h2>📊 Core Web Vitals (Métricas do Google)</h2>
      <p style="color: #9ca3af; font-size: 14px; margin-bottom: 20px;">
        Estas são as métricas que o Google usa para avaliar a experiência do utilizador:
      </p>
      <div class="vitals-grid">
        <div class="vital-card">
          <h4>LCP</h4>
          <div class="vital-value ${coreWebVitals.lcp?.score === 'good' ? 'good' : coreWebVitals.lcp?.score === 'needs-improvement' ? 'warning' : 'critical'}">
            ${coreWebVitals.lcp?.displayValue || 'N/A'}
          </div>
          <div class="vital-label">Tempo de carregamento</div>
        </div>
        <div class="vital-card">
          <h4>FID</h4>
          <div class="vital-value ${coreWebVitals.fid?.score === 'good' ? 'good' : coreWebVitals.fid?.score === 'needs-improvement' ? 'warning' : 'critical'}">
            ${coreWebVitals.fid?.displayValue || 'N/A'}
          </div>
          <div class="vital-label">Tempo de resposta</div>
        </div>
        <div class="vital-card">
          <h4>CLS</h4>
          <div class="vital-value ${coreWebVitals.cls?.score === 'good' ? 'good' : coreWebVitals.cls?.score === 'needs-improvement' ? 'warning' : 'critical'}">
            ${coreWebVitals.cls?.displayValue || 'N/A'}
          </div>
          <div class="vital-label">Estabilidade visual</div>
        </div>
      </div>
    </div>
    ` : ''}
    
    <!-- Tracking -->
    <div class="section">
      <h2>📊 Ferramentas de Análise e Conversão</h2>
      <div class="tracking-grid">
        <div class="tracking-item ${pixelDetails.facebook ? 'active' : ''}">
          <span class="tracking-name">Meta Pixel</span>
          <span class="tracking-status ${pixelDetails.facebook ? 'active' : 'inactive'}">
            ${pixelDetails.facebook ? '✓' : '✗'}
          </span>
        </div>
        <div class="tracking-item ${pixelDetails.ga4 ? 'active' : ''}">
          <span class="tracking-name">Google Analytics 4</span>
          <span class="tracking-status ${pixelDetails.ga4 ? 'active' : 'inactive'}">
            ${pixelDetails.ga4 ? '✓' : '✗'}
          </span>
        </div>
        <div class="tracking-item ${pixelDetails.gtm ? 'active' : ''}">
          <span class="tracking-name">Google Tag Manager</span>
          <span class="tracking-status ${pixelDetails.gtm ? 'active' : 'inactive'}">
            ${pixelDetails.gtm ? '✓' : '✗'}
          </span>
        </div>
        <div class="tracking-item ${pixelDetails.googleAds ? 'active' : ''}">
          <span class="tracking-name">Google Ads</span>
          <span class="tracking-status ${pixelDetails.googleAds ? 'active' : 'inactive'}">
            ${pixelDetails.googleAds ? '✓' : '✗'}
          </span>
        </div>
        <div class="tracking-item ${pixelDetails.tiktok ? 'active' : ''}">
          <span class="tracking-name">TikTok Pixel</span>
          <span class="tracking-status ${pixelDetails.tiktok ? 'active' : 'inactive'}">
            ${pixelDetails.tiktok ? '✓' : '✗'}
          </span>
        </div>
        <div class="tracking-item ${pixelDetails.linkedin ? 'active' : ''}">
          <span class="tracking-name">LinkedIn Insight</span>
          <span class="tracking-status ${pixelDetails.linkedin ? 'active' : 'inactive'}">
            ${pixelDetails.linkedin ? '✓' : '✗'}
          </span>
        </div>
        <div class="tracking-item ${pixelDetails.hotjar ? 'active' : ''}">
          <span class="tracking-name">Hotjar/Clarity</span>
          <span class="tracking-status ${pixelDetails.hotjar ? 'active' : 'inactive'}">
            ${pixelDetails.hotjar ? '✓' : '✗'}
          </span>
        </div>
      </div>
    </div>
    
    <!-- SEO Details -->
    <div class="section">
      <h2>🔍 Análise de SEO</h2>
      <div class="seo-grid">
        <div class="seo-item">
          <span class="seo-label">Meta Title</span>
          <span class="seo-value" style="color: ${seo.hasTitle ? '#10b981' : '#ef4444'}">
            ${seo.hasTitle ? '✓ Presente' : '✗ Em falta'}
          </span>
        </div>
        ${seo.title ? `
        <div class="seo-item" style="grid-column: 1 / -1;">
          <span class="seo-label">Título Atual:</span>
          <span class="seo-value" style="font-size: 12px; color: #9ca3af;">${seo.title}</span>
        </div>
        ` : ''}
        <div class="seo-item">
          <span class="seo-label">Meta Description</span>
          <span class="seo-value" style="color: ${seo.hasMetaDescription ? '#10b981' : '#ef4444'}">
            ${seo.hasMetaDescription ? '✓ Presente' : '✗ Em falta'}
          </span>
        </div>
        <div class="seo-item">
          <span class="seo-label">Headings (H1)</span>
          <span class="seo-value">${seo.h1Count || 0} encontrados</span>
        </div>
        <div class="seo-item">
          <span class="seo-label">Imagens sem Alt</span>
          <span class="seo-value" style="color: ${seo.imagesWithoutAlt === 0 ? '#10b981' : '#f59e0b'}">
            ${seo.imagesWithoutAlt || 0}
          </span>
        </div>
        <div class="seo-item">
          <span class="seo-label">Sitemap</span>
          <span class="seo-value" style="color: ${seo.hasSitemap ? '#10b981' : '#f59e0b'}">
            ${seo.hasSitemap ? '✓' : '✗'}
          </span>
        </div>
        <div class="seo-item">
          <span class="seo-label">Robots.txt</span>
          <span class="seo-value" style="color: ${seo.hasRobotsTxt ? '#10b981' : '#f59e0b'}">
            ${seo.hasRobotsTxt ? '✓' : '✗'}
          </span>
        </div>
      </div>
    </div>
    
    ${googleRanking && googleRanking.bestPosition ? `
    <!-- Google Ranking -->
    <div class="section">
      <h2>🎯 Visibilidade no Google</h2>
      <div class="ranking-card ${googleRanking.bestPosition.position <= 10 ? 'good' : 'bad'}">
        <h3 style="text-align: center; color: ${googleRanking.bestPosition.position <= 10 ? '#10b981' : '#ef4444'}; margin-bottom: 10px;">
          ${googleRanking.bestPosition.position <= 10 ? '✓ No TOP 10' : '⚠ Fora do TOP 10'}
        </h3>
        <div class="ranking-position ${googleRanking.bestPosition.position <= 10 ? 'good' : 'bad'}">
          #${googleRanking.bestPosition.position}
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 14px;">
          Palavra-chave: "${googleRanking.bestPosition.keyword}"
        </p>
        ${googleRanking.bestPosition.position > 10 ? `
        <p style="text-align: center; color: #fca5a5; font-size: 13px; margin-top: 15px; line-height: 1.6;">
          O vosso site não aparece no TOP 10 do Google. Isto significa que potenciais clientes estão a encontrar os vossos concorrentes primeiro.
        </p>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    ${ctaAnalysis && ctaAnalysis.ctas && ctaAnalysis.ctas.length > 0 ? `
    <!-- CTAs -->
    <div class="section">
      <h2>🎯 Análise de Chamadas para Ação (CTAs)</h2>
      <p style="color: #9ca3af; font-size: 14px; margin-bottom: 15px;">
        Encontrámos ${ctaAnalysis.ctas.length} CTAs no vosso site:
      </p>
      ${ctaAnalysis.ctas.slice(0, 5).map(cta => `
        <div class="cta-item ${cta.effectiveness}">
          <div class="cta-text">"${cta.text}"</div>
          <div class="cta-meta">
            Tipo: ${cta.type} | Eficácia: ${cta.effectiveness === 'high' ? '🟢 Alta' : cta.effectiveness === 'medium' ? '🟡 Média' : '🔴 Baixa'}
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <div class="page-break"></div>
    
    <!-- Issues -->
    <div class="section">
      <h2>🚨 Problemas Identificados</h2>
      
      ${performance.mobile < 50 ? `
      <div class="issue-item">
        <h4>🚨 Performance Mobile Crítica</h4>
        <p>O site carrega muito lentamente em dispositivos móveis. Sites lentos perdem até 53% dos visitantes que abandonam antes de carregar. Isso pode representar <strong>${Math.round((100 - performance.mobile) * 2)} potenciais clientes perdidos por mês</strong>.</p>
      </div>
      ` : ''}
      
      ${seo.score < 60 ? `
      <div class="issue-item">
        <h4>🔍 SEO Precisa de Otimização</h4>
        <p>Estão a perder aproximadamente <strong>${Math.round((100 - seo.score) * 15)} buscas mensais</strong> por falta de otimização de palavras-chave. Cada busca perdida é um potencial cliente que vai para a concorrência.</p>
      </div>
      ` : ''}
      
      ${!security.hasSSL ? `
      <div class="issue-item">
        <h4>🔒 Sem Certificado SSL</h4>
        <p>Sites sem HTTPS perdem credibilidade e são penalizados pelo Google. 85% dos utilizadores não confiam em sites sem cadeado de segurança.</p>
      </div>
      ` : ''}
      
      ${pixelDetails.totalTracking < 3 ? `
      <div class="issue-item">
        <h4>📊 Tracking Insuficiente</h4>
        <p>Sem ferramentas de análise adequadas, estão a investir às cegas. Tracking correto permite otimizar campanhas e reduzir custos em 40-60%.</p>
      </div>
      ` : ''}
    </div>
    
    <!-- Opportunities -->
    <div class="section">
      <h2>💎 Principais Oportunidades de Melhoria</h2>
      
      <div class="opportunity-item">
        <span class="icon">✓</span>
        <p><strong>Otimização de Performance:</strong> Melhorar a velocidade pode aumentar as conversões em até 82% e melhorar o ranking no Google.</p>
      </div>
      
      <div class="opportunity-item">
        <span class="icon">✓</span>
        <p><strong>Melhoria de SEO:</strong> Otimização completa pode aumentar o tráfego orgânico em 200-300% nos próximos 6-12 meses.</p>
      </div>
      
      <div class="opportunity-item">
        <span class="icon">✓</span>
        <p><strong>Implementação de Tracking:</strong> Ferramentas de análise permitem medir ROI e otimizar investimentos em publicidade.</p>
      </div>
      
      ${!security.hasSSL ? `
      <div class="opportunity-item">
        <span class="icon">✓</span>
        <p><strong>Certificado SSL:</strong> Implementação imediata aumenta confiança e melhora posicionamento no Google.</p>
      </div>
      ` : ''}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <h3>${process.env.SENDER_NAME || 'Consultor Alygen'}</h3>
      <p>Especialista em Estratégia Digital | <strong style="color: #FF4F00; font-size: 18px; letter-spacing: 1px;">${process.env.COMPANY_NAME || 'ALYGEN'}</strong></p>
      <p style="font-style: italic; margin-top: 10px;">"Transformamos websites em máquinas de conversão e autoridade"</p>
      <div class="contact">
        <p>📧 <a href="mailto:${process.env.SENDER_EMAIL || 'contacto@alygen.com'}">${process.env.SENDER_EMAIL || 'contacto@alygen.com'}</a></p>
        <p>🌐 <a href="${process.env.COMPANY_WEBSITE || 'https://alygen.com'}">${(process.env.COMPANY_WEBSITE || 'alygen.com').replace(/^https?:\/\//, '')}</a></p>
        <p>💼 <a href="${process.env.COMPANY_LINKEDIN || 'https://linkedin.com/company/alygen'}">LinkedIn</a></p>
        ${process.env.WHATSAPP_PHONE ? `<p>📱 <a href="${whatsappLink}">${process.env.WHATSAPP_PHONE}</a></p>` : ''}
      </div>
      <a href="${whatsappLink}" class="whatsapp-btn">
        💬 Contactar Especialista
      </a>
    </div>
  </div>
</body>
</html>
    `;
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return pdfBuffer;
    
  } finally {
    await browser.close();
  }
}
