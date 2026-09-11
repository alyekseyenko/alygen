import { generateMultiDeviceMockup } from './backend/services/mockup-service.js';
import { sendEmail } from './backend/services/email.js';
import { generatePDFReport } from './backend/services/pdf-generator-advanced.js';
import dotenv from 'dotenv';
dotenv.config();

async function testConversionButtons() {
  const recipient = process.env.TEST_RECIPIENT || process.env.ADMIN_EMAIL || 'test@exemplo.com';
  const website = process.env.TEST_WEBSITE || 'https://exemplo.pt';
  const leadId = 'conv-test-' + Date.now();

  console.log('🚀 1. Gerando Mockup Branded...');
  const mockupResult = await generateMultiDeviceMockup(website, leadId);
  
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
    company_name: 'Alygen Labs',
    website: website,
    email: recipient
  };

  console.log('📄 2. Gerando PDF com botões de Conversão (Calendly + WA)...');
  const pdfBuffer = await generatePDFReport(mockAnalysis, mockLead);

  console.log('📧 3. Enviando Email com CTAs diretos...');
  const attachments = [
    {
      filename: 'Proposta_Estrategica.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    },
    {
      filename: 'Analise_Visual.png',
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
    console.log('✅ TESTE DE CONVERSÃO ENVIADO!');
    console.log('👉 Verifica o PDF (página 1 e 2) e o final do email.');
  }
}

testConversionButtons();
