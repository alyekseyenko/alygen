import { generateFollowup1Html, generateFollowup2Html } from './services/followup-templates.js';

const baseSeq = {
  lead_name: 'Empresa Teste',
  email: 'teste@example.com',
  website: 'exemplo.pt',
};

async function run() {
  const variants = [
    { ...baseSeq, template: 'website' },
    { ...baseSeq, template: 'nowebsite', website: '' },
  ];

  for (const v of variants) {
    const html3 = await generateFollowup1Html(v);
    const html7 = await generateFollowup2Html(v);
    console.log('---');
    console.log('template:', v.template);
    console.log('day3 html length:', html3.length);
    console.log('day7 html length:', html7.length);
    console.log('day3 preview:', html3.substring(0, 160).replace(/\s+/g, ' '));
  }
}

run().catch((e) => {
  console.error('Erro ao gerar templates:', e);
  process.exitCode = 1;
});

