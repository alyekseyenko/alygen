import fetch from 'node-fetch';

async function simulateBookingWithReminder() {
  const webhookUrl = 'http://localhost:3001/api/webhooks/calendly';
  
  // Agendar para DAQUI A 16 MINUTOS
  // 16 min - 15 min (reminder) = 1 minuto de espera no log!
  const startTime = new Date(Date.now() + 16 * 60 * 1000).toISOString();

  const payload = {
    event: 'invitee.created',
    payload: {
      name: 'Cliente Lembrete Teste',
      email: process.env.TEST_RECIPIENT || process.env.ADMIN_EMAIL || 'test@exemplo.com',
      scheduled_event: {
        start_time: startTime,
        name: 'Sessão Estratégica Digital (30 min)'
      },
      questions_and_answers: [
        {
          question: 'Telefone/WhatsApp',
          answer: process.env.WHATSAPP_PHONE || '351900000000'
        }
      ]
    }
  };

  console.log(`🧪 Simulando agendamento para as ${new Date(startTime).toLocaleTimeString()}...`);
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
        console.log('✅ SINAL ENVIADO! Verifica o Telegram, ACEITA e aguarda 1 minuto pelo lembrete.');
    } else {
        console.log('❌ Erro no envio:', await response.text());
    }
  } catch (err) {
    console.error('❌ Erro de conexão:', err.message);
  }
}

simulateBookingWithReminder();
