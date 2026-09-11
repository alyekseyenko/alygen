import axios from 'axios';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function debugScraperAPI() {
  const apiKey = process.env.SCRAPER_API_KEY;
  
  console.log('🔍 Debug ScraperAPI - Salvando HTML...\n');
  
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
    
    // Salvar HTML para análise
    writeFileSync('google-results-debug.html', data);
    
    console.log('✅ HTML salvo em: google-results-debug.html');
    console.log('\nAbra o arquivo para ver o HTML retornado pelo Google.');
    console.log('Isso ajuda a identificar os seletores corretos.\n');
    
    // Mostrar primeiros 500 caracteres
    console.log('📄 Primeiros 500 caracteres:');
    console.log(data.substring(0, 500));
    console.log('...\n');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugScraperAPI();
