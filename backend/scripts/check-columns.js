import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais Supabase não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Iniciando migração de colunas CRM...');
  
  // Como o client JS não corre SQL direto, vamos tentar fazer um UPDATE fantasma 
  // para forçar a verificação ou usar um rpc se existisse.
  // Mas a forma correta é avisar o utilizador das colunas em falta se falhar.
  
  const columns = [
    'client_email',
    'client_phone',
    'client_address',
    'client_nif',
    'contact_person',
    'project_type'
  ];

  console.log('⚠️ INFO: O Supabase JS Client não permite correr ALTER TABLE diretamente.');
  console.log('⚠️ POR FAVOR, colocha este código no SQL EDITOR do teu Supabase Dashboard:');
  console.log(`
    ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS client_email TEXT;
    ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS client_phone TEXT;
    ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS client_address TEXT;
    ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS client_nif TEXT;
    ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS contact_person TEXT;
    ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS project_type TEXT;
  `);
  
  // Vamos tentar verificar se conseguimos pelo menos ler uma linha para confirmar o erro
  const { error } = await supabase.from('lead_analyses').select(columns.join(',')).limit(1);
  if (error) {
    console.log('❌ CONFIRMADO: As colunas ainda não existem no Supabase.');
  } else {
    console.log('✅ As colunas já existem!');
  }
}

runMigration();
