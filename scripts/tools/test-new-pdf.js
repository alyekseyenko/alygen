import { generatePDFReport } from './backend/services/pdf-generator-advanced.js';
import fs from 'fs';
import path from 'path';

async function testPdf() {
  console.log('🧪 A iniciar teste de PDF...');
  
  const mockAnalysis = {
    overallScore: 68,
    performanceMobile: 42,
    seo: { score: 75 },
    pixelDetails: { totalTracking: 3 },
    category: 'Standard'
  };

  const mockLead = {
    name: 'Empresa Teste Alygen',
    company_name: 'Alygen Labs',
    website: process.env.TEST_WEBSITE || 'https://exemplo.pt',
    id: 'test-lead-123'
  };

  try {
    const pdfBuffer = await generatePDFReport(mockAnalysis, mockLead);
    const outputPath = path.join(process.cwd(), 'TESTE_RELATORIO_ALYGEN.pdf');
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ TESTE CONCLUÍDO! O PDF foi guardado em: ${outputPath}`);
    console.log('👉 Abre o ficheiro para ver o novo layout de 2 páginas.');
  } catch (err) {
    console.error('❌ Erro no teste de PDF:', err.message);
  }
}

testPdf();
