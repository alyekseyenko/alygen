import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const OLD_URL = 'https://yjlqyyiqjaxezgxfbnfb.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHF5eWlxamF4ZXpneGZibmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM4NTQ2MCwiZXhwIjoyMDg4OTYxNDYwfQ.8L-8BiXKauX463zU0opa5m75oK62TRv2yXGj0CWyWaA';

const NEW_URL = process.env.SUPABASE_URL;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const oldSupabase = createClient(OLD_URL, OLD_KEY);
const newSupabase = createClient(NEW_URL, NEW_KEY);

async function migrateFollowups() {
    console.log('🚀 Iniciando migração de FOLLOW-UPS (Sequências e Logs)...');

    // 1. Migrar email_sequences
    console.log('📦 Migrando email_sequences...');
    const { data: sequences, error: errSeq } = await oldSupabase
        .from('email_sequences')
        .select('*')
        .eq('agency_id', 'alygen');

    if (!errSeq && sequences && sequences.length > 0) {
        const cleanSeq = sequences.map(({ agency_id, ...rest }) => rest);
        const { error: insErr } = await newSupabase.from('email_sequences').upsert(cleanSeq, { onConflict: 'email' });
        if (insErr) console.error('❌ Erro ao inserir sequências:', insErr.message);
        else console.log(`✅ ${sequences.length} sequências de email migradas.`);
    } else if (errSeq) {
        console.error('❌ Erro ao buscar sequências:', errSeq.message);
    }

    // 2. Migrar contacts_log
    console.log('📦 Migrando contacts_log...');
    const { data: logs, error: errLog } = await oldSupabase
        .from('contacts_log')
        .select('*')
        .eq('agency_id', 'alygen');

    if (!errLog && logs && logs.length > 0) {
        const cleanLogs = logs.map(({ agency_id, ...rest }) => rest);
        const { error: insErr } = await newSupabase.from('contacts_log').upsert(cleanLogs, { onConflict: 'id' });
        if (insErr) console.error('❌ Erro ao inserir logs de contacto:', insErr.message);
        else console.log(`✅ ${logs.length} logs de contacto migrados.`);
    } else if (errLog) {
        console.error('❌ Erro ao buscar logs:', errLog.message);
    }

    console.log('🎉 Migração de histórico concluída!');
}

migrateFollowups();
