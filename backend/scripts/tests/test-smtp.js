import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testSMTP() {
  console.log('🧪 Testando configuração SMTP...\n');
  
  console.log('📋 Configurações:');
  console.log(`   Host: ${process.env.SMTP_HOST}`);
  console.log(`   Port: ${process.env.SMTP_PORT}`);
  console.log(`   User: ${process.env.SMTP_USER}`);
  console.log(`   Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NÃO CONFIGURADO'}`);
  console.log(`   From: ${process.env.SMTP_FROM_NAME}\n`);
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
    
    console.log('🔌 Verificando conexão...');
    await transporter.verify();
    console.log('✅ Conexão SMTP OK!\n');
    
    console.log('📧 Enviando email de teste...');
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: '🧪 Teste SMTP - CRM Deals Manager',
      text: 'Este é um email de teste do sistema CRM Deals Manager.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">🧪 Teste SMTP</h1>
            <p>Este é um email de teste do sistema <strong>CRM Deals Manager</strong>.</p>
            <p>Se você recebeu este email, significa que a configuração SMTP está funcionando corretamente!</p>
            <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 14px;">
              Enviado em: ${new Date().toLocaleString('pt-PT')}<br>
              Host: ${process.env.SMTP_HOST}<br>
              Porta: ${process.env.SMTP_PORT}
            </p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email enviado com sucesso!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Response: ${info.response}\n`);
    
    console.log('🎉 SMTP configurado corretamente!');
    
  } catch (error) {
    console.error('❌ Erro ao testar SMTP:', error.message);
    console.error('\n📝 Detalhes do erro:');
    console.error(error);
    
    console.log('\n💡 Possíveis soluções:');
    console.log('   1. Verifique se o SMTP_HOST está correto');
    console.log('   2. Verifique se a porta está correta (587 para STARTTLS, 465 para SSL)');
    console.log('   3. Verifique se o email e senha estão corretos');
    console.log('   4. Para Gmail, use "App Password" ao invés da senha normal');
    console.log('   5. Verifique se o firewall não está bloqueando a porta');
  }
}

testSMTP();
