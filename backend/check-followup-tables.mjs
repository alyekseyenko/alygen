import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://yjlqyyiqjaxezgxfbnfb.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHF5eWlxamF4ZXpneGZibmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM4NTQ2MCwiZXhwIjoyMDg4OTYxNDYwfQ.8L-8BiXKauX463zU0opa5m75oK62TRv2yXGj0CWyWaA';

const oldSupabase = createClient(OLD_URL, OLD_KEY);

async function listTables() {
    console.log('--- LISTANDO TODAS AS TABELAS NA DB ANTIGA ---');
    
    // O Supabase não tem uma função direta para listar tabelas via cliente JS, 
    // mas podemos tentar dar um select em tabelas comuns ou usar uma query SQL se tivéssemos RPC.
    // Como não temos RPC, vamos tentar tabelas que costumam existir em CRMs.
    
    const potentialTables = [
        'followups', 
        'communications', 
        'email_sequences', 
        'email_logs', 
        'automation_logs', 
        'activities',
        'contacts_log'
    ];

    for (const table of potentialTables) {
        const { data, error } = await oldSupabase.from(table).select('*').limit(1);
        if (!error) {
            console.log(`✅ Tabela [${table}] existe.`);
            // Se existir, ver se tem agency_id
            if (data && data.length > 0 && data[0].agency_id) {
                 console.log(`   Possui agency_id.`);
            }
        }
    }
}

listTables();
