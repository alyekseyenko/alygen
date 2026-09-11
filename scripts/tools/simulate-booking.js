import fetch from 'node-fetch';

async function simulateCalendlyBooking() {
  const webhookUrl = 'http://localhost:3001/api/webhooks/calendly';
  
  const payload = {
    event: 'invitee.created',
    payload: {
      name: 'Cliente Teste Alygen',
      email: process.env.TEST_RECIPIENT || process.env.ADMIN_EMAIL || 'test@exemplo.com',
      scheduled_event: {
        start_time: new Date(Date.now() + 86400000).toISOString(), // Amanhã
        name: 'Consultoria de Automação (30 min)'
      },
      questions_and_answers: [
        {
          question: 'Qual o seu contacto de WhatsApp?',
          answer: process.env.WHATSAPP_PHONE || '351900000000'
        }
      ]
    }
  };

  console.log('🧪 Simulando agendamento Calendly para o servidor local...');
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
        console.log('✅ SINAL ENVIADO! Verifica o teu Telegram AGORA.');
    } else {
        console.log('❌ Erro no envio:', await response.text());
    }
  } catch (err) {
    console.error('❌ Erro de conexão:', err.message);
  }
}

simulateCalendlyBooking();
