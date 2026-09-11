import { createClient } from '@supabase/supabase-js';

const OLD_URL = 'https://yjlqyyiqjaxezgxfbnfb.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqbHF5eWlxamF4ZXpneGZibmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM4NTQ2MCwiZXhwIjoyMDg4OTYxNDYwfQ.8L-8BiXKauX463zU0opa5m75oK62TRv2yXGj0CWyWaA';

const oldSupabase = createClient(OLD_URL, OLD_KEY);

async function checkSequenceSchema() {
    const { data, error } = await oldSupabase.from('email_sequences').select('*').limit(1);
    if (!error && data && data.length > 0) {
        console.log('Schema email_sequences:', Object.keys(data[0]).join(', '));
    }
    
    const { data: logs, error: logErr } = await oldSupabase.from('contacts_log').select('*').limit(1);
    if (!logErr && logs && logs.length > 0) {
        console.log('Schema contacts_log:', Object.keys(logs[0]).join(', '));
    }
}

checkSequenceSchema();
