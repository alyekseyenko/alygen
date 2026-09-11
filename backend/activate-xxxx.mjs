import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function activate() {
    const { data, error } = await supabase
        .from('automations')
        .update({ is_active: true })
        .eq('name', 'xxxx')
        .select();
    
    if (error) console.error('Erro:', error);
    else console.log('✅ Automação ativada:', data[0].name);
}
activate();
