import dotenv from 'dotenv';
import { extractEmail, extractPhone } from './backend/services/analyzers/scraping.js';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, './backend/.env') });

async function testDeepScraping() {
  const testUrl = 'https://www.1638restaurant.com/'; // Exemplo de SPA pesado
  
  console.log(`\n🚀 Iniciando teste de Deep Scraping para: ${testUrl}`);
  console.log('------------------------------------------------------');
  
  console.log('📡 Analisando Emails...');
  const emails = await extractEmail(testUrl);
  console.log('✅ Emails encontrados:', emails.length > 0 ? emails.join(', ') : 'Nenhum (Fallback Python pode ter falhado ou o site não tem)');

  console.log('\n📡 Analisando Telefones...');
  const phones = await extractPhone(testUrl);
  console.log('✅ Telefones encontrados:', phones.length > 0 ? phones.join(', ') : 'Nenhum');

  console.log('\n------------------------------------------------------');
  console.log('🏁 Teste finalizado. Verifique os logs do servidor Python (janela preta) para ver se o Playwright foi acionado.');
}

testDeepScraping();
