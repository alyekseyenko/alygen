import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAutomationStatus() {
    console.log('--- VERIFICANDO ESTADO DAS AUTOMAÇÕES ---');
    
    // 1. Ver automações e execuções
    const { data: automations, error } = await supabase
        .from('automations')
        .select('*');

    if (error) {
        console.error('Erro ao ler automações:', error.message);
        return;
    }

    automations.forEach(a => {
        console.log(`🤖 [${a.name}] - Execuções: ${a.run_count} | Última: ${a.last_run || 'Nunca'}`);
    });

    // 2. Ver logs recentes
    const { data: logs, error: errLog } = await supabase
        .from('automation_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (!errLog && logs && logs.length > 0) {
        console.log('\n📝 Logs Recentes:');
        logs.forEach(l => {
            console.log(`   - [${l.created_at}] Lead: ${l.lead_id} | Status: ${l.status}`);
        });
    } else {
        console.log('\n📝 Nenhum log de execução encontrado ainda.');
    }
}

checkAutomationStatus();
