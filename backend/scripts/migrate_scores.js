import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL ou Key não encontrada no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('🚀 Iniciando migração de scores (JSONB -> Colunas) com Paging...');
  
  const CHUNK = 50;
  let from = 0;
  let to = CHUNK - 1;
  let hasMore = true;
  let totalMigrated = 0;

  while (hasMore) {
    console.log(`📊 Processando chunk: ${from} até ${to}...`);
    const { data, error } = await supabase
      .from('lead_analyses')
      .select('lead_website, full_analysis')
      .not('full_analysis', 'is', null)
      .range(from, to);

    if (error) {
      console.error('❌ Erro no fetch:', error.message);
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const row of data) {
      try {
        const full = typeof row.full_analysis === 'string' 
          ? JSON.parse(row.full_analysis) 
          : row.full_analysis;
        
        const updateData = {
          seo_score: full.seo?.score || 0,
          accessibility_score: full.accessibility?.score || 0,
          security_score: full.security?.score || 0
        };

        const { error: updError } = await supabase
          .from('lead_analyses')
          .update(updateData)
          .eq('lead_website', row.lead_website);

        if (updError) {
          console.error(`❌ Erro ao atualizar ${row.lead_website}:`, updError.message);
          if (updError.message.includes('column')) {
              console.error('🛑 PARE: As colunas não existem no Banco de Dados. Adicione-as via SQL.');
              process.exit(1);
          }
        } else {
          totalMigrated++;
        }
      } catch (e) {
        console.warn(`⚠️ Erro em ${row.lead_website}:`, e.message);
      }
    }

    from += CHUNK;
    to += CHUNK;
    if (data.length < CHUNK) hasMore = false;
  }

  console.log(`✨ Migração concluída! Total migrado: ${totalMigrated}`);
  process.exit(0);
}

migrate();
