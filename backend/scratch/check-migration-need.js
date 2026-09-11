import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('🔍 Checking for leads needing migration...');
  
  const { count, error } = await supabase
    .from('lead_analyses')
    .select('id', { count: 'exact', head: true })
    .eq('seo_score', 0);
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log(`📊 Found ${count} leads with seo_score = 0`);
  }
}

check();
