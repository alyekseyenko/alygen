import db from './services/local-db-service.js';

async function main() {
  const result = await db.query("SELECT lead_website, lead_name, qscore, full_analysis FROM lead_analyses WHERE lead_website LIKE '%anacristinasilva%'");
  console.log('Result length:', result.rows.length);
  if (result.rows.length > 0) {
    const row = result.rows[0];
    console.log('--- DB Row values ---');
    console.log('Website:', row.lead_website);
    console.log('Name:', row.lead_name);
    console.log('Q-Score:', row.qscore);
    try {
      const parsed = JSON.parse(row.full_analysis);
      console.log('Sales Hook:', parsed.salesHook || parsed.sales_hook);
      console.log('Agent Intel:', parsed.agent_intel || parsed.agentIntel);
      console.log('Has sheet_metadata:', !!parsed.sheet_metadata);
      console.log('Has emailTemplate:', !!parsed.emailTemplate?.html);
      if (parsed.sheet_metadata) {
        console.log('Sheet metadata:', JSON.stringify(parsed.sheet_metadata, null, 2));
      }
    } catch(e) {
      console.log('Error parsing full_analysis:', e.message);
    }
  } else {
    console.log('Lead anacristinasilva not found in database.');
  }
}

main().catch(console.error);
