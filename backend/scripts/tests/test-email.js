import dotenv from 'dotenv';
import { sendEmail } from './services/email.js';

dotenv.config();

async function testEmail() {
  console.log('🧪 Testando envio de email...\n');
  
  // Verificar configurações
  console.log('📋 Configurações SMTP:');
  console.log(`  Host: ${process.env.SMTP_HOST}`);
  console.log(`  Port: ${process.env.SMTP_PORT}`);
  console.log(`  User: ${process.env.SMTP_USER}`);
  console.log(`  Pass: ${process.env.SMTP_PASS ? '***' : 'NÃO CONFIGURADO'}`);
  console.log(`  From: ${process.env.SMTP_FROM_NAME}\n`);
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP não configurado! Configure no arquivo .env');
    process.exit(1);
  }
  
  try {
    console.log('📧 Enviando email de teste...\n');
    
    const result = await sendEmail({
      leadId: 'test-001',
      recipient: process.env.SMTP_USER, // Enviar para si mesmo
      emailBody: `
🧪 EMAIL DE TESTE - CRM Deals Manager

Este é um email de teste para verificar se o sistema SMTP está funcionando corretamente.

✅ Se você recebeu este email, o sistema está configurado corretamente!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Informações do Teste:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Data: ${new Date().toLocaleString('pt-PT')}
• Host SMTP: ${process.env.SMTP_HOST}
• Porta: ${process.env.SMTP_PORT}
• Remetente: ${process.env.SMTP_FROM_NAME}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Sistema pronto para enviar emails de análise!

Cordialmente,
CRM Deals Manager
      `.trim()
    });
    
    console.log('\n✅ EMAIL ENVIADO COM SUCESSO!');
    console.log(`   Método: ${result.method}`);
    if (result.messageId) {
      console.log(`   Message ID: ${result.messageId}`);
    }
    console.log('\n📬 Verifique sua caixa de entrada:', process.env.SMTP_USER);
    
  } catch (error) {
    console.error('\n❌ ERRO AO ENVIAR EMAIL:');
    console.error(`   ${error.message}`);
    console.error('\n🔧 Possíveis soluções:');
    console.error('   1. Verifique se o SMTP_HOST está correto');
    console.error('   2. Verifique se o SMTP_PORT está correto (587 para STARTTLS)');
    console.error('   3. Verifique se o SMTP_USER e SMTP_PASS estão corretos');
    console.error('   4. Verifique se o servidor SMTP permite conexões externas');
    console.error('   5. Verifique se não há firewall bloqueando a porta 587');
    process.exit(1);
  }
}

testEmail();
