import { sendEmail } from './backend/services/email.js';
import { generatePDFReport } from './backend/services/pdf-generator-advanced.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sendTestEmail() {
  const recipient = process.env.TEST_RECIPIENT || process.env.ADMIN_EMAIL || 'test@exemplo.com';
  console.log(`🧪 Iniciando envio de email real de teste para: ${recipient}`);

  const mockAnalysis = {
    overallScore: 68,
    performanceMobile: 42,
    seo: { score: 75 },
    pixelDetails: { totalTracking: 3 },
    category: 'Standard',
    url: 'https://exemplo.pt'
  };

  const mockLead = {
    id: 'test-real-123',
    name: 'Cliente Teste Alygen',
    company_name: 'Alygen Labs',
    website: 'https://exemplo.pt',
    email: recipient
  };

  try {
    // 1. Gerar PDF real
    console.log('📄 Gerando PDF minimalista...');
    const pdfBuffer = await generatePDFReport(mockAnalysis, mockLead);
    
    // 2. Tentar encontrar algum blob na pasta screenshots para anexar
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    const attachments = [
      {
        filename: `Relatorio_Alygen_Teste.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ];

    if (fs.existsSync(screenshotsDir)) {
      const files = fs.readdirSync(screenshotsDir)
        .filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
        .map(f => ({ file: f, time: fs.statSync(path.join(screenshotsDir, f)).mtimeMs }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 0) {
        attachments.push({
          filename: `Analise_Visual_Teste.png`,
          path: path.join(screenshotsDir, files[0].file),
          contentType: 'image/png'
        });
        console.log(`🖼️ Anexando imagem mais recente: ${files[0].file}`);
      }
    }

    // 3. Enviar Email
    console.log('📧 Disparando email via SMTP...');
    const result = await sendEmail({
      leadId: mockLead.id,
      recipient: recipient,
      analysis: mockAnalysis,
      leadData: mockLead,
      attachments: attachments
    });

    if (result.success) {
      console.log('✅ SUCESSO! O email foi enviado com o novo PDF e imagem.');
      console.log('👉 Verifica a tua caixa de entrada (e o SPAM por segurança).');
    }

  } catch (err) {
    console.error('❌ FALHA no envio de teste:', err.message);
  }
}

sendTestEmail();
