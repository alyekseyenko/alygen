import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fetchWorkflow() {
    console.log('🔍 Fetching workflow "xxxx"...');
    const { data, error } = await supabase
        .from('automations')
        .select('*')
        .eq('name', 'xxxx')
        .single();

    if (error) {
        console.error('❌ Error fetching workflow:', error.message);
        return;
    }

    fs.writeFileSync('xxxx-workflow-analysis.json', JSON.stringify(data, null, 2));
    console.log('✅ Workflow saved to xxxx-workflow-analysis.json');
}

fetchWorkflow();
