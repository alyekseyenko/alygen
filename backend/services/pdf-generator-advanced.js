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
    
    // Configurações de Marca
    const cleanLogoPath = path.join(__dirname, '../../logo/alygen-logo.png');
    const legacyLogoPath = path.join(__dirname, '../../logo/cropped-Vadym-Alyekseyenko-Multimedia-Graphic-Designer-logo.png');
    const activeLogoPath = fs.existsSync(cleanLogoPath) ? cleanLogoPath : legacyLogoPath;
    const logoBase64 = fs.existsSync(activeLogoPath) 
      ? `data:image/png;base64,${fs.readFileSync(activeLogoPath).toString('base64')}`
      : '';
    
    const senderName = process.env.SENDER_NAME || 'Consultor Alygen';
    const companyName = process.env.COMPANY_NAME || 'Alygen';
    const senderEmail = process.env.SENDER_EMAIL || 'contacto@alygen.com';
    const companyWebsite = process.env.COMPANY_WEBSITE || 'https://alygen.com';
    const calendlyUrl = process.env.CALENDLY_URL || 'https://calendly.com/alygen/30min';
    const whatsappLink = process.env.WHATSAPP_PHONE ? `https://wa.me/${process.env.WHATSAPP_PHONE}` : calendlyUrl;

    // Dados para o resumo minimalista
    const score = Math.round(analysis.overallScore || analysis.qScoreAdvanced?.score || analysis.qScore?.score || 0);
    const perf = analysis.performanceMobile || 0;
    const seo = analysis.seo?.score || 0;
    const tracking = analysis.pixelDetails?.totalTracking || 0;

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Outfit', sans-serif;
      color: #111827;
      background: #ffffff;
      line-height: 1.4;
    }
    
    .page {
      padding: 50px;
      height: 297mm;
      width: 210mm;
      position: relative;
      page-break-after: always;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 60px;
    }
    
    .logo { height: 40px; }
    
    .date {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .hero {
      margin-bottom: 60px;
    }
    
    .title-label {
      font-size: 14px;
      font-weight: 600;
      color: #FF4F00;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 8px;
      display: block;
    }
    
    h1 {
      font-size: 32px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 8px;
    }
    
    .website-link {
      font-size: 18px;
      color: #4b5563;
      text-decoration: none;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin-bottom: 60px;
    }
    
    .card {
      padding: 30px;
      background: #f9fafb;
      border-radius: 20px;
      position: relative;
      overflow: hidden;
    }
    
    .card-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 20px;
      display: block;
    }
    
    .card-value {
      font-size: 48px;
      font-weight: 700;
      color: #111827;
    }
    
    .card-total {
      font-size: 18px;
      color: #9ca3af;
    }
    
    .card.highlight {
      background: #111827;
      color: white;
    }
    
    .card.highlight .card-value { color: #FF4F00; }
    .card.highlight .card-label { color: #9ca3af; }

    .summary-box {
      margin-bottom: 60px;
      border-left: 4px solid #FF4F00;
      padding-left: 30px;
    }
    
    .summary-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 15px;
    }
    
    .summary-text {
      font-size: 16px;
      color: #4b5563;
      max-width: 600px;
    }
    
    .footer {
      position: absolute;
      bottom: 50px;
      left: 50px;
      right: 50px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-top: 1px solid #e5e7eb;
      padding-top: 30px;
    }
    
    .footer-info h3 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 5px;
    }
    
    .footer-info p {
      font-size: 14px;
      color: #6b7280;
    }
    
    .btn-contact {
      background: #111827;
      color: white;
      padding: 10px 20px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 150px;
    }

    
    .score-bar-bg {
      height: 6px;
      width: 100%;
      background: #e5e7eb;
      border-radius: 3px;
      margin-top: 15px;
    }
    
    .score-bar-fill {
      height: 100%;
      background: #FF4F00;
      border-radius: 3px;
    }

    /* Page 2 Styles */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 25px;
      margin-top: 40px;
    }
    
    .service-item {
      padding: 20px;
      border-radius: 15px;
      background: #f9fafb;
    }
    
    .service-icon {
      color: #FF4F00;
      font-size: 18px;
      font-weight: 700;
      display: block;
      margin-bottom: 10px;
    }
    
    .service-type {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .service-tags {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <!-- PAGE 1: Diagnóstico -->
  <div class="page">
    <div class="header">
      <img src="${logoBase64}" class="logo" />
      <span class="date">${new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}</span>
    </div>
    
    <div class="hero">
      <span class="title-label">Diagnóstico Digital</span>
      <h1>${leadData.name || leadData.company_name || 'Relatório de Performance'}</h1>
      <a href="${leadData.website}" class="website-link">${leadData.website || ''}</a>
    </div>
    
    <div class="grid">
      <div class="card highlight">
        <span class="card-label">Pontuação Global</span>
        <div class="card-value">${score}<span class="card-total">/100</span></div>
        <div class="score-bar-bg">
          <div class="score-bar-fill" style="width: ${score}%"></div>
        </div>
      </div>
      
      <div class="card">
        <span class="card-label">Performance Mobile</span>
        <div class="card-value">${perf}<span class="card-total">/100</span></div>
        <div class="score-bar-bg">
          <div class="score-bar-fill" style="width: ${perf}%"></div>
        </div>
      </div>
      
      <div class="card">
        <span class="card-label">SEO & Visibilidade</span>
        <div class="card-value">${seo}<span class="card-total">/100</span></div>
        <div class="score-bar-bg">
          <div class="score-bar-fill" style="width: ${seo}%"></div>
        </div>
      </div>
      
      <div class="card">
        <span class="card-label">Ferramentas Tech</span>
        <div class="card-value">${tracking}<span class="card-total">/7</span></div>
        <div class="score-bar-bg">
          <div class="score-bar-fill" style="width: ${(tracking/7)*100}%"></div>
        </div>
      </div>
    </div>
    
    <div class="summary-box">
      <div class="summary-title">Resumo do Especialista</div>
      <div class="summary-text">
        ${score < 50 
          ? "O vosso ativo digital apresenta falhas críticas que estão a afastar potenciais clientes. É necessária uma intervenção técnica para recuperar a autoridade da marca no Google e melhorar a experiência do utilizador."
          : score < 80
          ? "Têm uma base sólida, mas faltam otimizações de conversão e performance que estão a impedir o negócio de escalar como poderia. Pequenos ajustes trarão resultados imediatos."
          : "O site está num nível excelente! O foco agora deve ser escalar o tráfego e garantir que a infraestrutura se mantém competitiva perante os novos algoritmos."
        }
      </div>
    </div>
    
    <div class="footer">
      <div class="footer-info">
        <h3>${senderName}</h3>
        <p>Estratégia Digital & Otimização — ${companyName}</p>
      </div>
      <div style="display: flex; gap: 10px;">
        ${process.env.WHATSAPP_PHONE ? `<a href="${whatsappLink}" class="btn-contact" style="background: #25D366;">WhatsApp</a>` : ''}
        <a href="${calendlyUrl}" class="btn-contact">Agendar Reunião</a>
      </div>
    </div>

  </div>

  <!-- PAGE 2: Serviços -->
  <div class="page">
    <div class="hero">
      <span class="title-label">Ecossistema Digital</span>
      <h1>O que a Alygen faz por si</h1>
      <p style="color: #6b7280; font-size: 16px; margin-top: 10px;">Soluções integradas para acelerar o seu negócio.</p>
    </div>

    <div class="services-grid">
      <div class="service-item">
        <span class="service-icon">01</span>
        <div class="service-type">AI & Automação</div>
        <div class="service-tags">n8n · Make · Python · API Orchestration · CRM Syncing · Prompt Engineering · Data Pipelines</div>
      </div>

      <div class="service-item">
        <span class="service-icon">02</span>
        <div class="service-type">Web Design & Dev</div>
        <div class="service-tags">WordPress · React · PHP · SQL · HTML5/CSS3 · API Integration</div>
      </div>

      <div class="service-item">
        <span class="service-icon">03</span>
        <div class="service-type">Marketing Digital & SEO</div>
        <div class="service-tags">Meta Ads · Google Ads · Technical SEO · Core Web Vitals · GA4 · Schema · AEO · Growth Flows</div>
      </div>

      <div class="service-item">
        <span class="service-icon">04</span>
        <div class="service-type">UI & Product Design</div>
        <div class="service-tags">Responsive Design · UI Design · Wireframing · Component Architecture · Data Visualization</div>
      </div>

      <div class="service-item">
        <span class="service-icon">05</span>
        <div class="service-type">Graphic, Photo & 3D</div>
        <div class="service-tags">Adobe CC · Branding · Packaging · Editorial · Photography · 3D Product Visualization</div>
      </div>

      <div class="service-item">
        <span class="service-icon">06</span>
        <div class="service-type">Generative Art & Data Viz</div>
        <div class="service-tags">p5.js · Processing · Creative Coding · Algorithmic Design · Real-time Data Visualization</div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-info">
        <h3>${companyName} — Inteligência Digital</h3>
        <p>${senderEmail} | ${(companyWebsite || 'alygen.com').replace(/^https?:\/\//, '')}</p>
      </div>
      <div style="display: flex; gap: 10px;">
        ${process.env.WHATSAPP_PHONE ? `<a href="${whatsappLink}" class="btn-contact" style="background: #25D366;">WhatsApp</a>` : ''}
        <a href="${calendlyUrl}" class="btn-contact">Agendar Reunião</a>
      </div>
    </div>
  </div>
</body>
</html>

    `;
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    return pdfBuffer;
    
  } finally {
    await browser.close();
  }
}
