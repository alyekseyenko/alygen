import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔍 Verificando configuração do .env...\n');

const checks = [
  {
    name: 'Google Service Account Email',
    key: 'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    required: true,
    valid: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
           process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL !== 'your-service-account@project.iam.gserviceaccount.com'
  },
  {
    name: 'Google Private Key',
    key: 'GOOGLE_PRIVATE_KEY',
    required: true,
    valid: process.env.GOOGLE_PRIVATE_KEY && 
           process.env.GOOGLE_PRIVATE_KEY !== '"-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\\n"'
  },
  {
    name: 'Google Sheet ID',
    key: 'GOOGLE_SHEET_ID',
    required: true,
    valid: process.env.GOOGLE_SHEET_ID === '1BSFyHaMlWJNWa0aHqAbY5r_3MbzcmkWcK6h4_WrZcQY'
  },
  {
    name: 'PageSpeed API Key',
    key: 'PAGESPEED_API_KEY',
    required: false,
    valid: process.env.PAGESPEED_API_KEY && 
           process.env.PAGESPEED_API_KEY !== 'your-pagespeed-key-here'
  },
  {
    name: 'OpenAI API Key',
    key: 'OPENAI_API_KEY',
    required: false,
    valid: process.env.OPENAI_API_KEY && 
           process.env.OPENAI_API_KEY !== 'sk-your-key-here'
  }
];

let hasErrors = false;

checks.forEach(check => {
  const status = check.valid ? '✅' : (check.required ? '❌' : '⚠️');
  const label = check.required ? 'OBRIGATÓRIO' : 'OPCIONAL';
  
  console.log(`${status} ${check.name} (${label})`);
  
  if (!check.valid) {
    if (check.required) {
      hasErrors = true;
      console.log(`   ❌ Configure ${check.key} no arquivo .env`);
    } else {
      console.log(`   ⚠️  ${check.key} não configurado (funcionalidade limitada)`);
    }
  }
});

console.log('\n' + '='.repeat(60) + '\n');

if (hasErrors) {
  console.log('❌ CONFIGURAÇÃO INCOMPLETA\n');
  console.log('📋 Para configurar o Google Sheets:');
  console.log('   1. Acesse: https://console.cloud.google.com/');
  console.log('   2. Crie uma Service Account');
  console.log('   3. Baixe o JSON de credenciais');
  console.log('   4. Copie client_email e private_key para o .env');
  console.log('   5. Compartilhe o Sheet com o email da service account\n');
  console.log('📖 Leia SHEET_CONFIG.md para instruções detalhadas\n');
  process.exit(1);
} else {
  console.log('✅ CONFIGURAÇÃO VÁLIDA!\n');
  console.log('🚀 Execute: npm run dev\n');
}
