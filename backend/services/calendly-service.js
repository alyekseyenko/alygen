import { sendWhatsApp } from './whatsapp.js';
import { sendEmail } from './email.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Processo Direto e Infalível (Como era antes de complicarmos com o motor visual)
 */
export async function handleCalendlyBooking(payload) {
    const { name, email, questions_and_answers, scheduled_event } = payload;
    const startTime = new Date(scheduled_event.start_time).toLocaleString('pt-PT');
    const location = scheduled_event.location?.join_url || scheduled_event.location?.location || 'Google Meet (Link no convite)';
    
    console.log(`📡 [VIA RÁPIDA] Processando reserva de: ${name} para ${startTime}`);

    const message = `
📅 **NOVO AGENDAMENTO CALENDLY**
👤 **Cliente:** ${name}
📧 **Email:** ${email}
⏰ **Horário:** ${startTime}
🔗 **Tipo:** ${scheduled_event.name}

Como deseja proceder com esta reunião?
    `.trim();

    const { sendTelegramWithApproval } = await import('./telegram-service.js');
    await sendTelegramWithApproval(message, {
        type: 'calendly_approval',
        payload: { name, email, time: startTime, originalPayload: payload, location }
    });
}

/**
 * Processa a decisão do Telegram usando os novos templates de luxo
 */
export async function processCalendlyDecision(decision, data) {
    const { name, email, time, location } = data;
    const eventName = data.originalPayload?.scheduled_event?.name || 'Mentoria Estratégica';

    try {
        const { generateMeetingConfirmationEmail } = await import('./email-template.js');
        
        if (decision === 'approve') {
            console.log(`✅ Aprovado: Enviando confirmação premium para ${name} (${email})`);
            const { subject, html } = await generateMeetingConfirmationEmail({ name, time, eventName, location });
            await sendEmail({ recipient: email, customSubject: subject, emailBody: html, analysis: {}, leadData: { name }, isHtmlOnly: true });
            console.log(`📧 Email de confirmação enviado para ${email}`);

            // Extrair contacto telefónico do Calendly se existir
            const qna = data.originalPayload?.questions_and_answers || [];
            let phone = null;
            
            // Procurar nas perguntas por algo relacionado com telefone, telemóvel, whatsapp etc
            for (const q of qna) {
                if (q.question.toLowerCase().includes('telefone') || 
                    q.question.toLowerCase().includes('telemóvel') || 
                    q.question.toLowerCase().includes('whatsapp') ||
                    q.question.toLowerCase().includes('phone')) {
                    phone = q.answer;
                    break;
                }
            }
            
            // Tentar extrair do tracking origin se não encontrou nas QnA
            if (!phone && data.originalPayload?.tracking?.utm_term) {
                // As vezes passam no UTM
            }

            // Tentar formatar e enviar WhatsApp
            if (phone) {
                try {
                    const waMessage = `Olá ${name}! 🎉\n\nA tua reunião "${eventName}" foi confirmada para ${time}.\n\nFicamos à tua espera! Link: ${location || 'No convite de email'}\n\nSe precisares de reagendar, avisa-nos por aqui.`;
                    const waResult = await sendWhatsApp(phone, waMessage, name);
                    console.log(`📱 Notificação WhatsApp enviada para ${phone}`);
                } catch (waErr) {
                    console.warn(`⚠️ Não foi possível enviar WhatsApp para ${phone}: ${waErr.message}`);
                }
            } else {
                console.log(`ℹ️ Nenhum número de telefone encontrado para WhatsApp de ${name}. Perguntas disponíveis:`, qna.map(q => q.question));
            }

        } else {
            console.log(`❌ Recusado: Enviando proposta de reagendamento para ${name} (${email})`);
            const { subject, html } = await generateMeetingConfirmationEmail({ name, time, eventName }, true);
            await sendEmail({ recipient: email, customSubject: subject, emailBody: html, analysis: {}, leadData: { name }, isHtmlOnly: true });
            console.log(`📧 Email de reagendamento enviado para ${email}`);
        }
    } catch (err) {
        console.error('❌ Erro ao processar decisão Calendly:', err.message);
    }
}
