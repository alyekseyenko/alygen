import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generateProposalPDF(dealData) {
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Logótipo Local
    const cleanLogoPath = path.join(__dirname, '../../logo/alygen-logo.png');
    const legacyLogoPath = path.join(__dirname, '../../logo/cropped-Vadym-Alyekseyenko-Multimedia-Graphic-Designer-logo.png');
    const activeLogoPath = fs.existsSync(cleanLogoPath) ? cleanLogoPath : legacyLogoPath;
    let logoBase64 = '';
    
    if (fs.existsSync(activeLogoPath)) {
      logoBase64 = `data:image/png;base64,${fs.readFileSync(activeLogoPath).toString('base64')}`;
    }
    
    const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
    const items = dealData.budget_items || [];
    const thirdPartyServices = dealData.thirdPartyServices || dealData.third_party_services || [];
    const subtotal = round(items.reduce((acc, item) => acc + (Number(item.price) || 0), 0));
    const subtotalThirdParty = round(thirdPartyServices.reduce((acc, item) => acc + (Number(item.price) || 0), 0));
    const discountPct = Number(dealData.discount_percentage) || 0;
    const discountAmount = round(subtotal * (discountPct / 100));
    const totalFinal = round(subtotal - discountAmount);
    const emissionDate = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });
    const user = dealData.userSettings || { nif: 'N/D', address: 'N/D', iban: 'N/D', swift: '' };
    const integrityCode = `AUTENTICAÇÃO: ALYG-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Lógica Fiscal v12.1: IVA & Retenção IRS (Strict Rounding)
    const ivaPct = Number(user.iva_percentage) || 0;
    const ivaAmount = round(totalFinal * (ivaPct / 100));
    const totalComIVA = round(totalFinal + ivaAmount);

    const isEmpresa = dealData.client_type === 'EMPRESA';
    const irsPct = isEmpresa ? (Number(user.irs_percentage) || 25) : 0;
    const irsAmount = round(totalFinal * (irsPct / 100));
    const liquidoTotalAlygen = round(totalComIVA - irsAmount);

    // Valores para Mobilização (Sinal 40%) - Arredondamento corporativo
    const sinalBruto = round(totalFinal * 0.40);
    const sinalIVA = round(sinalBruto * (ivaPct / 100));
    const sinalIRS = round(sinalBruto * (irsPct / 100));
    const sinalLiquido = round((sinalBruto + sinalIVA) - sinalIRS);

    // Lógica Dinâmica v9.1: Tipo de Projeto
    const isConsulting = dealData.project_type === 'CONSULTORIA' || dealData.project_type === 'STRATEGY';

    const htmlContent = `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Outfit', sans-serif;
      color: #0c0a09;
      background: #ffffff;
      line-height: 1.35;
    }
    
    .page {
      padding: 40px 65px;
      padding-bottom: 60px;
      min-height: 297mm;
      width: 210mm;
      position: relative;
      page-break-after: always;
      overflow: hidden;
    }

    /* WATERMARK ALYGEN v9.5 */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-15deg);
      width: 130%;
      opacity: 0.025;
      pointer-events: none;
      z-index: 0;
      filter: grayscale(1);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
    }
    
    .logo { 
      max-height: 55px; 
      max-width: 180px;
      width: auto;
      height: auto;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast;
      margin-bottom: 5px;
    }
    
    .proposal-head { text-align: right; }
    .proposal-head h2 { font-size: 18px; font-weight: 950; color: #1c1917; text-transform: uppercase; letter-spacing: -0.5px; }
    .proposal-head p { font-size: 9px; color: #FF4F00; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }

    .client-card {
      background: #fafaf9;
      border-radius: 12px;
      padding: 15px 22px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 30px;
      margin-bottom: 25px;
      border: 1px solid #f5f5f4;
    }
    
    .lbl { font-size: 8px; font-weight: 950; color: #FF4F00; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 2px; display: block; }
    .val { font-size: 13px; font-weight: 700; color: #1c1917; }
    .muted { font-size: 10px; color: #78716c; font-weight: 400; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { text-align: left; padding: 10px; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #a8a29e; border-bottom: 1.5px solid #FF4F00; letter-spacing: 1px;}
    td { padding: 12px 10px; border-bottom: 1px solid #f5f5f4; vertical-align: top; }
    
    .s-name { font-weight: 800; font-size: 14px; color: #1c1917; margin-bottom: 4px; text-transform: uppercase; letter-spacing: -0.2px;}
    .s-desc { font-size: 10px; color: #57534e; line-height: 1.5; text-align: justify; padding-right: 25px; font-weight: 400; }
    
    /* PREÇO COM PROMO v9.2 */
    .s-price-wrap { text-align: right; }
    .s-price-old { font-size: 10px; color: #a8a29e; text-decoration: line-through; display: block; margin-bottom: 2px; font-weight: 500;}
    .s-price-new { font-weight: 900; font-size: 14px; color: #1c1917; display: block; }
    .s-price-promo { color: #FF4F00; }
    .s-offer { color: #059669; font-weight: 950; font-size: 12px; letter-spacing: 0.5px; }

    .totals-wrap {
      margin-top: 15px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      padding-top: 20px;
      border-top: 2px solid #1c1917;
    }
    
    .t-row {
      display: flex;
      justify-content: space-between;
      width: 280px;
      font-size: 11px;
      font-weight: 600;
      color: #78716c;
      letter-spacing: 0.5px;
    }
    
    .final-total-row {
      width: 350px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-top: 5px;
    }
    
    .total-label {
      font-size: 10px;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: 3px;
      color: #1c1917;
      margin-bottom: 5px;
    }
    
    .total-amount {
      font-size: 34px;
      font-weight: 950;
      color: #FF4F00;
      letter-spacing: -1.5px;
      line-height: 1;
    }
    
    .savings-badge {
      font-size: 9px;
      font-weight: 850;
      color: #059669;
      margin-top: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: #f0fdf4;
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid #dcfce7;
    }

    /* LEGAL PAGE v9.2 IRONCLAD */
    .section-title { font-size: 17px; font-weight: 950; text-transform: uppercase; color: #1c1917; margin-bottom: 10px; border-left: 5px solid #FF4F00; padding-left: 15px; letter-spacing: -0.5px; position: relative; z-index: 10; }
    .clauses { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 5px; position: relative; z-index: 10; }
    .clause { margin-bottom: 6px; }
    .clause h4 { 
      font-size: 9px; 
      font-weight: 950; 
      text-transform: uppercase; 
      color: #FF4F00; 
      margin-bottom: 5px; 
      border-bottom: 1.2px solid #f5f5f4; 
      padding-bottom: 2px; 
      letter-spacing: 0.5px; 
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .clause h4 svg { width: 10px; height: 10px; fill: currentColor; }
    .clause p { font-size: 8px; color: #44403c; text-align: justify; line-height: 1.5; }
    
    .alert-box { background: #fff1f2; border: 1px solid #fecaca; padding: 8px; border-radius: 8px; margin-top: 4px; font-size: 7.5px; color: #991b1b; font-weight: 800; line-height: 1.4; border-left: 3px solid #e11d48; }

    .payment-instruction-card {
      background: #fafaf9;
      border: 2px solid #FF4F00;
      padding: 12px;
      border-radius: 14px;
      margin-top: 6px;
    }
    .pay-cta-label { font-size: 8.5px; font-weight: 950; text-transform: uppercase; color: #FF4F00; letter-spacing: 1.5px; margin-bottom: 6px; display: block; }
    .pay-val-big { font-size: 16px; font-weight: 950; color: #1c1917; margin-bottom: 10px; display: block; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px; }
    
    .pay-iban-box { background: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1.2px solid #e7e5e4; margin-bottom: 6px; }
    .pay-iban-label { font-size: 7.5px; font-weight: 800; color: #a8a29e; text-transform: uppercase; display: block; margin-bottom: 3px; }
    .pay-iban-val { font-family: monospace; font-size: 10px; color: #1c1917; font-weight: 800; }
    
    .pay-titular { font-size: 8.5px; font-weight: 950; color: #1c1917; background: #FF4F0010; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; }
    .pay-swift-val { font-family: monospace; font-size: 8.5px; color: #FF4F00; font-weight: 800; margin-left: auto; }

    .signature-grid { margin-top: 35px; display: flex; justify-content: space-between; gap: 40px; }
    .sig-col { flex: 1; }
    .sig-date-label { font-size: 8px; color: #a8a29e; font-weight: 600; margin-bottom: 5px; }
    .sig-space { height: 80px; margin-bottom: 0; background: #ffffff; display: flex; align-items: center; justify-content: center; }
    .sig-line { border-top: 2px solid #1c1917; padding-top: 8px; font-size: 10px; font-weight: 950; text-transform: uppercase; text-align: center; color: #1c1917;}
    .sig-sub { font-size: 8px; color: #a8a29e; text-align: center; margin-top: 3px; font-weight: 800; text-transform: uppercase; }

    .footer-disclaimer { 
      font-size: 7.5px; 
      color: #a8a29e; 
      text-align: center; 
      margin-top: 25px;
      font-style: italic; 
      font-weight: 500;
      line-height: 1.4;
      padding: 0 50px;
    }
    
    .page-footer { position: absolute; bottom: 30px; left: 65px; right: 65px; text-align: center; font-size: 8px; color: #a8a29e; font-weight: 600; border-top: 1.5px solid #f5f5f4; padding-top: 15px; }

    /* MOBILIZATION TIMELINE v10.0 */
    .mob-timeline {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 35px;
      padding: 10px 0;
      position: relative;
    }
    .mob-step {
      flex: 1;
      text-align: center;
      position: relative;
      z-index: 5;
    }
    .mob-box {
      display: inline-block;
      padding: 8px 15px;
      border-radius: 10px;
      font-size: 9px;
      font-weight: 950;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      background: #f4f4f5;
      color: #71717a;
      border: 1.5px solid #e4e4e7;
    }
    .mob-active {
      background: #FF4F00;
      color: #ffffff;
      border-color: #FF4F00;
      box-shadow: 0 4px 15px rgba(255, 79, 0, 0.2);
    }
    .mob-connector {
      position: absolute;
      top: 50%;
      left: 10%;
      right: 10%;
      height: 2px;
      background: #e4e4e7;
      z-index: 1;
      transform: translateY(-50%);
    }
    .mob-progress {
      position: absolute;
      top: 50%;
      left: 10%;
      width: 40%;
      height: 2px;
      background: #FF4F00;
      z-index: 2;
      transform: translateY(-50%);
    }
    .mob-label { font-size: 7px; color: #a8a29e; margin-top: 6px; font-weight: 800; display: block; text-transform: uppercase; }

    /* SWISS BRUTALIST WATERMARKS v11.5 */
    .swiss-watermark {
      position: absolute;
      top: 0;
      right: -80px;
      font-size: 130px;
      font-weight: 900;
      color: #1c1917;
      opacity: 0.03;
      transform: rotate(90deg);
      transform-origin: top left;
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      letter-spacing: -2px;
      text-transform: uppercase;
    }
    .swiss-watermark-left {
      position: absolute;
      bottom: -60px;
      left: -20px;
      font-size: 110px;
      font-weight: 900;
      color: #FF4F00;
      opacity: 0.02;
      transform: rotate(-90deg);
      transform-origin: bottom right;
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      letter-spacing: -3px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>

  <!-- PAGE 1: FOLHA DE ROSTO SINGULAR (THE PITCH) -->
  <div class="page" style="display: flex; flex-direction: column; justify-content: space-between; position: relative; background: #0c0a09; color: #fafaf9; overflow: hidden; border: 8px solid #1c1917;">
    
    <!-- DARK MODE BACKGROUND ACCENTS -->
    <img src="${logoBase64}" class="watermark" style="opacity: 0.015; filter: brightness(0) invert(1);" />
    <div style="position: absolute; top: -150px; right: -150px; width: 500px; height: 500px; background: radial-gradient(circle, rgba(255,79,0,0.15) 0%, rgba(12,10,9,0) 70%); border-radius: 50%; z-index: 1;"></div>
    
    <div class="swiss-watermark" style="color: #ffffff; opacity: 0.015;">PROPOSTA CONFIDENCIAL</div>
    <div class="swiss-watermark-left" style="opacity: 0.03;">ALYGEN EST.2023</div>

    <!-- LEFT VERTICAL ACCENT LINE -->
    <div style="position: absolute; left: 60px; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.06); z-index: 2;"></div>

    <div style="position: relative; z-index: 10; padding-left: 35px; margin-top: 0px;">
      <div style="width: 80px; height: 12px; background: #FF4F00; margin-bottom: 35px; margin-left: -35px;"></div>
      
      <img src="${logoBase64}" style="max-height: 40px; max-width: 220px; margin-bottom: 40px; filter: brightness(0) invert(1) opacity(0.95);" />
      
      <p style="font-size: 11px; font-weight: 950; text-transform: uppercase; color: #FF4F00; letter-spacing: 5px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 20px; height: 1px; background: #FF4F00;"></span>
        Documento Restrito
      </p>
      
      <h1 style="font-size: 42px; font-weight: 950; color: #ffffff; line-height: 1.05; margin-bottom: 20px; letter-spacing: -2px; text-transform: uppercase;">
        Impulso Digital Estratégico<br>Para <span style="color: #FF4F00;">${dealData.name || 'Empresa Cliente'}</span>
      </h1>
      
      <div style="width: 60px; height: 3px; background: rgba(255,255,255,0.15); margin: 30px 0;"></div>
      
      <p style="font-size: 16px; font-weight: 300; color: #e7e5e4; line-height: 1.6; margin-bottom: 15px; max-width: 90%;">
        Acreditamos que a presença digital corporativa da <strong style="color: #ffffff; font-weight: 700;">${dealData.name || 'Empresa Cliente'}</strong> exige uma arquitetura de alta performance, projetada para transcender padrões de excelência operacional e consolidar uma autoridade visual indiscutível no mercado global.
      </p>
      
      <p style="font-size: 13.5px; font-weight: 400; color: #a8a29e; line-height: 1.7; text-align: justify; max-width: 88%;">
        Este dossiê detalha a visão infraestrutural e estratégica desenhada em exclusividade para os vossos desafios. A Alygen não entrega apenas design ou templates genéricos; cada solução orçamentada reflete engenharia de vanguarda e um compromisso inegociável com a qualidade, focado na maximização do retorno sobre investimento.
      </p>
    </div>

    <!-- PREPARED FOR BLOCK (PREMIUM GLASSMORPHISM) -->
    <div style="position: relative; z-index: 10; margin-top: 35px; margin-left: 35px; background: rgba(25,25,25,0.6); border: 1px solid rgba(255,255,255,0.06); padding: 25px 30px; border-radius: 12px; display: flex; align-items: center; gap: 25px; max-width: 82%; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
      <div style="width: 4px; height: 55px; background: #FF4F00; border-radius: 4px;"></div>
      <div>
        <span style="font-size: 9px; color: #a8a29e; font-weight: 700; text-transform: uppercase; letter-spacing: 3px; display: block; margin-bottom: 8px;">Preparado em Exclusivo Para</span>
        <p style="font-size: 20px; font-weight: 950; color: #ffffff; margin: 0; letter-spacing: -0.5px;">${dealData.contact_person || 'Equipa de Gestão'}</p>
        <p style="font-size: 12.5px; font-weight: 800; color: #FF4F00; margin: 0; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">${dealData.name || 'Empresa Cliente'}</p>
      </div>
      
      <!-- QR/TECH SEAL MOCKUP -->
      <div style="margin-left: auto; text-align: right; display: flex; flex-direction: column; align-items: flex-end; justify-content: center;">
        <svg viewBox="0 0 24 24" style="width: 38px; height: 38px; fill: none; stroke: rgba(255,255,255,0.15); stroke-width: 1.5; margin-bottom: 4px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>
        <div style="font-family: monospace; font-size: 6px; font-weight: 800; color: #a8a29e; opacity: 0.6; letter-spacing: 1px;">AUTH VERIFIED</div>
      </div>
    </div>
    
    <div style="margin-top: auto;"></div>

    <div style="position: absolute; bottom: 85px; left: 0; right: 0; text-align: center; z-index: 10;">
      <p style="font-size: 7.5px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0;">
        <svg viewBox="0 0 24 24" style="width: 10px; height: 10px; fill: #22c55e; opacity: 0.8;"><path d="M17,8C8,10,5.9,16.17,3.82,21.34L5.71,22l1-2.3A13.8,13.8,0,0,1,20,10.23V3A1,1,0,0,0,19,2Z" /></svg>
        Contribua para a sustentabilidade global: evite a impressão desnecessária desta página de elevado contraste cromático.
      </p>
    </div>

    <div class="page-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 15px; color: #a8a29e; position: absolute; bottom: 30px; left: 65px; right: 65px; z-index: 10; margin: 0;">
      <span style="font-family: monospace; font-size: 7.5px; opacity: 0.4;">${integrityCode}</span>
      <span style="color: rgba(255,255,255,0.3); font-size: 7.5px; font-weight: 600;">AKE v11.4 | Protocolo Estratégico | Pág. 1 de 5</span>
    </div>
  </div>

  <!-- PAGE 2: ESTRUTURA FINANCEIRA BLINDADA -->
    <div class="page">
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: #FF4F00;"></div>
      <img src="${logoBase64}" class="watermark" />
      
      <div class="header" style="display: flex; justify-content: space-between; align-items: stretch; margin-bottom: 40px; padding-top: 15px;">
        <div style="display: flex; flex-direction: column; justify-content: center; gap: 4px;">
          <img src="${logoBase64}" class="logo" style="margin-left: -10px;" />
          <div class="proposal-head" style="margin-left: 2px; border-left: 3px solid #FF4F00; padding-left: 15px;">
            <h2 style="margin: 0; font-size: 24px; letter-spacing: -1px; line-height: 1;">Proposta Comercial</h2>
            <p style="margin-top: 5px; font-size: 8px; font-weight: 800; opacity: 0.6; text-transform: uppercase; letter-spacing: 2px; color: #1c1917;">Solução Digital de Elite / AKE v11.5</p>
            <div style="display: flex; gap: 10px; align-items: center; margin-top: 8px;">
               <span style="font-size: 6px; font-weight: 950; background: #FF4F00; color: #ffffff; padding: 2px 5px; border-radius: 3px;">REF: ALYG-${new Date().getFullYear().toString().slice(-2)}-${integrityCode.split('-')[2]}</span>
               <span style="font-size: 6.5px; font-weight: 900; color: #ef4444; text-transform: uppercase;">* NÃO CONSTITUI FATURA FISCAL</span>
            </div>
          </div>
        </div>
        
        <div style="text-align: right; background: #1c1917; padding: 20px 25px; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; box-shadow: 0 10px 30px rgba(28, 25, 23, 0.1);">
          <span style="font-size: 7px; color: #FF4F00; font-weight: 950; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 6px;">Identidade Fiscal & Sede Alygen</span>
          <p style="font-size: 7.5px; font-weight: 600; color: #a8a29e; margin: 0; line-height: 1.4;">${user.company_name || process.env.COMPANY_NAME || 'Alygen Technologies'}<br>${user.address || process.env.COMPANY_ADDRESS || 'Lisboa, Portugal'}</p>
        </div>
      </div>
    
    <div class="client-card">
      <div>
        <span class="lbl">Entidade Coletiva / Cliente</span>
        <p class="val">${dealData.name || 'Empresa Cliente'}</p>
        <p class="muted">${dealData.website || ''}</p>
      </div>
      <div style="text-align: right;">
        <span class="lbl">Data de Emissão</span>
        <p class="val">${emissionDate}</p>
      </div>
      <div>
        <span class="lbl">Executivo Responsável (Cliente)</span>
        <p class="val">${dealData.contact_person || 'Responsável Direto'}</p>
        <p class="muted">${dealData.client_email || ''}</p>
      </div>
      <div style="text-align: right;">
        <span class="lbl">NIF & Sede Fiscal Autorizada</span>
        <p class="val">${dealData.client_nif || 'N/D'}</p>
        <p class="muted" style="max-width: 250px; margin-left: auto;">${dealData.client_address || ''}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 75%">Âmbito de Serviços Tecnológicos & Arquitetura Digital</th>
          <th style="text-align: right; width: 25%">Investimento</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => {
          const mainPrice = Number(item.price) || 0;
          const originalPrice = Number(item.original_price) || 0;
          const isPromo = originalPrice > mainPrice;
          const isOffer = mainPrice === 0;

          return `
          <tr>
            <td>
              <div class="s-name">${item.name}</div>
              <div class="s-desc">${item.description || 'Consultoria tecnológica avançada e estratégia criativa ALYGEN.'}</div>
            </td>
            <td class="s-price-wrap">
              ${isPromo ? `<span class="s-price-old">€ ${originalPrice.toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>` : ''}
              <span class="${isOffer ? 's-offer' : 's-price-new ' + (isPromo ? 's-price-promo' : '')}">
                 ${isOffer ? 'OFERTA' : '€ ' + mainPrice.toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </td>
          </tr>
        `}).join('')}
      </tbody>
    </table>
    
    <div class="totals-wrap">
      <div class="t-row">
        <span>Subtotal Bruto do Projeto</span>
        <span style="color: #1a1a1a; font-weight: 900;">€ ${subtotal.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</span>
      </div>
      ${discountPct > 0 ? `
        <div class="t-row" style="color: #FF4F00; font-weight: 900;">
          <span>Desconto Comercial Final (${discountPct}%)</span>
          <span>- € ${discountAmount.toLocaleString('pt-PT', {minimumFractionDigits: 2})}</span>
        </div>
      ` : ''}

      ${ivaPct > 0 ? `
        <div class="t-row">
          <span>IVA Aplicável (${ivaPct}%)</span>
          <span style="color: #1a1a1a; font-weight: 900;">+ € ${ivaAmount.toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        </div>
      ` : '<div class="t-row" style="opacity: 0.6; font-size: 9px;"><span>IVA Isento (Art. 53º CIVA)</span><span>€ 0,00</span></div>'}
      
      <div class="final-total-row" style="width: 100%;">
        <span class="total-label">Investimento Total Final (Liquidável)</span>
        <span class="total-amount">€ ${totalComIVA.toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        ${discountPct > 0 ? `
           <span class="savings-badge">Benefício Comercial Aplicado: € ${discountAmount.toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
        ` : ''}
      </div>
    </div>

    <div class="page-footer" style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-family: monospace; font-size: 7.5px; opacity: 0.6;">${integrityCode}</span>
      <span>AKE v11.4 | Protocolo Estratégico Alygen | Pág. 2 de 5</span>
    </div>
  </div>

  <!-- PAGE 3: ANEXO I - CUSTOS DE TERCEIROS (TCO) -->
  <div class="page">
    <div class="header" style="margin-bottom: 50px; border-bottom: 1px solid #f1f5f9; padding-bottom: 25px;">
      <img src="${logoBase64}" class="logo" />
      <div class="proposal-head" style="flex: 1;">
        <h2 style="font-size: 14px; letter-spacing: 4px; font-weight: 950; margin-bottom: 8px; color: #1c1917;">ANEXO I: E S T I M A T I V A &nbsp; T C O</h2>
        <p style="font-size: 7.5px; color: #FF4F00; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px;">Infraestrutura e Tecnologia de Terceiros</p>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 18px; padding: 18px 22px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <svg viewBox="0 0 24 24" style="width: 20px; height: 20px; fill: #FF4F00;"><path d="M11 15h2v2h-2zm0-8h2v6h-2zm1-9C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></svg>
        <span style="font-size: 11px; font-weight: 950; text-transform: uppercase; color: #1c1917; letter-spacing: 1px;">Nota sobre Volatilidade de Preços</span>
      </div>
      <p style="font-size: 9.5px; color: #44403c; line-height: 1.6; text-align: justify;">
        Os valores abaixo são estimativas baseadas nas tabelas públicas dos fornecedores à data desta proposta. Por serem serviços prestados por entidades terceiras (SaaS/Cloud), os preços não são fixos e podem sofrer alterações conforme as políticas comerciais de cada plataforma, taxas de câmbio ou atualizações tarifárias.
      </p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 25px;">
      <div style="background: #ffffff; border: 1px solid #f1f5f9; padding: 15px; border-radius: 12px; border-left: 4px solid #FF4F00;">
        <span style="font-size: 7px; font-weight: 850; text-transform: uppercase; color: #a8a29e; display: block; margin-bottom: 5px;">Dinâmica de Preços</span>
        <p style="font-size: 8px; color: #44403c; line-height: 1.4;">A Alygen monitoriza oportunidades de redução. Os valores finais podem ser inferiores aos estimados mediante campanhas sazonais.</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #f1f5f9; padding: 15px; border-radius: 12px; border-left: 4px solid #FF4F00;">
        <span style="font-size: 7px; font-weight: 850; text-transform: uppercase; color: #a8a29e; display: block; margin-bottom: 5px;">Benefício Anual</span>
        <p style="font-size: 8px; color: #44403c; line-height: 1.4;">Opções de pagamento anual costumam oferecer descontos de 15% a 33%. Apresentaremos estas opções no setup para maximizar o seu ROI.</p>
      </div>
      <div style="background: #ffffff; border: 1px solid #f1f5f9; padding: 15px; border-radius: 12px; border-left: 4px solid #FF4F00;">
        <span style="font-size: 7px; font-weight: 850; text-transform: uppercase; color: #a8a29e; display: block; margin-bottom: 5px;">Independência</span>
        <p style="font-size: 7.5px; color: #44403c; line-height: 1.3;">Todos os contratos são celebrados entre o Cliente e o Fornecedor, garantindo a titularidade direta da <strong>${dealData.name || 'Empresa Cliente'}</strong> sobre seus ativos.</p>
      </div>
    </div>



    <table>
      <thead>
        <tr>
          <th style="width: 75%">Serviços Cloud & Infraestrutura de Terceiros</th>
          <th style="text-align: right; width: 25%">Investimento Estimado</th>
        </tr>
      </thead>
      <tbody>
        ${thirdPartyServices.length > 0 ? thirdPartyServices.map(service => `
          <tr>
            <td>
              <div class="s-name" style="font-size: 11px; margin-bottom: 2px; display: flex; align-items: center; gap: 6px;">
                ${service.name}
                ${service.is_optional ? `<span style="background: #FFF7ED; color: #EA580C; font-size: 6.5px; font-weight: 950; padding: 1px 5px; border: 0.5px solid #FDBA74; border-radius: 3px; text-transform: uppercase;">OPCIONAL</span>` : ''}
              </div>
              <div class="s-desc" style="font-size: 8.5px; line-height: 1.4;">${service.description || 'Assinatura técnica necessária para operação do ecossistema digital.'}</div>
            </td>
            <td class="s-price-wrap" style="padding-top: 15px;">
              <span class="s-price-new" style="font-size: 12px;">€ ${Number(service.price).toLocaleString('pt-PT', {minimumFractionDigits: 2})}</span>
            </td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="2" style="text-align: center; padding: 40px; color: #a8a29e; font-style: italic; font-size: 10px;">
              Nenhum custo de infraestrutura de terceiros previsto para esta configuração inicial.
            </td>
          </tr>
        `}
        ${thirdPartyServices.length > 0 ? `
          <tr style="background: #fafaf9;">
            <td style="padding: 15px 20px;">
              <div style="font-size: 10px; font-weight: 950; color: #1c1917; text-transform: uppercase; letter-spacing: 1px;">
                Total TCO Sugerido (Anual)
              </div>
              <div style="font-size: 7.5px; color: #a8a29e; font-weight: 500;">
                Soma de todos os serviços recomendados (Mandatórios + Opcionais)
              </div>
            </td>
            <td style="text-align: right; padding: 15px 20px; vertical-align: middle;">
              <span style="font-size: 14px; font-weight: 950; color: #FF4F00;">
                € ${thirdPartyServices.reduce((acc, s) => acc + (Number(s.price) || 0), 0).toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </td>
          </tr>
        ` : ''}
      </tbody>
    </table>



    <div class="page-footer" style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-family: monospace; font-size: 7.5px; opacity: 0.6;">${integrityCode}</span>
      <span>AKE v11.4 | Protocolo Estratégico Alygen | Pág. 3 de 5</span>
    </div>
  </div>

  <!-- PAGE 3: POLÍTICAS & BLINDAGEM JURÍDICA -->
  <div class="page">
    <div class="swiss-watermark">PROPOSTA CONFIDENCIAL</div>
    <div class="swiss-watermark-left">ALYGEN EST.2023</div>
    <img src="${logoBase64}" class="watermark" style="opacity: 0.015;" />
    


    <div class="mob-timeline" style="margin-bottom: 15px;">
      <div class="mob-connector"></div>
      <div class="mob-progress"></div>
      
      <div class="mob-step">
        <div class="mob-box mob-active">Adjudicação (40%)</div>
        <span class="mob-label">Reserva & Início Imediato</span>
      </div>
      <div class="mob-step">
        <div class="mob-box">Versão Beta (40%)</div>
        <span class="mob-label">Entrega de Estrutura</span>
      </div>
      <div class="mob-step">
        <div class="mob-box">Lançamento (20%)</div>
        <span class="mob-label">Automações & Final</span>
      </div>
    </div>

    <h3 class="section-title">Políticas de Prestação & Salvaguardas ALYGEN</h3>
    
    <div class="clauses">
      <div class="col">
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
            01. Custos de Terceiros e Infraestrutura
          </h4>
          <p>O Cliente assume o pagamento direto de Hosting, Domínios, CRM, APIs e licenciamento de ativos. A Alygen prioriza a utilização de ferramentas gratuitas (Open Source). Caso o projeto exija funcionalidades específicas que dependam de Plugins ou Temas Premium, o Cliente será previamente consultado e o custo da licença será suportado pelo mesmo, garantindo a titularidade e as atualizações de segurança futuras. A Alygen não gere faturas de terceiros. <strong>Para garantir a total independência e propriedade dos ativos (Independência, Pág. 3), todas as contas externas serão registadas com e-mail institucional do Cliente, atuando a Alygen apenas como administrador delegado.</strong></p>
        </div>
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6-3.8 3.8L10 10.5a1 1 0 0 0-1.4 0l-4 4a1 1 0 0 0 1.4 1.4l3.3-3.3 2.6 2.6a1 1 0 0 0 1.4 0l4.5-4.5 1.6 1.6a1 1 0 0 0 1.4-1.4l-3.3-3.3a1 1 0 0 0-1.4 0z"></path></svg>
            02. Isenção de Manutenção & Suporte
          </h4>
          <p>Este orçamento foca-se na fase de implementação. Após a conclusão, será apresentada uma proposta opcional de "SLA de Performance & Segurança" para garantir a integridade, atualizações de segurança e a longevidade tecnológica do ecossistema.</p>
        </div>
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"></path></svg>
            03. Protocolo de Revisões & Aprovação
          </h4>
          <p>Inclui 2 rondas de revisões. <strong>O silêncio por >5 dias úteis implica a Aprovação Tácita da fase apresentada.</strong></p>
        </div>
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path></svg>
            04. Fornecimento de Conteúdos e Imagens
          </h4>
          <div class="alert-box">O fornecimento de conteúdos é da inteira responsabilidade do Cliente. A Alygen reserva-se o direito de utilizar *Lorem Ipsum* ou textos gerados por IA para evitar a suspensão da fase de Design caso os materiais não sejam entregues em 7 dias úteis. Caso o Cliente solicite traduções via IA, estas serão sujeitas a orçamento extra para revisão humana. A validação jurídica final de todos os textos é da exclusiva responsabilidade do Cliente. Sessões fotográficas não incluídas. <strong>A redação e validação jurídica dos Termos de Utilização e Política de Privacidade são da inteira responsabilidade do Departamento Jurídico do Cliente, devendo ser entregues conforme o cronograma da Etapa I para integração.</strong></div>
        </div>
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path></svg>
            05. Cronograma & Gestão de Extras (Scope)
          </h4>
          <p>A falta de entrega de materiais ou feedback por parte do Cliente suspende o cronograma de entrega, sem suspender as obrigações de pagamento. Qualquer solicitação que não esteja explicitamente descrita no âmbito técnico desta proposta (Pág. 1) será considerada trabalho extra-scope. Estes trabalhos (novas funcionalidades, reuniões extra ou revisões adicionais) serão faturados à tarifa de € 85,00/hora, mediante apresentação e aprovação prévia de estimativa de tempo.</p>
        </div>
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"></path></svg>
            05-A. Cronograma de Execução
          </h4>
          <p>O prazo de conclusão é estimado com base na complexidade do âmbito técnico (Pág. 1). A execução é dividida em etapas sequenciais:<br><br><strong>Etapa I (Planeamento & Estrutura):</strong> 25% do tempo total.<br><strong>Etapa II (Desenvolvimento & Implementação):</strong> 50% do tempo total.<br><strong>Etapa III (Validação & Entrega Final):</strong> 25% do tempo total.<br><br>O cronograma efetivo inicia-se após a receção dos materiais/acessos necessários.</p>
        </div>
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"></path></svg>
            06. PAGAMENTOS & ESTRUTURA FISCAL
          </h4>
          ${isEmpresa ? `
          <p style="font-size: 8px; font-weight: 500; color: #1c1917; margin-bottom: 5px; line-height: 1.4; text-align: justify;">
            <strong>Nota para Entidade Coletiva:</strong> O valor total do investimento é o Valor Bruto (c/ IVA). No entanto, como manda a lei para serviços de freelance, uma parte desse valor (a Retenção de IRS @ 25%) é entregue por vós diretamente ao Estado em meu nome, e o restante (o Líquido) é transferido para a Alygen. No final, o custo para vós é exatamente o mesmo, apenas o destinatário do pagamento se divide.
          </p>
          ` : `
          <p style="font-size: 8px; font-weight: 500; color: #1c1917; margin-bottom: 5px; line-height: 1.4;">
            <strong>Nota para Cliente Singular:</strong> O pagamento do investimento total deverá ser efetuado na sua totalidade à Alygen, não havendo lugar a retenção na fonte por parte de clientes particulares.
          </p>
          `}
          <div style="font-size: 7.5px; border-top: 1px solid #f5f5f4; padding-top: 5px; margin-top: 5px; color: #44403c;">
            <p style="margin-bottom: 2px;"><strong style="color: #FF4F00;">40% Sinal:</strong> Adjudicação e início de trabalhos.</p>
            <p style="margin-bottom: 2px;"><strong style="color: #FF4F00;">40% Versão Beta:</strong> Devido na apresentação da estrutura funcional.</p>
            <p style="margin-bottom: 0;"><strong style="color: #FF4F00;">20% Entrega Final:</strong> Lançamento e entrega de acessos.</p>
          </div>
        </div>
      </div>

      <div class="col">
        
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z"></path></svg>
            07. Instruções para Mobilização (Sinal)
          </h4>
          <div class="payment-instruction-card">
            <span class="pay-cta-label">Instruções para Mobilização (Sinal)</span>
            <p style="font-size: 7.5px; color: #44403c; margin-bottom: 12px; line-height: 1.3;">Para dar início imediato ao projeto e reserva de agenda, deverá ser efetuado o pagamento do sinal conforme o detalhe abaixo:</p>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; background: transparent; border: none;">
              <tr style="border-bottom: 1px solid #e7e5e4;">
                <td style="font-size: 8px; padding: 4px 0; color: #78716c;">Sinal Adjudicação (40% do Bruto)</td>
                <td style="font-size: 8px; padding: 4px 0; text-align: right; color: #1c1917;">€ ${sinalBruto.toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              ${ivaPct > 0 ? `
              <tr style="border-bottom: 1px solid #e7e5e4;">
                <td style="font-size: 8px; padding: 4px 0; color: #78716c;">(+) IVA Aplicável (${ivaPct}%)</td>
                <td style="font-size: 8px; padding: 4px 0; text-align: right; color: #1c1917;">€ ${sinalIVA.toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              ` : ''}
              ${isEmpresa ? `
              <tr style="border-bottom: 1px solid #e7e5e4;">
                <td style="font-size: 8px; padding: 4px 0; color: #ef4444;">(-) Retenção na Fonte IRS (${irsPct}%)</td>
                <td style="font-size: 8px; padding: 4px 0; text-align: right; color: #ef4444;">- € ${sinalIRS.toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="font-size: 9px; padding: 8px 0; font-weight: 950; text-transform: uppercase; color: #FF4F00;">Líquido a Transferir (Sinal)</td>
                <td style="font-size: 14px; padding: 8px 0; font-weight: 950; text-align: right; color: #1c1917;">€ ${sinalLiquido.toLocaleString('pt-PT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
              </tr>
            </table>
            
            <div class="pay-iban-box" style="margin-bottom: 5px;">
              <span class="pay-iban-label">IBAN para Transferência</span>
              <span class="pay-iban-val">${user.iban || 'PT50 0000 0000 0000 0000 0000 0'}</span>
            </div>
            <div style="font-size: 8px; font-weight: 800; color: #1c1917; margin-bottom: 8px;">Titular: ${user.name || process.env.COMPANY_REPRESENTATIVE || 'Alygen Technologies'}</div>
            
            <div style="font-size: 7px; color: #78716c; font-style: italic; border-top: 1px solid #e7e5e4; padding-top: 5px;">
              Nota: O Cliente deverá enviar o comprovativo de transferência e, posteriormente, a guia de retenção para fins de contabilidade.
            </div>
          </div>
        </div>
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path></svg>
            08. Segurança de Terceiros
          </h4>
          <p>A ALYGEN não se responsabiliza por falhas ou interrupções de hosting/APIs por falta de pagamento do Cliente.</p>
        </div>
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path></svg>
            08-A. Segurança de Acessos
          </h4>
          <p>A troca de credenciais será efetuada via protocolo seguro (ex: Bitwarden ou link encriptado temporário), sendo desencorajado o envio de passwords via e-mail ou plataformas de chat.</p>
        </div>
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"></path></svg>
            09. Propriedade Intelectual & Entregáveis
          </h4>
          <p>A transferência de direitos de utilização e a entrega de acessos de Administrador só ocorrem após a liquidação de 100% do valor total. A Alygen entrega apenas os ficheiros finais de saída (ex: PDF, PNG, SVG, MP4 ou Código Compilado/Instalado). Excluem-se explicitamente todos os ficheiros de trabalho e bases de dados editáveis (ex: .AI, .PSD, .FIG, .AEP, .PRPROJ ou ficheiros de código-fonte originais não previstos), que permanecem propriedade intelectual da Alygen.</p>
        </div>
        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"></path></svg>
            10. Validade e Portefólio
          </h4>
          <p>Proposta válida por 15 dias úteis. A Alygen reserva direitos de uso para portefólio profissional.</p>
        </div>

        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24" style="fill: #FF4F00;"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"></path></svg>
            11. Política de Inteligência Artificial (IA) & Privacidade de Dados
          </h4>
          <p style="font-size: 7.5px; color: #475569; line-height: 1.4; margin-bottom: 5px;"><strong>Transparência:</strong> A Alygen utiliza IA como suporte criativo. Imagens 100% geradas por IA podem ter direitos de autor limitados pela lei atual. <strong>Vetores:</strong> O Logótipo e elementos principais são de criação original e vetorial, garantindo plena titularidade e registo de marca pelo Cliente.</p>
          <p style="font-size: 7.5px; color: #475569; line-height: 1.4;"><strong>Dados:</strong> Nenhum dado confidencial ou material proprietário da <strong>${dealData.name || 'Entidade Cliente'}</strong> será injetado em modelos públicos ou utilizado para treino de modelos de Inteligência Artificial externos, garantindo sigilo corporativo absoluto.</p>
        </div>

        <div class="clause">
          <h4>
            <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path></svg>
            12. Conformidade e Privacidade (RGPD)
          </h4>
          <p>Atendendo à natureza da atividade do Cliente, a Alygen atua exclusivamente como implementadora tecnológica. A conformidade legal dos dados recolhidos (RGPD), a gestão do segredo profissional no CRM e o uso ético das automações são da inteira responsabilidade da <strong>${dealData.name || 'Entidade Cliente'}</strong>. A Alygen não tem acesso, nem armazena dados de terceiros (clientes da <strong>${dealData.name || 'Entidade Cliente'}</strong>) após a conclusão da fase de implementação e entrega formal de acessos. Quaisquer obrigações relativas ao exercício dos direitos dos titulares de dados (acesso, retificação ou apagamento) deverão ser asseguradas diretamente pela <strong>${dealData.name || 'Entidade Cliente'}</strong>, na qualidade de Responsável pelo Tratamento, servindo a infraestrutura entregue apenas como ferramenta de suporte a essa conformidade.</p>
        </div>
      </div>
    </div>



    <div class="page-footer" style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-family: monospace; font-size: 7px; opacity: 0.6;">${integrityCode}</span>
      <span>AKE v11.4 | Protocolo Estratégico Alygen | Pág. 4 de 5</span>
    </div>
  </div>

  <!-- PAGE 4: ASSINATURAS E ADJUDICAÇÃO -->
  <div class="page">
    <div class="swiss-watermark">TERMO ADJUDICAÇÃO</div>
    <div class="swiss-watermark-left">ALYGEN EST.2023</div>
    <img src="${logoBase64}" class="watermark" style="opacity: 0.015;" />
    
    <div style="margin-top: 60px; margin-bottom: 40px; text-align: center;">
      <h3 style="font-size: 16px; font-weight: 950; text-transform: uppercase; color: #1c1917; letter-spacing: 1px; margin-bottom: 15px;">Termo de Adjudicação & Assinaturas</h3>
      <div style="background: #fafaf9; border-left: 5px solid #FF4F00; padding: 20px 25px; border-radius: 0 8px 8px 0; text-align: justify; display: inline-block; max-width: 90%; border-top: 1px solid #f5f5f4; border-right: 1px solid #f5f5f4; border-bottom: 1px solid #f5f5f4;">
        <p style="font-size: 10px; color: #44403c; line-height: 1.6; margin: 0;">
          <strong style="color: #FF4F00; font-size: 11px; display: block; margin-bottom: 8px; text-transform: uppercase;">Aprovação Integral e Indivisível</strong>
          A aposição de assinatura nesta página (Página 5) atesta, por parte do Cliente (<strong>${dealData.name || 'Empresa Cliente'}</strong>), a receção formal, a leitura atenta, e a aceitação livre, completa e incondicional de todas as funcionalidades técnicas, orçamentos e obrigações fixadas na <strong>Página 2</strong>, a estimativa de custos de infraestrutura prevista no <strong>ANEXO I (Página 3)</strong>, bem como de todas as Cláusulas Legais detalhadas na <strong>Página 4</strong>. As cinco páginas formam um contrato corporativo único referenciado sob a chave ${integrityCode}.
        </p>
      </div>
    </div>

    <div class="signature-grid" style="margin-top: 60px;">
      <div class="sig-col">
        <div class="sig-date-label">Data: ${new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')}</div>
        <div class="sig-space">
          ${user.signature_base64 ? `<img src="${user.signature_base64}" style="max-height: 85px; max-width: 220px; object-fit: contain;" />` : ''}
        </div>
        <div class="sig-line">${user.name || process.env.COMPANY_REPRESENTATIVE || 'Direção Alygen'}</div>
        <div class="sig-sub">Diretor Técnico & Estratégico — ALYGEN</div>
        <div style="font-size: 6px; color: #a8a29e; text-align: center; margin-top: 5px; font-weight: 500;">
          NIF: ${user.nif || process.env.COMPANY_NIF || '999999990'} | ${user.address || process.env.COMPANY_ADDRESS || 'Lisboa, Portugal'}
        </div>
      </div>
      <div class="sig-col">
        <div class="sig-date-label">Data: ______ / ______ / ________</div>
        <div class="sig-space" style="border-bottom: 1px dashed #e7e5e4;"></div>
        <div class="sig-line" style="margin-top: 10px;">${dealData.name || 'Empresa Cliente'}</div>
        <div class="sig-sub">Adjudicação Certificada (Assinatura & Carimbo)</div>
      </div>
    </div>

    <div class="footer-disclaimer" style="margin-top: 60px;">
      * Este documento constitui uma Proposta Comercial / Orçamento e não serve de fatura ou recibo fiscal. Ao proceder ao pagamento do valor de adjudicação estipulado na Página 3, o cliente aciona e concorda legalmente com todos os termos em vigor de forma automática e imediata.
    </div>

    <div class="page-footer" style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-family: monospace; font-size: 7px; opacity: 0.6;">${integrityCode}</span>
      <span>AKE v11.4 | Protocolo Estratégico Alygen | Pág. 5 de 5</span>
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
