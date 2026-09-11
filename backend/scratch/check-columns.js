import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('🔍 Checking lead_analyses columns...');
  
  const columns = ['seo_score', 'accessibility_score', 'security_score', 'performance_mobile', 'full_analysis'];
  
  const { data, error } = await supabase.from('lead_analyses').select('*').limit(1);
  
  if (error) {
    console.error('❌ Error selecting from lead_analyses:', error.message);
  } else if (data && data.length > 0) {
    const row = data[0];
    for (const col of columns) {
      if (Object.prototype.hasOwnProperty.call(row, col)) {
        console.log(`✅ Column "${col}" exists.`);
      } else {
        console.log(`❌ Column "${col}" MISSING!`);
      }
    }
  } else {
    console.log('⚠️ No data in lead_analyses to check columns.');
    // Try to select one by one
    for (const col of columns) {
      const { error: colError } = await supabase.from('lead_analyses').select(col).limit(1);
      if (colError) {
        console.log(`❌ Column "${col}" error: ${colError.message}`);
      } else {
        console.log(`✅ Column "${col}" exists.`);
      }
    }
  }
}

check();
