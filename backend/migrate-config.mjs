import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function migrateAllConfig() {
    console.log('--- MIGRANDO TODA A CONFIGURAÇÃO FISCAL (GLOBAL) ---');
    
    const OLD_URL = 'https://yjlqyyiqjaxezgxfbnfb.supabase.co';
    const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHF5eWlxamF4ZXpneGZibmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM4NTQ2MCwiZXhwIjoyMDg4OTYxNDYwfQ.8L-8BiXKauX463zU0opa5m75oK62TRv2yXGj0CWyWaA';
    const oldSupabase = createClient(OLD_URL, OLD_KEY);

    const { data: configs, error: errOld } = await oldSupabase.from('alygen_config').select('*');

    if (errOld) {
        console.error('Erro ao buscar configs antigas:', errOld.message);
        return;
    }

    console.log(`📦 Encontradas ${configs.length} linhas de configuração.`);

    const { data: inserted, error: errNew } = await supabase
        .from('alygen_config')
        .upsert(configs, { onConflict: 'id' })
        .select();

    if (errNew) {
        console.error('❌ Erro ao inserir configs:', errNew.message);
    } else {
        console.log(`✅ Sucesso! ${inserted.length} configurações fiscais migradas.`);
    }
}

migrateAllConfig();
