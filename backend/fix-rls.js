import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixRLS() {
  console.log('🔧 Fixing RLS policies for automations table...');
  
  // First, let's check what's happening with ANON_KEY
  const anonClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data: anonData, error: anonError } = await anonClient.from('automations').select('*');
  
  console.log('📊 ANON_KEY test:', anonError ? 'BLOCKED' : `ALLOWED (${anonData?.length || 0} items)`);
  
  if (anonError) {
    console.log('❌ Error:', anonError.message);
    console.log('📝 Please run this SQL in Supabase SQL Editor:');
    console.log('ALTER TABLE public.automations DISABLE ROW LEVEL SECURITY;');
    console.log('Or update the RLS policy to allow public read access.');
  } else {
    console.log('✅ ANON_KEY can read automations!');
    anonData?.forEach(a => console.log(`  - ${a.name} (active: ${a.is_active})`));
  }
  
  // Also check with SERVICE_ROLE
  const { data: serviceData, error: serviceError } = await supabase.from('automations').select('*');
  console.log('📊 SERVICE_ROLE test:', serviceError ? 'ERROR' : `OK (${serviceData?.length || 0} items)`);
  if (!serviceError) {
    serviceData?.forEach(a => console.log(`  - ${a.name} (active: ${a.is_active})`));
  }
}

fixRLS().catch(console.error);
