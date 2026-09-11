import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);

console.log('Testing jsonb queries...');
supabase.from('lead_analyses').select('lead_website, analyzed_at, crm_stage:full_analysis->crm_stage, is_immune:full_analysis->is_immune')
  .eq('lead_website', 'https://test-persistence-direct.com')
  .then(r => console.log('Result:', JSON.stringify(r)))
  .catch(console.error);
