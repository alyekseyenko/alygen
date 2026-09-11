// TESTE DIRETO DO ENDPOINT
// Execute no terminal: node test-kpi.js

import axios from 'axios';

async function testarKPI() {
  console.log('🧪 TESTANDO https://kpi.pt/\n');
  
  try {
    console.log('📡 Chamando endpoint multi-page...\n');
    
    const { data } = await axios.post('http://localhost:3001/api/analyze-multipage', {
      url: 'https://kpi.pt/'
    });
    
    console.log('✅ SUCESSO!\n');
    console.log('📊 DISCOVERY:');
    console.log(`  • Total páginas: ${data.data.discovery.total}`);
    console.log(`  • Analisadas: ${data.data.discovery.analyzed}`);
    console.log(`  • Fonte: ${data.data.discovery.source}`);
    console.log(`\n📄 Páginas:`);
    data.data.discovery.pages.forEach((page, i) => {
      console.log(`  ${i + 1}. ${page}`);
    });
    
    console.log('\n📈 ANÁLISE:');
    console.log(`  • Total: ${data.data.analysis.summary.total}`);
    console.log(`  • Sucesso: ${data.data.analysis.summary.successful}`);
    console.log(`  • Falhas: ${data.data.analysis.summary.failed}`);
    console.log(`  • Performance média: ${data.data.analysis.summary.avgPerformance}`);
    
    console.log('\n📄 RESULTADOS POR PÁGINA:');
    data.data.analysis.pages.forEach((page, i) => {
      if (page.success) {
        console.log(`  ${i + 1}. ${page.url}`);
        console.log(`     Performance: ${page.data?.performanceMobile || 'N/A'}`);
      } else {
        console.log(`  ${i + 1}. ${page.url} - ERRO: ${page.error}`);
      }
    });
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    if (error.response) {
      console.error('📄 Response:', error.response.data);
    }
  }
}

testarKPI();
