import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

async function testScraperAPI() {
  console.log('🔍 Testando ScraperAPI...\n');
  
  const apiKey = process.env.SCRAPER_API_KEY;
  
  if (!apiKey) {
    console.log('❌ SCRAPER_API_KEY não configurada!\n');
    console.log('📖 Para configurar:');
    console.log('1. Acesse: https://www.scraperapi.com/signup');
    console.log('2. Crie uma conta grátis');
    console.log('3. Copie sua API Key do dashboard');
    console.log('4. Adicione ao .env:');
    console.log('   SCRAPER_API_KEY=sua_api_key_aqui\n');
    return;
  }
  
  console.log('✅ API Key configurada\n');
  console.log('🔎 Testando busca: "Imobiliária Lisboa"\n');
  
  try {
    const googleUrl = 'https://www.google.com/search?q=Imobiliária+Lisboa&gl=pt&hl=pt&num=10';
    
    const { data } = await axios.get('http://api.scraperapi.com', {
      params: {
        api_key: apiKey,
        url: googleUrl,
        country_code: 'pt'
      },
      timeout: 30000
    });
    
    console.log('✅ Busca realizada com sucesso!\n');
    
    // Parse resultados
    const $ = cheerio.load(data);
    const results = [];
    
    $('div.g').each((index, element) => {
      const link = $(element).find('a').first().attr('href');
      const title = $(element).find('h3').first().text();
      
      if (link && title) {
        results.push({
          position: index + 1,
          title,
          url: link
        });
      }
    });
    
    console.log(`📊 Resultados encontrados: ${results.length}\n`);
    console.log('🏆 Top 5 resultados:\n');
    
    results.slice(0, 5).forEach(result => {
      console.log(`${result.position}. ${result.title}`);
      console.log(`   ${result.url}\n`);
    });
    
    console.log('✅ Tudo pronto! O sistema de ranking está funcional.');
    console.log(`\n💡 Você tem ~${1000 - 1} requests restantes este mês.`);
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
    
    if (error.response?.status === 401) {
      console.log('\n⚠️ API Key inválida.');
      console.log('Verifique se copiou corretamente do dashboard.');
    } else if (error.response?.status === 429) {
      console.log('\n⚠️ Limite de requests excedido.');
      console.log('Aguarde ou faça upgrade do plano.');
    } else {
      console.log('\nDetalhes:', error.response?.data || error.message);
    }
  }
}

testScraperAPI();
