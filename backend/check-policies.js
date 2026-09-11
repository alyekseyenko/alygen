import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPolicies() {
  console.log('🔍 Checking RLS policies for automations table...');
  
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'automations');
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log(`📊 Found ${data?.length || 0} policies:`);
    data?.forEach(p => {
      console.log(`\n📋 Policy: ${p.policyname}`);
      console.log(`   Command: ${p.cmd}`);
      console.log(`   Roles: ${p.roles}`);
      console.log(`   Permissive: ${p.permissive}`);
      console.log(`   Qual: ${p.qual}`);
      console.log(`   With Check: ${p.with_check}`);
    });
  }
}

checkPolicies().catch(console.error);
