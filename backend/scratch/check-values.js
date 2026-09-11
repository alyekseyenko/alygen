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
  console.log('🔍 Checking values in lead_analyses...');
  
  const { data, error } = await supabase
    .from('lead_analyses')
    .select('lead_website, seo_score, performance_mobile')
    .gt('seo_score', 0)
    .limit(5);
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log(`✅ Found ${data.length} rows with seo_score > 0`);
    data.forEach(r => console.log(`  - ${r.lead_website}: SEO=${r.seo_score}, Perf=${r.performance_mobile}`));
  }
}

check();
