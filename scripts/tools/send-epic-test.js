import { generateMultiDeviceMockup } from './backend/services/mockup-service.js';
import { sendEmail } from './backend/services/email.js';
import { generatePDFReport } from './backend/services/pdf-generator-advanced.js';
import dotenv from 'dotenv';
dotenv.config();

async function testFinalEpicMockup() {
  const recipient = process.env.TEST_RECIPIENT || process.env.ADMIN_EMAIL || 'test@exemplo.com';
  const website = process.env.TEST_WEBSITE || 'https://exemplo.pt';
  const leadId = 'epic-test-' + Date.now();

  console.log('🚀 1. Gerando Mockup Multi-Device (3 ecrãs)...');
  const mockupResult = await generateMultiDeviceMockup(website, leadId);
  
  if (!mockupResult.success) {
    console.error('❌ Erro no mockup:', mockupResult.error);
    return;
  }

  const mockAnalysis = {
    overallScore: 88,
    performanceMobile: 82,
    seo: { score: 95 },
    pixelDetails: { totalTracking: 6 },
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

  console.log('📧 3. Enviando email ÉPICO...');
  const attachments = [
    {
      filename: 'Plano_Presenca_Digital_360.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    },
    {
      filename: 'Mockup_MultiDevice.png',
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
    console.log('✅ SUCESSO TOTAL! O design multi-dispositivo foi enviado.');
    console.log('👉 Verifica o teu email para o veres em toda a glória.');
  }
}

testFinalEpicMockup();
