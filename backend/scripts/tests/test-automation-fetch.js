import fs from 'fs';
import { getAutomations } from './services/supabase-service.js';

async function test() {
  const result = await getAutomations();
  if (!result.success) {
    console.error('Error fetching automations:', result.error);
    return;
  }
  const xxxx = result.data.find(a => a.name === 'xxxx');
  if (!xxxx) {
    console.error('Automation "xxxx" not found');
    return;
  }
  
  fs.writeFileSync('xxxx-workflow.json', JSON.stringify(xxxx, null, 2));
  console.log('✅ Workflow "xxxx" guardado em xxxx-workflow.json');
}

test();
