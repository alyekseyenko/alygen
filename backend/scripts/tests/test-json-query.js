import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

console.log('Testing jsonb queries...');
supabase.from('lead_analyses').select('lead_website, full_analysis->is_immune').limit(1).then(r => {
  console.log('Result of full_analysis->is_immune:', JSON.stringify(r));
}).catch(console.error);
