import { updateLeadCRMData } from './services/supabase-service.js';

async function testUpdate() {
  console.log('Testing updateLeadCRMData...');
  const result = await updateLeadCRMData('https://test-persistence-direct.com', {
    is_immune: true,
    crm_stage: 'LEAD',
    name: 'Test Persistent Lead'
  });
  
  console.log('Result:', JSON.stringify(result, null, 2));
  process.exit(0);
}

testUpdate();
