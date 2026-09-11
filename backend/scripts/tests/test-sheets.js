import { fetchLeads } from './services/sheets.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Testando conexão com Google Sheets...\n');

try {
  const leads = await fetchLeads();
  
  console.log('✅ Conexão bem-sucedida!');
  console.log(`📊 Total de leads encontrados: ${leads.length}\n`);
  
  if (leads.length > 0) {
    console.log('📋 Primeiros 3 leads:');
    leads.slice(0, 3).forEach((lead, i) => {
      console.log(`\n${i + 1}. ${lead.name}`);
      console.log(`   Website: ${lead.website}`);
      console.log(`   Phone: ${lead.phone}`);
      console.log(`   Rating: ${lead.rating}`);
    });
  } else {
    console.log('⚠️  Nenhum lead encontrado na aba "Results"');
    console.log('   Verifique se a coluna "website" está preenchida');
  }
  
} catch (error) {
  console.error('❌ Erro ao conectar:', error.message);
  console.log('\n💡 Dicas:');
  console.log('   1. Verifique se o .env está configurado');
  console.log('   2. Confirme que compartilhou o Sheet com a service account');
  console.log('   3. Aguarde 1-2 minutos após compartilhar');
  console.log('\n📖 Leia: SHEET_CONFIG.md para mais detalhes');
}
