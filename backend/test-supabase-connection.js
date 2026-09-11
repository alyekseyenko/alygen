import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function checkConnection() {
  console.log('🔗 URL Supabase:', supabaseUrl);
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('lead_analyses').select('count', { count: 'exact' });
    if (error) {
      console.log('❌ Erro no Supabase:', error.message);
    } else {
      console.log('✅ Conexão ao Supabase OK! Registos encontrados:', data);
    }
  } catch (err) {
    console.log('❌ Falha na ligação:', err.message);
  }
}

checkConnection();
