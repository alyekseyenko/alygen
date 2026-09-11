import { generateMultiDeviceMockup } from './backend/services/mockup-service.js';
import { sendEmail } from './backend/services/email.js';
import { generatePDFReport } from './backend/services/pdf-generator-advanced.js';
import dotenv from 'dotenv';
dotenv.config();

async function testBrandedEpicMockup() {
  const recipient = process.env.TEST_RECIPIENT || process.env.ADMIN_EMAIL || 'test@exemplo.com';
  const website = process.env.TEST_WEBSITE || 'https://exemplo.pt';
  const leadId = 'branded-epic-' + Date.now();

  console.log('🚀 1. Gerando MASTER MOCKUP com a marca ALYGEN...');
  const mockupResult = await generateMultiDeviceMockup(website, leadId);
  
  if (!mockupResult.success) {
    console.error('❌ Erro no mockup:', mockupResult.error);
    return;
  }

  const mockAnalysis = {
    overallScore: 90,
    performanceMobile: 85,
    seo: { score: 92 },
    pixelDetails: { totalTracking: 7 },
    category: 'Premium',
    url: website
  };

  const mockLead = {
    id: leadId,
    name: process.env.TEST_CLIENT_NAME || 'Cliente Teste',
    company_name: 'Alygen Consultoria',
    website: website,
    email: recipient
  };

  console.log('📄 2. Gerando PDF Estratégico...');
  const pdfBuffer = await generatePDFReport(mockAnalysis, mockLead);

  console.log('📧 3. Enviando Proposta Oficial Alygen...');
  const attachments = [
    {
      filename: 'Plano_Crescimento_Digital_Alygen.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    },
    {
      filename: 'Analise_Visual_Personalizada.png',
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
    console.log('✅ SUCESSO! A proposta assinada pela Alygen foi enviada.');
    console.log('👉 Abre o teu email e prepara-te para o WOW.');
  }
}

testBrandedEpicMockup();
