import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname2 = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

let bot = null;
export const getBotStatus = () => bot ? 'Initialized' : 'NULL';

export function initTelegramBot(options = { polling: true }) {
    let token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) token = token.replace(/[\"']/g, ''); // Limpa aspas extra

    if (!token) {
        console.warn('⚠️ TELEGRAM_BOT_TOKEN ausente. Aprovação Humana desativada.');
        return;
    }
    
    bot = new TelegramBot(token, options);
    console.log('🤖 Telegram Bot inicializado. Pronto para Aprovação Humana.');

    // Captura qualquer mensagem para descobrirmos rapidamente o ID do utilizador
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        console.log(`\n\n🎯 NOVO CHAT ID DESCOBERTO: ${chatId}\nColoca isto no teu .env em TELEGRAM_CHAT_ID="${chatId}"\n\n`);
        bot.sendMessage(chatId, `O teu Chat ID é: ${chatId}\nCopia este número e cola noficheiro .env!`);
    });

    bot.on('callback_query', async (callbackQuery) => {
        const action = callbackQuery.data; // ex: 'approve_LOGID' ou 'reject_LOGID'
        const msg = callbackQuery.message;
        const chatId = msg.chat.id;

        if (action.startsWith('calapprove_') || action.startsWith('calreject_')) {
            const parts = action.split('_');
            const decision = parts[0] === 'calapprove' ? 'approve' : 'reject';
            const logId = parts.slice(1).join('_');
            
            bot.answerCallbackQuery(callbackQuery.id);

            const { data: log, error } = await supabase.from('automation_logs').select('*').eq('id', logId).single();
            if (!log || error || log.status !== 'pending_approval') {
                bot.sendMessage(chatId, '❌ Registro não encontrado ou já processado.');
                return;
            }

            const { processCalendlyDecision } = await import('./calendly-service.js');
            await processCalendlyDecision(decision, log.details);
            
            await supabase.from('automation_logs').update({ status: decision === 'approve' ? 'approved' : 'rejected' }).eq('id', logId);
            
            const emoji = decision === 'approve' ? '✅' : '🛑';
            const label = decision === 'approve' ? 'Aceite' : 'Recusado';
            bot.sendMessage(chatId, `${emoji} Calendly: Reunião ${label} para ${log.details.name}. Cliente notificado.`);
            bot.editMessageText(msg.text + `\n\n*(${emoji} ${label})*`, { chat_id: chatId, message_id: msg.message_id });
            return;
        }

        if (action.startsWith('approve_') || action.startsWith('reject_') || action.startsWith('seqapprove_') || action.startsWith('seqcancel_')) {

            const parts = action.split('_');
            const type = parts[0];
            const logId = parts.slice(1).join('_'); // Recorta para remontar o UUID
            
            bot.answerCallbackQuery(callbackQuery.id);

            // Fetch from automation_logs
            const { data: log, error } = await supabase
                .from('automation_logs')
                .select('*')
                .eq('id', logId)
                .single();

            if (!log || error) {
                bot.sendMessage(chatId, '❌ Lead não encontrado, expirou ou já processado.');
                return;
            }

            if (log.status !== 'pending_approval') {
                bot.sendMessage(chatId, `⚠️ Esta aprovação já foi decidida anteriormente (${log.status}).`);
                return;
            }

            // --- Lógica para Sequências (D3/D7) ---
            if (type === 'seqapprove' || type === 'seqcancel') {
                const { sequenceId, day } = log.details;
                const { cancelSequence } = await import('./email-sequences.js');

                if (type === 'seqcancel') {
                    await cancelSequence(sequenceId);
                    await supabase.from('automation_logs').update({ status: 'rejected' }).eq('id', logId);
                    bot.sendMessage(chatId, `🛑 Sequência CANCELADA para ${log.details.leadName}. Bloqueado D3 e D7.`);
                    bot.editMessageText(msg.text + '\n\n*(🛑 Cancelada - Já Respondeu)*', { chat_id: chatId, message_id: msg.message_id });
                    return;
                }

                bot.sendMessage(chatId, `✅ Aceite! A enviar Follow-up D${day} para ${log.details.leadName}...`);
                
                try {
                    const { sendFollowup1, sendFollowup2 } = await import('./followup-templates.js');
                    const { updateSequenceStatus } = await import('./email-sequences.js');
                    
                    if (day === 3) {
                        await sendFollowup1(log.details.sequence);
                        await updateSequenceStatus(sequenceId, 'followup1', 'followup1_sent_at');
                    } else {
                        await sendFollowup2(log.details.sequence);
                        await updateSequenceStatus(sequenceId, 'followup2', 'followup2_sent_at');
                    }

                    await supabase.from('automation_logs').update({ status: 'approved' }).eq('id', logId);
                    bot.sendMessage(chatId, `🚀 Follow-up D${day} enviado com sucesso!`);
                    bot.editMessageText(msg.text + `\n\n*(✅ D${day} Enviado)*`, { chat_id: chatId, message_id: msg.message_id });
                } catch (e) {
                    bot.sendMessage(chatId, `❌ Erro ao enviar follow-up: ${e.message}`);
                }
                return;
            }

            if (type === 'approve') {
                bot.sendMessage(chatId, `✅ Aceite! A enviar email para ${log.details.lead.name}...`);
                
                // Extrair payload armazenado no log
                const { lead, analysis, payload } = log.details;
                const { config, recipient, customSubject, customBody } = payload;

                // Importa métodos de email
                const { sendEmail } = await import('./email.js');
                
                // Tenta gerar PDF
                const attachments = [];
                if (config?.attach_pdf) {
                    try {
                        bot.sendMessage(chatId, '📄 A gerar relatório PDF...');
                        const { generatePDFReport } = await import('./pdf-generator-advanced.js');
                        const pdfBuffer = await generatePDFReport(analysis, lead);
                        if (pdfBuffer) {
                            const clientName = (lead.name || 'Relatorio').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 40);
                            attachments.push({
                                filename: `Relatorio_Alygen_${clientName}.pdf`,
                                content: pdfBuffer,
                                contentType: 'application/pdf'
                            });
                        }
                    } catch (e) {
                        console.warn('Erro ao gerar PDF pelo bot:', e.message);
                    }
                }

                // Tenta apanhar imagem arte
                if (config?.attach_image !== false) {
                    try {
                        const screenshotsDir = path.join(__dirname2, '../..', 'screenshots');
                        if (fs.existsSync(screenshotsDir)) {
                            const files = fs.readdirSync(screenshotsDir)
                                .filter(f => f.startsWith(`blob-${lead.id}`) && f.endsWith('.png'))
                                .map(f => ({ file: f, time: parseInt(f.match(/-(\d+)\.png$/)?.[1] || '0') }))
                                .sort((a, b) => b.time - a.time);

                            if (files.length > 0) {
                                const latestBlob = path.join(screenshotsDir, files[0].file);
                                attachments.push({
                                    filename: `Analise_${(lead.name).substring(0, 30)}.png`,
                                    path: latestBlob,
                                    contentType: 'image/png'
                                });
                            }
                        }
                    } catch (e) {
                         console.warn('Erro ao apanhar imagem pelo bot:', e.message);
                    }
                }

                try {
                     await sendEmail({
                         leadId: lead.id,
                         leadName: lead.name,
                         recipient: recipient,
                         cc: config?.cc || null,
                         analysis: analysis,
                         leadData: lead,
                         customSubject,
                         customBody,
                         attachments
                     });
                     
                     // Marcar como aprovado no log e atualizar Supabase
                     await supabase.from('automation_logs').update({ status: 'approved' }).eq('id', logId);
                     if (lead.website) {
                         const { updateLeadEmail } = await import('./supabase-service.js');
                         await updateLeadEmail(lead.website, recipient);
                     }
                     bot.sendMessage(chatId, `🚀 Email enviado ao cliente com sucesso!`);
                     
                     // Editar a mensagem original para retirar os botões
                     bot.editMessageText(msg.text + '\n\n*(✅ Aprovado)*', { 
                         chat_id: chatId, 
                         message_id: msg.message_id 
                     });

                } catch(e) {
                     bot.sendMessage(chatId, `❌ Erro ao enviar email: ${e.message}`);
                }
            } else {
                bot.sendMessage(chatId, `🛑 Rejeitado! Email bloqueado para ${log.details.lead.name}.`);
                await supabase.from('automation_logs').update({ status: 'rejected' }).eq('id', logId);
                
                // Editar a mensagem original
                bot.editMessageText(msg.text + '\n\n*(❌ Rejeitado)*', { 
                    chat_id: chatId, 
                    message_id: msg.message_id 
                });
            }
        }
    });
}

export async function requestTelegramApproval(lead, analysis, config, recipient, customSubject, customBody, automationId) {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!bot || !chatId) {
        console.warn(`⚠️ Telegram Approval ignorado: Faltam bot=${!!bot} ou chatId=${!!chatId}`);
        return { success: false };
    }

    try {
        console.log(`📡 [TelegramService] Iniciando pedido de aprovação para ${lead.name}...`);
        // Criar registo de log primeiro para ter o uuid de tracking
        const { data: insertedLog, error } = await supabase.from('automation_logs').insert([{
            automation_id: automationId || null, 
            lead_id: lead.id,
            status: 'pending_approval',
            details: {
                message: 'Aguardando aprovação humana via Telegram',
                leadName: lead.name,
                leadWebsite: analysis.website,
                lead: lead,
                analysis: analysis,
                payload: {
                    config,
                    recipient,
                    customSubject,
                    customBody
                }
            }
        }]).select('id').single();

        if (error || !insertedLog) throw new Error(error?.message || 'Erro ao criar log de aprovação');

        const logId = insertedLog.id;

        // Limitar pitch para não explodir a msg
        const pitchPreview = (customBody || '').replace(/<[^>]+>/g, '').substring(0, 200) + '...';

        const pitchStr = `🚦 *Novo Lead a aguardar envio de Email!* \n\n` +
                         `*Empresa:* ${lead.name || 'Desconhecido'}\n` +
                         `*Website:* ${analysis.website || 'Sem site'}\n` +
                         `*Email:* ${recipient}\n` +
                         `*Q-Score:* ${analysis.overallScore || 'N/A'}\n\n` +
                         `*Resumo do Pitch:* \n_${pitchPreview}_\n\n` +
                         `Queres que o Pilot envie o Email (e os PDFs) agora? 👇`;

        const opts = {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Sim, Enviar', callback_data: `approve_${logId}` },
                        { text: '❌ Rejeitar', callback_data: `reject_${logId}` }
                    ]
                ]
            }
        };

        const sent = await bot.sendMessage(chatId, pitchStr, opts);
        console.log(`📡 [TelegramService] Mensagem enviada! Resposta Bot: ${sent ? 'OK' : 'FAIL'}`);
        console.log(`📡 Pedido de aprovação do Telegram enviado para a lead ${lead.name}`);
        return { success: true };
    } catch(e) {
        console.error('❌ Erro a notificar Telegram:', e.message);
        return { success: false, error: e.message };
    }
}
export async function requestSequenceApproval(sequence, day) {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!bot || !chatId) return { success: false };

    try {
        const { data: insertedLog, error } = await supabase.from('automation_logs').insert([{
            automation_id: null, // Deixar null para evitar erro de Foreign Key
            lead_id: sequence.lead_id,
            status: 'pending_approval',
            details: {
                message: `Aprovação de Follow-up D${day}`,
                leadName: sequence.lead_name,
                sequenceId: sequence.id,
                sequence: sequence,
                day: day
            }
        }]).select('id').single();

        if (error) throw error;

        const logId = insertedLog.id;
        const msg = `📬 *Follow-up D${day} Pendente* \n\n` +
                    `*Cliente:* ${sequence.lead_name}\n` +
                    `*Email:* ${sequence.email}\n` +
                    `*Site:* ${sequence.website || 'N/A'}\n\n` +
                    `Este cliente ainda não respondeu. Queres enviar o lembrete de Dia ${day}?`;

        const opts = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: `✅ Sim, Enviar D${day}`, callback_data: `seqapprove_${logId}` },
                        { text: '🛑 Já respondeu (Parar)', callback_data: `seqcancel_${logId}` }
                    ]
                ]
            }
        };

        await bot.sendMessage(chatId, msg, opts);
        return { success: true };
    } catch (e) {
        console.error('Erro ao pedir aprovação de sequência:', e.message);
        return { success: false };
    }
}
export async function sendTelegramWithApproval(message, config) {
    const rawChatId = process.env.TELEGRAM_CHAT_ID || "1144207159";
    const chatId = rawChatId.replace(/[\"']/g, '');
    
    if (!bot || !chatId) {
        console.error('❌ Bot ou ChatID não inicializado no sendTelegramWithApproval');
        return { success: false };
    }

    try {
        console.log('📡 [VIA SEGURA] Enviando para Telegram ANTES da DB...');
        
        // 1. Tentar gravar na DB para ter o logId (Opcional se falhar)
        let logId = 'manual_' + Date.now();
        try {
            const { data: insertedLog } = await supabase.from('automation_logs').insert([{
                status: 'pending_approval',
                details: config.payload
            }]).select('id').single();
            if (insertedLog) logId = insertedLog.id;
        } catch (dbErr) {
            console.warn('⚠️ Falha ao gravar log na DB, mas prosseguindo com Telegram...');
        }

        const opts = {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Aceitar Reunião', callback_data: `calapprove_${logId}` },
                        { text: '❌ Recusar/Reagendar', callback_data: `calreject_${logId}` }
                    ]
                ]
            }
        };

        const sent = await bot.sendMessage(chatId, message, opts);
        console.log('✅ Mensagem enviada com sucesso! ID:', sent.message_id);
        return { success: true };
    } catch (e) {
        console.error('❌ Erro FATAL ao enviar Telegram:', e.message);
        return { success: false };
    }
}

/**
 * Agenda um lembrete para disparar num horário específico
 */
export async function scheduleReminder(message, reminderTime) {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!bot || !chatId) return;

    const delay = reminderTime.getTime() - Date.now();
    
    if (delay > 0) {
        console.log(`⏰ Lembrete agendado para daqui a ${Math.round(delay/1000/60)} minutos.`);
        setTimeout(() => {
            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            console.log('🔔 Lembrete enviado ao Telegram!');
        }, delay);
    } else {
        // Se já passou o tempo (ex: reunião é daqui a 5 min), envia agora
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
}

