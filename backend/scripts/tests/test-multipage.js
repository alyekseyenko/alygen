// TEST MULTI-PAGE ENDPOINT
// Execute: node test-multipage.js

import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
const TEST_URL = 'https://example.com'; // Altere para um site real

async function testMultiPage() {
  console.log('🧪 TESTE MULTI-PAGE ANALYZER\n');
  
  try {
    console.log(`📡 Chamando: POST ${API_URL}/analyze-multipage`);
    console.log(`🌐 URL: ${TEST_URL}\n`);
    
    const { data } = await axios.post(`${API_URL}/analyze-multipage`, {
      url: TEST_URL
    });
    
    console.log('✅ SUCESSO!\n');
    console.log('📊 DISCOVERY:');
    console.log(`  • Total páginas: ${data.data.discovery.total}`);
    console.log(`  • Analisadas: ${data.data.discovery.analyzed}`);
    console.log(`  • Fonte: ${data.data.discovery.source}`);
    console.log(`  • Páginas:`, data.data.discovery.pages);
    
    console.log('\n📈 ANÁLISE:');
    console.log(`  • Total: ${data.data.analysis.summary.total}`);
    console.log(`  • Sucesso: ${data.data.analysis.summary.successful}`);
    console.log(`  • Falhas: ${data.data.analysis.summary.failed}`);
    console.log(`  • Performance média: ${data.data.analysis.summary.avgPerformance}`);
    
    console.log('\n📄 PÁGINAS ANALISADAS:');
    data.data.analysis.pages.forEach((page, i) => {
      console.log(`  ${i + 1}. ${page.url}`);
      console.log(`     ✓ Performance: ${page.data?.performanceMobile || 'N/A'}`);
    });
    
    console.log('\n💡 RECOMENDAÇÕES:');
    data.data.analysis.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. [${rec.priority}] ${rec.message}`);
    });
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    if (error.response) {
      console.error('📄 Response:', error.response.data);
    }
  }
}

testMultiPage();
