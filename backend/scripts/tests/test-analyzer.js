import dotenv from 'dotenv';
import { analyzeLead } from './services/analyzer.js';

dotenv.config();

async function runTest() {
  const testUrl = 'https://example.com'; // O site mais calmo da web
  console.log(`🚀 Iniciando teste do Motor de Análise para: ${testUrl}`);
  console.time('Tempo de Análise');

  try {
    const result = await analyzeLead(testUrl, { name: 'Empresa Teste', website: testUrl });
    
    console.timeEnd('Tempo de Análise');
    console.log('\n--- 📊 RESULTADOS DA ANÁLISE ---');
    console.log(`QScore: ${result.qScore.score} (${result.qScore.grade})`);
    console.log(`Status: ${result.qScore.status}`);
    console.log(`Performance Mobile: ${result.performanceMobile}%`);
    console.log(`SEO Score: ${result.seo.score}%`);
    console.log(`Páginas de Contato: ${result.extractedEmails?.length ? 'DETECTADAS' : 'NÃO DETECTADAS'}`);
    console.log(`Pixels Encontrados: ${result.pixelDetails.totalTracking}`);
    console.log(`Oportunidade Financeira: ${result.financialImpact?.yearlyImpact}`);
    
    if (result.isSocialMediaOnly) {
      console.log('⚠️ LEAD SOCIAL-ONLY DETECTADO');
      console.log('Mensagem:', result.socialMediaInfo.message);
    }

    console.log('\n✅ Teste concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
    process.exit(1);
  }
}

runTest();
