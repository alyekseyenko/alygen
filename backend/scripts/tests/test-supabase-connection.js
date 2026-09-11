import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

import { createClient } from '@supabase/supabase-js';

console.log('=== Teste de Conexão Supabase ===');
console.log('URL:', process.env.SUPABASE_URL);
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINIDA (' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...)' : 'NÃO DEFINIDA');
console.log('Anon Key:', process.env.SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

console.log('\nTestando query...');
const { data, error } = await supabase
  .from('lead_analyses')
  .select('lead_website, lead_name, qscore')
  .limit(5);

if (error) {
  console.error('❌ Erro:', error.message, error.code);
} else {
  console.log('✅ Sucesso! Encontrados:', data.length, 'registros');
  console.log('Dados:', data);
}