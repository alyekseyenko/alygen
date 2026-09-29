/**
 * Importa todas as linhas do Google Sheets (aba Results) para Postgres.
 * Uso: node scripts/sync-sheets-to-postgres.js
 * Docker: docker exec alygencrm-backend-1 node scripts/sync-sheets-to-postgres.js
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchLeads } from '../services/sheets.js';
import { getAnalysisByWebsite, updateLeadCRMData } from '../services/crm-data-service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  if (!process.env.GOOGLE_SHEET_ID) {
    console.error('❌ GOOGLE_SHEET_ID em falta no backend/.env');
    process.exit(1);
  }

  console.log('📊 A ler Google Sheets...');
  const { leads } = await fetchLeads();
  if (!leads?.length) {
    console.warn('⚠️ Nenhuma lead devolvida do Sheets (credenciais ou sheet vazio).');
    process.exit(0);
  }
  console.log(`📥 ${leads.length} linhas com website — a gravar no Postgres...`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const sheetLead of leads) {
    if (!sheetLead.website) {
      skipped += 1;
      continue;
    }
    const dbCheck = await getAnalysisByWebsite(sheetLead.website);
    const payload = {
      name: sheetLead.name || sheetLead.title || sheetLead.website,
      crm_stage: 'LEAD',
      client_phone: sheetLead.phone || '',
      client_address: sheetLead.address || '',
      private_notes: sheetLead.description || '',
      rating: sheetLead.rating ? parseFloat(sheetLead.rating) : null,
      reviews_count: sheetLead.reviews ? parseInt(sheetLead.reviews, 10) : null,
      latitude: sheetLead.latitude || null,
      longitude: sheetLead.longitude || null,
      sheet_metadata: sheetLead.sheet_metadata,
    };

    if (!dbCheck.success || !dbCheck.data) {
      await updateLeadCRMData(sheetLead.website, payload);
      inserted += 1;
    } else {
      await updateLeadCRMData(sheetLead.website, payload);
      updated += 1;
    }
    if ((inserted + updated) % 500 === 0) {
      console.log(`   … ${inserted + updated} processadas`);
    }
  }

  console.log(`✅ Concluído: ${inserted} novas, ${updated} atualizadas, ${skipped} ignoradas (sem website).`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Sync Sheets → Postgres falhou:', err.message);
  process.exit(1);
});
