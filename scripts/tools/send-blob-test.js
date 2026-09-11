import { captureBlobScreenshot } from './backend/services/blob-screenshot.js';
import { sendEmail } from './backend/services/email.js';
import { generatePDFReport } from './backend/services/pdf-generator-advanced.js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

async function testRealBlobEmail() {
  const recipient = process.env.TEST_RECIPIENT || process.env.ADMIN_EMAIL || 'test@exemplo.com';
  const leadId = 'lead-alygen-test-unique';
  const website = process.env.TEST_WEBSITE || 'https://exemplo.pt';

  console.log('🎨 1. Gerando o Blob 3D real...');
  const mockAnalysis = {
    overallScore: 85,
    qScoreAdvanced: { score: 85, grade: 'A' },
    performanceMobile: 78,
    seo: { score: 90 },
    pixelDetails: { totalTracking: 5 },
    security: { score: 100, hasSSL: true },
    accessibility: { score: 88 },
    url: website
  };

  const blobResult = await captureBlobScreenshot(leadId, mockAnalysis);
  
  if (!blobResult.success) {
    console.error('❌ Falha ao gerar o Blob:', blobResult.error);
    return;
  }

  console.log('📄 2. Gerando PDF de 2 páginas...');
  const mockLead = {
    id: leadId,
    name: process.env.TEST_CLIENT_NAME || 'Cliente Teste',
    company_name: 'Alygen Labs',
    website: website,
    email: recipient
  };

  const pdfBuffer = await generatePDFReport(mockAnalysis, mockLead);

  console.log('📧 3. Enviando email com o Blob e o PDF...');
  const attachments = [
    {
      filename: 'Relatorio_Estrategico_Alygen.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf'
    },
    {
      filename: 'Sua_Analise_Visual_3D.png',
      path: blobResult.path,
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
    console.log('✅ SUCESSO ABSOLUTO! Verifica o teu email agora.');
  }
}

testRealBlobEmail();
