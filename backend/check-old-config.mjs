import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://yjlqyyiqjaxezgxfbnfb.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHF5eWlxamF4ZXpneGZibmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM4NTQ2MCwiZXhwIjoyMDg4OTYxNDYwfQ.8L-8BiXKauX463zU0opa5m75oK62TRv2yXGj0CWyWaA';
const oldSupabase = createClient(OLD_URL, OLD_KEY);

async function checkConfig() {
    const { data, error } = await oldSupabase.from('alygen_config').select('*').limit(5);
    if (error) {
        console.error(error.message);
    } else {
        console.log('Configs:', JSON.stringify(data, null, 2));
    }
}

checkConfig();
