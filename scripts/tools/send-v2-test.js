import { generateMultiDeviceMockup } from './backend/services/mockup-service.js';
import { sendEmail } from './backend/services/email.js';
import { generatePDFReport } from './backend/services/pdf-generator-advanced.js';
import dotenv from 'dotenv';
dotenv.config();

async function testV2BrandedMockup() {
  const recipient = process.env.TEST_RECIPIENT || process.env.ADMIN_EMAIL || 'test@exemplo.com';
  const website = process.env.TEST_WEBSITE || 'https://exemplo.pt';
  const leadId = 'branded-v2-' + Date.now();

  console.log('🚀 1. Gerando MASTER MOCKUP V2 (Margens Seguras)...');
  const mockupResult = await generateMultiDeviceMockup(website, leadId);
  
  if (!mockupResult.success) {
    console.error('❌ Erro no mockup:', mockupResult.error);
    return;
  }

  const mockAnalysis = {
    overallScore: 92,
    performanceMobile: 88,
    seo: { score: 95 },
    pixelDetails: { totalTracking: 7 },
    category: 'Elite',
    url: website
  };

  const mockLead = {
    id: leadId,
    name: process.env.TEST_CLIENT_NAME || 'Cliente Teste',
    company_name: 'Alygen Consultoria',
    website: website,
    email: recipient
  };

  console.log('📄 2. Gerando PDF V2...');
  const pdfBuffer = await generatePDFReport(mockAnalysis, mockLead);

  console.log('📧 3. Enviando Proposta Oficial (Look Final)...');
  const attachments = [
    {
      filename: 'Proposta_Estrategica_Alygen.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    },
    {
      filename: 'Analise_Visual_3D_Full.png',
      path: mockupResult.path,
      contentType: 'image/png'
    }
  ];

  const result = await sendEmail({
    leadId: leadId,
    recipient: recipient,
    analysis: mockAnalysis,
    leadData: mockLead,
    attachments: attachments
  });

  if (result.success) {
    console.log('✅ SUCESSO! A V2 sem cortes foi enviada para o teu email.');
  }
}

testV2BrandedMockup();
