import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const credentials = JSON.parse(
  readFileSync(join(__dirname, 'google-credentials.json'), 'utf8')
);

const serviceAccountAuth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Tradução automática de type_id para PT-PT
const translations = {
  // Imobiliário
  'real_estate_agency': 'Imobiliária',
  'real_estate': 'Imobiliária',
  'property_management': 'Gestão de Imóveis',
  
  // Restauração
  'restaurant': 'Restaurante',
  'cafe': 'Café',
  'bar': 'Bar',
  'bakery': 'Padaria',
  'food': 'Restaurante',
  
  // Saúde
  'doctor': 'Médico',
  'dentist': 'Dentista',
  'clinic': 'Clínica',
  'hospital': 'Hospital',
  'pharmacy': 'Farmácia',
  'physiotherapist': 'Fisioterapeuta',
  
  // Beleza
  'hair_care': 'Cabeleireiro',
  'beauty_salon': 'Salão de Beleza',
  'spa': 'Spa',
  'nail_salon': 'Manicure',
  
  // Serviços
  'lawyer': 'Advogado',
  'accountant': 'Contabilista',
  'insurance_agency': 'Seguradora',
  'travel_agency': 'Agência de Viagens',
  'car_repair': 'Oficina Mecânica',
  'electrician': 'Eletricista',
  'plumber': 'Canalizador',
  'locksmith': 'Serralheiro',
  
  // Comércio
  'store': 'Loja',
  'clothing_store': 'Loja de Roupa',
  'shoe_store': 'Sapataria',
  'jewelry_store': 'Joalharia',
  'furniture_store': 'Loja de Móveis',
  'electronics_store': 'Loja de Eletrónicos',
  'supermarket': 'Supermercado',
  
  // Educação
  'school': 'Escola',
  'university': 'Universidade',
  'library': 'Biblioteca',
  
  // Outros
  'gym': 'Ginásio',
  'hotel': 'Hotel',
  'bank': 'Banco',
  'gas_station': 'Posto de Combustível',
  'car_dealer': 'Stand de Automóveis',
  'pet_store': 'Loja de Animais'
};

async function extractAllTypes() {
  console.log('🔍 Conectando ao Google Sheets...');
  
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  
  const sheet = doc.sheetsByTitle['Results'] || doc.sheetsByIndex[0];
  
  // 🔄 Carregar linhas em chunks para evitar ECONNRESET em sheets grandes
  const CHUNK_SIZE = 2500;
  let offset = 0;
  let rows = [];
  let moreRows = true;
  
  while (moreRows) {
      console.log(`📊 Carregando linhas ${offset + 2} até ${offset + CHUNK_SIZE + 1}...`);
      const chunk = await sheet.getRows({ offset, limit: CHUNK_SIZE });
      if (chunk.length === 0) {
          moreRows = false;
      } else {
          rows.push(...chunk);
          offset += CHUNK_SIZE;
          if (chunk.length < CHUNK_SIZE) moreRows = false;
      }
  }
  
  console.log(`📊 Total de linhas: ${rows.length}`);
  
  // Extrair todos os types únicos
  const allTypes = new Set();
  
  rows.forEach(row => {
    const type = row.get('type') || row.get('types') || '';
    if (type) {
      // Separar por vírgula se houver múltiplos tipos
      type.split(',').forEach(t => {
        const cleaned = t.trim().toLowerCase().replace(/\s+/g, '_');
        if (cleaned) allTypes.add(cleaned);
      });
    }
  });
  
  console.log(`\n✅ Total de tipos únicos encontrados: ${allTypes.size}\n`);
  
  // Criar lista traduzida
  const typesList = Array.from(allTypes).sort();
  const translatedList = [];
  const missingTranslations = [];
  
  typesList.forEach(type => {
    const translated = translations[type];
    if (translated) {
      translatedList.push({ original: type, translated });
    } else {
      missingTranslations.push(type);
    }
  });
  
  // Exibir resultados
  console.log('📋 TIPOS TRADUZIDOS:\n');
  translatedList.forEach(({ original, translated }) => {
    console.log(`  '${original}': '${translated}',`);
  });
  
  if (missingTranslations.length > 0) {
    console.log('\n\n⚠️ TIPOS SEM TRADUÇÃO (adicionar manualmente):\n');
    missingTranslations.forEach(type => {
      console.log(`  '${type}': 'TRADUZIR',`);
    });
  }
  
  // Salvar em arquivo JSON
  const output = {
    total: allTypes.size,
    translated: translatedList.length,
    missing: missingTranslations.length,
    translations: Object.fromEntries(translatedList.map(t => [t.original, t.translated])),
    missingTranslations
  };
  
  writeFileSync(
    join(__dirname, 'type-translations.json'),
    JSON.stringify(output, null, 2)
  );
  
  console.log('\n\n💾 Arquivo salvo: type-translations.json');
  console.log(`\n📊 Estatísticas:`);
  console.log(`   Total: ${output.total}`);
  console.log(`   Traduzidos: ${output.translated}`);
  console.log(`   Faltando: ${output.missing}`);
}

extractAllTypes().catch(console.error);
