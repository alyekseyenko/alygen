// Estratégia de Ações Modular do Motor de Automações
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export async function executeAction(node, context, isDryRun, automation, renderTemplate) {
    const { lead, analysis } = context;
    // Tentar importar de handlers modulares novos primeiro
    try {
        const { ActionRegistry } = await import('./action-handlers.js');
        if (ActionRegistry[node.actionType]) {
            return await ActionRegistry[node.actionType]({ node, context, isDryRun, automation, renderTemplate });
        }
    } catch (e) {
        console.warn('ActionRegistry fallback:', e.message);
    }

            if (node.actionType === 'send_email') {
                const recipient = lead.email || analysis?.extractedEmails?.[0];
                try {
                    if (!recipient) {
                        console.log('⚠️ Ação ignorada: Nenhum email disponível para envio.');
                        return { status: 'stop', message: 'Nenhum email disponível' };
                    }

                    // --- CHECK EXTRA ANTI-SPAM (DUPLICADO RECENTE) ---
                    const { listSequences } = await import('../email-sequences.js');
                    const recentSeq = await listSequences({ q: recipient || analysis?.website });
                    if (recentSeq.success && recentSeq.data?.some(s => s.status === 'sent' || s.status === 'followup1' || s.status === 'followup2' || s.status === 'waiting_approval_d3' || s.status === 'waiting_approval_d7')) {
                        console.log(`🚫 [Check Anti-Spam] Bloqueando envio duplicado para ${recipient}. Já existe uma sequência ativa.`);
                        return { status: 'stop', message: 'Sequência já ativa para este email' };
                    }

                    console.log(`📧 Ação: Enviando email para ${recipient}`);


                    let customSubject = null;
                    let customBody = null;

                    if (node.config?.template_id === 'alygen_standard') {
                        console.log('📄 Usando template padrão Alygen (Inteligente)');
                        try {
                            const { fetchLeads } = await import('../sheets.js');
                            const { generateEmailTemplate } = await import('../email-template.js');
                            const leadsData = await fetchLeads();
                            const allLeads = leadsData.leads || [];
                            const standard = await generateEmailTemplate(analysis, lead, allLeads);
                            customSubject = standard.subject;
                            customBody = standard.html;
                        } catch (tmplErr) {
                            console.error('❌ Erro ao gerar template padrão:', tmplErr.message);
                        }
                    } else if (node.config?.template_id === 'alygen_followup_1' || node.config?.template_id === 'alygen_followup_2') {
                        console.log(`📄 Usando template de Follow-up nativo: ${node.config.template_id}`);
                        const { generateFollowup1Html, generateFollowup2Html } = await import('../followup-templates.js');
                        
                        const fakeSeq = {
                            id: lead.id,
                            lead_name: lead.name || lead.company_name || 'Empresa',
                            website: analysis?.website || lead.website || '',
                            template: analysis?.category?.toLowerCase()?.includes('sem site') || (analysis?.seo?.score || 100) < 50 ? 'nowebsite' : 'standard'
                        };

                        if (node.config.template_id === 'alygen_followup_1') {
                            customSubject = fakeSeq.template === 'nowebsite'
                                ? `${fakeSeq.lead_name} — conseguiu ver a análise (novo website)?`
                                : `${fakeSeq.lead_name} — ficou com alguma dúvida sobre a análise?`;
                            customBody = await generateFollowup1Html(fakeSeq);
                        } else {
                            customSubject = fakeSeq.template === 'nowebsite'
                                ? `${fakeSeq.lead_name} — vou fechar o dossier (novo website)`
                                : `${fakeSeq.lead_name} — vou fechar o dossier esta semana`;
                            customBody = await generateFollowup2Html(fakeSeq);
                        }
                        
                    } else if (node.config?.template_id) {
                        const { getEmailTemplates } = await import('../supabase-service.js');
                        const templates = await getEmailTemplates();
                        const tmpl = templates.data?.find(t => t.id === node.config.template_id);
                        if (tmpl) {
                            console.log(`📄 Usando template customizado: ${tmpl.name}`);
                            customSubject = await renderTemplate(tmpl.subject, context);
                            customBody = await renderTemplate(tmpl.body_html, context);
                        }
                    }

                    if (isDryRun) {
                        console.log(`🧪 (DRY RUN) Email simulado com sucesso. Temp ID: ${node.config?.template_id || 'DEFAULT'}`);
                    } else if (node.config?.require_approval) {
                        console.log(`🚦 Ação pausada: Aguardando aprovação humana via Telegram para ${lead.name}`);
                        const { requestTelegramApproval } = await import('../telegram-service.js');
                        await requestTelegramApproval(lead, analysis, node.config, recipient, customSubject, customBody, automation.id);
                        context.email_success = true; // Assumimos true para não falhar a validação do dry run
                        return { status: 'stop', message: 'Aguardando aprovação humana no Telegram' };
                    } else {
                        // --- Preparar Anexos (PDF + Imagem Arte) ---
                        const attachments = [];

                        // 1. Gerar PDF se configurado
                        if (node.config?.attach_pdf) {
                            try {
                                console.log('📄 Gerando relatório PDF para anexo...');
                                
                                // PRIORIDADE 2026: Motor Python (Ultra rápido e profissional)
                                let pdfBuffer;
                                try {
                                    const { generateStrategicPDF } = await import('../python-bridge.js');
                                    const { generateEmailTemplate } = await import('../email-template.js');
                                    
                                    // Gerar o HTML base (podemos reutilizar o template do email ou um específico)
                                    const { fetchLeads } = await import('../sheets.js');
                                    const leadsData = await fetchLeads();
                                    const template = await generateEmailTemplate(analysis, lead, leadsData.leads || []);
                                    
                                    pdfBuffer = await generateStrategicPDF(template.html, `Relatorio_Alygen_${lead.id}.pdf`);
                                    console.log('✅ PDF gerado via Motor Python (3002).');
                                } catch (pyErr) {
                                    console.warn('⚠️ Motor Python falhou ou offline, tentando fallback Node.js:', pyErr.message);
                                    const { generatePDFReport } = await import('../pdf-generator-advanced.js');
                                    pdfBuffer = await generatePDFReport(analysis, lead);
                                    console.log('✅ PDF gerado via Fallback Node.js (Puppeteer).');
                                }

                                if (pdfBuffer) {
                                    const clientName = (lead.name || 'Relatorio').replace(/[^a-zA-Z0-9\s]/g, '').trim().substring(0, 40);
                                    attachments.push({
                                        filename: `Relatorio_Alygen_${clientName}.pdf`,
                                        content: pdfBuffer,
                                        contentType: 'application/pdf'
                                    });
                                }
                            } catch (pdfErr) {
                                console.warn('❌ Falha total na geração de PDF:', pdfErr.message);
                            }
                        }

                        // 2. Encontrar imagem "Mockup" do lead (mockup-ID-timestamp.png)
                        if (node.config?.attach_image !== false) { // ligado por padrão
                            try {
                                const fs = await import('fs');
                                const path = await import('path');
                                const { fileURLToPath } = await import('url');
                                const __dirname2 = path.dirname(fileURLToPath(import.meta.url));
                                const screenshotsDir = path.join(__dirname2, '../..', 'screenshots');

                                if (fs.existsSync(screenshotsDir)) {
                                    // Tentar encontrar o MOCKUP gerado para este lead
                                    const files = fs.readdirSync(screenshotsDir)
                                        .filter(f => (f.includes(`multi-mockup-branded-v2-${lead.id}`) || f.includes(lead.id)) && f.endsWith('.png'))
                                        .map(f => ({ file: f, time: fs.statSync(path.join(screenshotsDir, f)).mtimeMs }))
                                        .sort((a, b) => b.time - a.time); // mais recente primeiro

                                    if (files.length > 0) {
                                        const latestMockup = path.join(screenshotsDir, files[0].file);
                                        const safeName = (lead.name || 'Analise').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
                                        attachments.push({
                                            filename: `Mockup_${safeName}.png`,
                                            path: latestMockup,
                                            contentType: 'image/png'
                                        });
                                        console.log(`🖼️ Mockup iPhone adicionado como anexo: ${files[0].file}`);
                                    } else {
                                        console.log(`ℹ️ Nenhum mockup encontrado para o lead ${lead.id} em ${screenshotsDir}. Tentando prints genéricos...`);
                                        // Fallback para qualquer print do site
                                        const fallbackFiles = fs.readdirSync(screenshotsDir)
                                            .filter(f => f.endsWith('.png') || f.endsWith('.jpg'))
                                            .map(f => ({ file: f, time: fs.statSync(path.join(screenshotsDir, f)).mtimeMs }))
                                            .sort((a, b) => b.time - a.time);
                                        if (fallbackFiles.length > 0) {
                                            attachments.push({
                                                filename: `Visual_${lead.id}.png`,
                                                path: path.join(screenshotsDir, fallbackFiles[0].file),
                                                contentType: 'image/png'
                                            });
                                        }
                                    }
                                }
                            } catch (imgErr) {
                                console.warn('⚠️ Erro ao encontrar imagem (não crítico):', imgErr.message);
                            }
                        }

                        // Import dynamically to avoid circular issues
                        const { sendEmail } = await import('../email.js');
                        await sendEmail({
                            leadId: lead.id,
                            leadName: lead.name,
                            recipient: recipient,
                            cc: node.config?.cc || null,
                            analysis: analysis,
                            leadData: lead,
                            customSubject: customSubject,
                            customBody: customBody,
                            attachments
                        });
                        context.email_success = true;

                        // Persistir o email na análise se foi bem sucedido
                        if (recipient && analysis?.website) {
                            try {
                                const { updateLeadEmail } = await import('../supabase-service.js');
                                await updateLeadEmail(analysis.website, recipient);
                                console.log(`✅ Email ${recipient} persistido na análise do lead.`);
                            } catch (error) {
                                console.warn('⚠️ Erro ao persistir email (não crítico):', error.message);
                            }
                        }
                    }
                    return { status: 'continue' };
                } catch (e) {
                    return { status: 'error', message: `Email failed: ${e.message}` };
                }
            }
            
            if (node.actionType === 'trigger_next_lead') {
                console.log(`🔄 [Autopilot] Ação disparada: Procurando próximo lead...`);
                try {
                    const { fetchLeads } = await import('../sheets.js');
                    const { getAllAnalysesMeta } = await import('../supabase-service.js');
                    const analysisQueue = (await import('../../analysis-queue.js')).default;
                    
                    // 1. Get all leads from Sheets
                    const sheetData = await fetchLeads();
                    const allLeads = sheetData.leads || [];
                    
                    // 2. Get already analyzed websites from Supabase
                    const { data: analyses } = await getAllAnalysesMeta(2000);
                    const analyzedWebsites = new Set((analyses || []).map(a => {
                        if (!a.website) return '';
                        return a.website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
                    }));

                    // 3. Find first lead that is NOT analyzed
                    const nextLead = allLeads.find(l => {
                        if (!l.website) return false;
                        const normUrl = l.website.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
                        return !analyzedWebsites.has(normUrl);
                    });

                    if (nextLead) {
                        console.log(`✅ [Autopilot] Próximo lead encontrado: ${nextLead.name} (${nextLead.website}). Adicionando à fila.`);
                        analysisQueue.add(nextLead);
                        return { status: 'continue', message: `Agendado: ${nextLead.name}` };
                    } else {
                        console.log('🏁 [Autopilot] Ciclo concluído: Não há mais leads pendentes nas Google Sheets.');
                        return { status: 'continue', message: 'Sem mais leads para processar' };
                    }
                } catch (err) {
                    console.error('❌ [Autopilot] Erro ao disparar próximo lead:', err.message);
                }
                return { status: 'continue' };
            }
            
            if (node.actionType === 'update_lead') {
                console.log(`📝 Ação: Atualizando lead ${lead.id}`);
                try {
                    const { field, value } = node.config;
                    if (isDryRun) {
                        console.log(`🧪 (DRY RUN) Sucesso fingindo atualizar ${field} -> ${value}`);
                    } else {
                        await supabase.from('leads').update({ [field]: value }).eq('id', lead.id);
                    }
                    return { status: 'continue' };
                } catch (e) {
                    return { status: 'error', message: `Update failed: ${e.message}` };
                }
            }

            if (node.actionType === 'webhook') {
                console.log(`🔗 Ação: Disparando webhook para ${node.config.url}`);
                try {
                    if (isDryRun) {
                         console.log(`🧪 (DRY RUN) Webhook POST simulado para ${node.config.url}`);
                    } else {
                        await fetch(node.config.url, {
                            method: node.config.method || 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                event: 'automation_triggered',
                                lead,
                                analysis,
                                timestamp: new Date().toISOString()
                            })
                        });
                    }
                    return { status: 'continue' };
                } catch (e) {
                    return { status: 'error', message: `Webhook failed: ${e.message}` };
                }
            }

            if (node.actionType === 'whatsapp') {
                const phone = lead.phone || analysis?.extractedPhones?.[0];
                try {
                    if (!phone) {
                        console.log('⚠️ Ação ignorada: Nenhum telefone disponível para WhatsApp.');
                        return { status: 'stop', message: 'Nenhum contato WhatsApp disponível' };
                    }
                    console.log(`📱 Ação: Enviando WhatsApp para ${phone}`);
                    
                    let message = '';
                    if (node.config?.use_standard) {
                        console.log('📄 Usando mensagem padrão Alygen (Profissional Sync)');
                        const clientName = lead.name || 'Exmo(a). Sr(a).';
                        const reportUrl = await renderTemplate('{{analysis.reportUrl}}', context);
                        
                        if (analysis.isSocialMediaOnly || analysis.category === 'SEM_SITE') {
                            const platform = analysis.socialMediaInfo?.platform || 'rede social';
                            const senderName = process.env.SENDER_NAME || 'Consultor Alygen';
                            const companyName = process.env.COMPANY_NAME || 'Alygen';
                            message = `Olá! Sou o ${senderName} da ${companyName}.\n\nVi que a vossa empresa está presente no ${platform}. Enquanto escrevo este email, potenciais clientes estão no Google a encontrar os vossos concorrentes.\n\nPodemos ajudar a criar um website profissional? Espreite o que poderíamos fazer: ${reportUrl}`;
                        } else if (lead.alreadyEmailed) {
                            const senderName = process.env.SENDER_NAME || 'Consultor Alygen';
                            const companyName = process.env.COMPANY_NAME || 'Alygen';
                            message = `Olá! Sou o ${senderName} da ${companyName}.\n\nEnviei um email para a *${clientName}* com um relatório detalhado do vosso website.\n\nJá tiveram oportunidade de ver? Se tiverem dúvidas, estamos à disposição.\n\nCumprimentos,\n${senderName} — ${companyName}`;
                        } else {
                            const perf = analysis?.performanceMobile;
                            const seo = analysis?.seo?.score;
                            const hasPixel = analysis?.pixelDetails?.facebook || analysis?.pixelDetails?.ga4;
                            
                            const issues = [];
                            if (perf !== undefined && perf < 50) issues.push(`• Performance Mobile: ${perf}/100`);
                            if (seo !== undefined && seo < 50) issues.push(`• SEO fraco — baixa visibilidade no Google`);
                            if (!hasPixel) issues.push(`• Não há pixel de conversão (Meta/GA4)`);

                            const issuesText = issues.length > 0 ? `\n\nEncontrei alguns problemas:\n${issues.join('\n')}` : '';
                            const calendly = process.env.CALENDLY_URL || 'https://calendly.com/alygen/30min';
                            const senderName = process.env.SENDER_NAME || 'Consultor Alygen';
                            const companyName = process.env.COMPANY_NAME || 'Alygen';
                            message = `Olá! Sou o ${senderName} da ${companyName}.\n\nAnalisei o website da *${clientName}*.${issuesText}\n\nEnviei-lhe um relatório detalhado por email. Já pode marcar uma conversa connosco aqui:\n📅 *Agendar reunião:* ${calendly}\n\nCumprimentos,\n${senderName} — ${companyName}`;
                        }
                    } else {
                        message = await renderTemplate(node.config?.message || '', context);
                    }
                    
                    if (isDryRun) {
                        console.log(`🧪 (DRY RUN) WhatsApp simulado para ${phone}: "${message.substring(0, 50)}..."`);
                    } else {
                        const { sendWhatsApp } = await import('../whatsapp-service.js');
                        await sendWhatsApp(phone, message, lead.name, analysis.website);
                        context.whatsapp_success = true;
                    }
                    return { status: 'continue' };
                } catch (e) {
                    if (e.message.includes('não está registado')) {
                        console.log(`⚠️ Ignorado: ${e.message}`);
                        return { status: 'stop', message: e.message };
                    }
                    return { status: 'error', message: `WhatsApp failed: ${e.message}` };
                }
            }

            if (node.actionType === 'notify_admin') {
                const recipient = node.config?.email || process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@alygen.com';
                console.log(`🔔 Ação: Notificando administrador (${recipient})`);
                try {
                    const subject = `🚀 CRM: Automação Concluída - ${lead.name}`;
                    const stepsSummary = context.steps.map(s => `• ${s.label || s.type}: ${s.status}${s.message ? ' (' + s.message + ')' : ''}`).join('\n');
                    
                    const body = `
Olá! A automação "${automation.name || 'CRM Flow'}" foi concluída para o lead:

NOME: ${lead.name}
SITE: ${lead.website}
SCORE: ${analysis.overallScore || 0}
STATUS: ${lead.status || 'Potencial'}

PASSOSS EXECUTADOS:
${stepsSummary}

---
CRM Deals Manager - Automação em tempo real
                    `.trim();

                    if (isDryRun) {
                        console.log(`🧪 (DRY RUN) Notificação admin simulada para ${recipient}`);
                    } else {
                        // Import dinamicamente para evitar problemas
                        const { sendEmail } = await import('../email.js');
                        await sendEmail({
                            leadId: lead.id,
                            leadName: lead.name,
                            recipient: recipient,
                            analysis: analysis,
                            leadData: lead,
                            customSubject: subject,
                            customBody: body
                        });
                    }
                    return { status: 'continue' };
                } catch (e) {
                    return { status: 'error', message: `Admin notification failed: ${e.message}` };
                }
            }

            if (node.actionType === 'google_sheets') {
                const sheetId = node.config?.spreadsheetId || process.env.GOOGLE_SHEET_ID;
                const sheetName = node.config?.sheetName || 'Results';
                const mapping = node.config?.mapping || {};
                
                console.log(`📊 Ação: Google Sheets (${sheetName})`);
                
                try {
                    const rowData = {};
                    for (const [col, valTemplate] of Object.entries(mapping)) {
                        let rendered = await renderTemplate(valTemplate, context);
                        // Sanitização para Google Sheets: evitar #ERROR! em números ou fórmulas
                        if (typeof rendered === 'string' && (rendered.startsWith('+') || rendered.startsWith('=') || /^\d{10,}$/.test(rendered))) {
                            rendered = `'${rendered}`;
                        }
                        rowData[col] = rendered;
                    }
                    
                    if (Object.keys(rowData).length === 0) {
                        // Fallback mapping if empty
                        rowData['Nome'] = lead.name;
                        rowData['Email'] = lead.email || analysis?.extractedEmails?.[0] || '';
                        
                        const wa = lead.phone || analysis?.extractedPhones?.[0] || '';
                        rowData['WhatsApp'] = (wa.startsWith('+') || /^\d{10,}$/.test(wa)) ? `'${wa}` : wa;
                        
                        rowData['Qscore'] = analysis?.overallScore || analysis?.qScoreAdvanced?.score || analysis?.qScore?.score || 0;
                        rowData['Id'] = lead.id || analysis?.id || '';
                    }

                    if (isDryRun) {
                        console.log(`🧪 (DRY RUN) Google Sheets simulado para ${sheetName}:`, rowData);
                    } else {
                        const { appendRowToSheet } = await import('../sheets.js');
                        await appendRowToSheet(sheetId, sheetName, rowData);
                    }
                    return { status: 'continue' };
                } catch (e) {
                    return { status: 'error', message: `Google Sheets failed: ${e.message}` };
                }
            }

            if (node.actionType === 'ai_personalizer') {
                console.log(`🤖 Ação: Gerando pitch com IA para ${lead.name}`);
                try {
                    const customPrompt = node.config?.prompt || '';
                    if (isDryRun) {
                        context.variables.ai_pitch = "[Pitch de IA Simulado]";
                        console.log(`🧪 (DRY RUN) Pitch de IA simulado`);
                    } else {
                        const { generateAIPitch } = await import('../ai-service.js');
                        const pitch = await generateAIPitch(analysis, lead, customPrompt);
                        context.variables.ai_pitch = pitch;
                        console.log(`✅ Pitch gerado: ${pitch.substring(0, 50)}...`);
                    }
                    return { status: 'continue' };
                } catch (e) {
                    return { status: 'error', message: `AI Personalizer failed: ${e.message}` };
                }
            }

            if (node.actionType === 'telegram_approval') {
                console.log(`🚦 Ação Visual: Aguardando aprovação via Telegram para ${lead.name}`);
                try {
                    const recipient = lead.email || analysis?.extractedEmails?.[0];
                    const { requestTelegramApproval } = await import('../telegram-service.js');
                    
                    if (isDryRun) {
                        console.log(`🧪 (DRY RUN) Aprovação Telegram simulada.`);
                    } else {
                        // Salvar estado atual para retoma após aprovação
                        const { error } = await supabase.from('automation_states').insert([{
                            automation_id: automation.id,
                            lead_id: lead.id,
                            current_node_id: node.id,
                            context: { lead, analysis, context },
                            status: 'waiting_approval'
                        }]);
                        if (error) throw error;

                        await requestTelegramApproval(lead, analysis, node.config, recipient, null, null, automation.id);
                        context.isWaiting = true;
                        return { status: 'stop', message: 'Aguardando aprovação humana' };
                    }
                    return { status: 'continue' };
                } catch (e) {
                    return { status: 'error', message: `Telegram Approval failed: ${e.message}` };
                }
            }

            if (node.actionType === 'meeting_reminder') {
                console.log(`📅 Ação Visual: Agendando lembrete de reunião para ${lead.name}`);
                try {
                    const { scheduleReminder } = await import('../telegram-service.js');
                    if (isDryRun) {
                        console.log(`🧪 (DRY RUN) Lembrete de reunião simulado.`);
                    } else {
                        // Aqui o link costuma vir do context ou config
                        const meetingLink = node.config?.meetingLink || context.variables?.meeting_link || 'Link no convite de calendário';
                        const appointmentTime = context.variables?.appointment_time || 'Horário agendado';
                        
                        await scheduleReminder(lead.name, appointmentTime, meetingLink);
                    }
                    return { status: 'continue' };
                } catch (e) {
                    return { status: 'error', message: `Meeting Reminder failed: ${e.message}` };
                }
            }

            return { status: 'continue' };

    console.log(`⚠️ Action type não reconhecido no core: ${node.actionType}`);
    return { status: 'continue' };
}
