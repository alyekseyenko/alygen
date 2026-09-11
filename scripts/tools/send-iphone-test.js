import { generateMobileMockup } from './backend/services/mockup-service.js';
import { sendEmail } from './backend/services/email.js';
import { generatePDFReport } from './backend/services/pdf-generator-advanced.js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

async function testIphoneMockupEmail() {
  const recipient = process.env.TEST_RECIPIENT || process.env.ADMIN_EMAIL || 'test@exemplo.com';
  const website = process.env.TEST_WEBSITE || 'https://exemplo.pt';
  const leadId = 'iphone-test-' + Date.now();

  console.log('📱 1. Gerando Mockup iPhone do teu site...');
  const mockupResult = await generateMobileMockup(website, leadId);
  
  if (!mockupResult.success) {
    console.error('❌ Erro no mockup:', mockupResult.error);
    return;
  }

  const mockAnalysis = {
    overallScore: 82,
    performanceMobile: 75,
    seo: { score: 85 },
    pixelDetails: { totalTracking: 4 },
    category: 'Standard',
    url: website
  };

  const mockLead = {
    id: leadId,
    name: process.env.TEST_CLIENT_NAME || 'Cliente Teste',
    company_name: 'Alygen Labs',
    website: website,
    email: recipient
  };

  console.log('📄 2. Gerando PDF de 2 páginas...');
  const pdfBuffer = await generatePDFReport(mockAnalysis, mockLead);

  console.log('📧 3. Enviando email com Mockup iPhone...');
  const attachments = [
    {
      filename: 'Diagnostico_Mobile.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    },
    {
      filename: 'Mockup_Preview.png',
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
    console.log('✅ TESTE IPHONE CONCLUÍDO! Verifica o teu email.');
  }
}

testIphoneMockupEmail();
