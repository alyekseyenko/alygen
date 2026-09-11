import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase config');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  const { data, error, count } = await supabase
    .from('lead_analyses')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error fetching lead_analyses:', error);
  } else {
    console.log('Count of records in lead_analyses:', count);
    console.log('Sample data (first 2):', JSON.stringify(data.slice(0, 2), null, 2));
  }
}

checkDb();
