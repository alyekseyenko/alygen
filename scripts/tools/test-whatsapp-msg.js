import { sendWhatsApp, initWhatsApp } from './backend/services/whatsapp.js';
import dotenv from 'dotenv';
dotenv.config();

async function testWhatsAppMessage() {
  const myTestPhone = process.env.WHATSAPP_PHONE || '351000000000'; // O teu número ou número de teste
  const leadName = 'Lead Exemplo - Teste Calendy';
  const calendly = process.env.CALENDLY_URL || 'https://calendly.com/alygen/30min';
  const senderName = process.env.SENDER_NAME || 'Consultor Alygen';
  const companyName = process.env.COMPANY_NAME || 'Alygen';
  
  const message = `Olá! Sou o ${senderName} da ${companyName}.\n\nAnalisei o website da *${leadName}*.\n\nEnviei-lhe um relatório detalhado por email com os resultados. Já pode marcar uma conversa connosco diretamente aqui:\n\n📅 *Agendar reunião:* ${calendly}\n\nCumprimentos,\n${senderName} — ${companyName}`;

  console.log('📱 A ligar ao teu WhatsApp local...');
  await initWhatsApp();

  // Aguardar um pouco para garantir a conexão
  console.log('⏳ A aguardar conexão (6 segundos)...');
  await new Promise(r => setTimeout(r, 6000));

  try {
    console.log(`📤 A enviar mensagem para ${myTestPhone}...`);
    await sendWhatsApp(myTestPhone, message, leadName, 'alygen.pt');
    console.log('✅ SUCESSO! Mensagem de teste enviada. Abre o teu WhatsApp!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erro no teste WhatsApp:', err.message);
    process.exit(1);
  }
}

testWhatsAppMessage();
