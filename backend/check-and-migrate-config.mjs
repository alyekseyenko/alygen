import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectAutomation() {
    const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('name', 'xxxx')
        .single();

    if (error) {
        console.error('Erro:', error.message);
        return;
    }

    console.log(`🤖 Automação: ${data.name}`);
    console.log(`📡 Trigger Type: ${data.trigger_type}`);
    console.log(`⚙️ Workflow Data (Nodes):`, data.workflow_data.nodes.map(n => n.data.label).join(' -> '));
}

async function migrateFiscalConfig() {
    console.log('\n--- MIGRANDO CONFIGURAÇÃO FISCAL (Alygen Central) ---');
    
    const OLD_URL = 'https://yjlqyyiqjaxezgxfbnfb.supabase.co';
    const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHF5eWlxamF4ZXpneGZibmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM4NTQ2MCwiZXhwIjoyMDg4OTYxNDYwfQ.8L-8BiXKauX463zU0opa5m75oK62TRv2yXGj0CWyWaA';
    const oldSupabase = createClient(OLD_URL, OLD_KEY);

    // 1. Buscar da base antiga
    const { data: configs, error: errOld } = await oldSupabase
        .from('alygen_config')
        .select('*')
        .eq('agency_id', 'alygen');

    if (errOld) {
        console.error('Erro ao buscar configs antigas:', errOld.message);
        return;
    }

    if (!configs || configs.length === 0) {
        console.log('⚠️ Nenhuma configuração fiscal encontrada para Alygen.');
        return;
    }

    console.log(`📦 Encontradas ${configs.length} configurações fiscais.`);

    // 2. Inserir na nova base
    const cleanConfigs = configs.map(({ agency_id, ...rest }) => rest);
    const { data: inserted, error: errNew } = await supabase
        .from('alygen_config')
        .upsert(cleanConfigs, { onConflict: 'id' })
        .select();

    if (errNew) {
        console.error('❌ Erro ao inserir configs:', errNew.message);
    } else {
        console.log(`✅ Sucesso! ${inserted.length} configurações (Alygen Central) migradas.`);
    }
}

inspectAutomation().then(() => migrateFiscalConfig());
