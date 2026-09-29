import { db } from '../db-client.js';
import { getMarketIntelMultiAgent } from '../python-bridge.js';
import { buildAuditContextFromAnalysis } from '../../utils/audit-context.js';
import * as telegramService from '../telegram-service.js';
import { assertPublicHttpUrl } from '../../utils/ssrf.js';

/**
 * Padrão Strategy/Command: Cada ação é uma classe/função independente.
 * Isto desacopla o motor de automação (automation-engine.js) da lógica de negócio de cada ação.
 */
export const ActionRegistry = {
    
    update_lead: async ({ node, context, isDryRun }) => {
        const { lead } = context;
        console.log(`📝 Ação: Atualizando lead ${lead.id}`);
        try {
            const { field, value } = node.config;
            if (isDryRun) {
                console.log(`🧪 (DRY RUN) Sucesso fingindo atualizar ${field} -> ${value}`);
            } else {
                await db.from('leads').update({ [field]: value }).eq('id', lead.id);
            }
            return { status: 'continue' };
        } catch (e) {
            return { status: 'error', message: `Update failed: ${e.message}` };
        }
    },

    webhook: async ({ node, context, isDryRun }) => {
        const { lead, analysis } = context;
        console.log(`🔗 Ação: Disparando webhook para ${node.config.url}`);
        try {
            if (isDryRun) {
                 console.log(`🧪 (DRY RUN) Webhook POST simulado para ${node.config.url}`);
            } else {
                await assertPublicHttpUrl(node.config.url);
                await fetch(node.config.url, {
                    method: node.config.method || 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'automation_triggered',
                        lead, analysis, timestamp: new Date().toISOString()
                    })
                });
            }
            return { status: 'continue' };
        } catch (e) {
            return { status: 'error', message: `Webhook failed: ${e.message}` };
        }
    },

    ai_personalizer: async ({ node, context, isDryRun }) => {
        const { lead, analysis } = context;
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
    },

    meeting_reminder: async ({ node, context, isDryRun }) => {
        const { lead } = context;
        console.log(`📅 Ação Visual: Agendando lembrete de reunião para ${lead.name}`);
        try {
            const { scheduleReminder } = await import('../telegram-service.js');
            if (isDryRun) {
                console.log(`🧪 (DRY RUN) Lembrete de reunião simulado.`);
            } else {
                const meetingLink = node.config?.meetingLink || context.variables?.meeting_link || 'Link no convite de calendário';
                const appointmentTime = context.variables?.appointment_time || 'Horário agendado';
                await scheduleReminder(lead.name, appointmentTime, meetingLink);
            }
            return { status: 'continue' };
        } catch (e) {
            return { status: 'error', message: `Meeting Reminder failed: ${e.message}` };
        }
    },

    telegram_approval: async ({ node, context, isDryRun, automation }) => {
        const { lead, analysis } = context;
        console.log(`🚦 Ação Visual: Aguardando aprovação via Telegram para ${lead.name}`);
        try {
            const recipient = lead.email || analysis?.extractedEmails?.[0];
            
            if (isDryRun) {
                console.log(`🧪 (DRY RUN) Aprovação Telegram simulada.`);
            } else {
                const { error } = await db.from('automation_states').insert([{
                    automation_id: automation.id,
                    lead_id: lead.id,
                    current_node_id: node.id,
                    context: { lead, analysis, context },
                    status: 'waiting_approval'
                }]);
                if (error) throw error;

                await telegramService.requestTelegramApproval(lead, analysis, node.config, recipient, null, null, automation.id);
                context.isWaiting = true;
                return { status: 'stop', message: 'Aguardando aprovação humana' };
            }
            return { status: 'continue' };
        } catch (e) {
            console.error('❌ Erro no handler de Aprovação Telegram:', e.message);
            return { status: 'error', message: `Telegram Approval failed: ${e.message}` };
        }
    },

    /**
     * 🧠 LangChain Market Intelligence Agent
     * Pesquisa concorrentes em tempo real e guarda o intel no lead.
     * Quando ativo na automação "xxxx", enriquece o email com dados de mercado.
     */
    agent_run: async ({ node, context, isDryRun }) => {
        const { lead } = context;
        const agentType = node.config?.agent || 'market_intel';
        if (isDryRun) {
            context.variables = context.variables || {};
            context.variables.agent_output = `[DRY RUN] Agente ${agentType}`;
            return { status: 'continue' };
        }
        if (agentType === 'market_intel') {
            return ActionRegistry.market_intel({ node, context, isDryRun: false });
        }
        return { status: 'continue' };
    },

    market_intel: async ({ node, context, isDryRun }) => {
        const { lead } = context;
        const name   = lead.name || lead.company_name || '';
        const city   = lead.city || lead.address || '';
        const sector = lead.type || lead.category || 'geral';
        const website = lead.website || '';

        console.log(`🧠 [Automation] Market Intel para: ${name}`);

        if (isDryRun) {
            context.variables = context.variables || {};
            context.variables.agent_intel = '[DRY RUN] Intel de mercado simulado por LangChain.';
            console.log(`🧪 (DRY RUN) Market Intel simulado.`);
            return { status: 'continue' };
        }

        try {
            const auditContext = buildAuditContextFromAnalysis(lead, context.analysis || {});
            const agentResult = await getMarketIntelMultiAgent(name, city, sector, website, auditContext);
            const data = agentResult;

            if (data.success && data.intel) {
                // Guardar no contexto para o email usar
                context.variables = context.variables || {};
                context.variables.agent_intel = data.intel;

                // Persistir no Supabase
                const updatePayload = {
                    agent_intel: data.intel,
                    agent_intel_at: new Date().toISOString(),
                };
                if (lead.id) {
                    await db.from('lead_analyses').update(updatePayload).eq('id', lead.id);
                } else if (website) {
                    await db.from('lead_analyses').update(updatePayload).eq('lead_website', website);
                }

                console.log(`✅ [Automation] Intel gravado para ${name}`);
            } else {
                console.warn(`⚠️ [Automation] Intel não gerado: ${data.error}`);
            }

            return { status: 'continue' };
        } catch (e) {
            // Não falha o fluxo se o agente não conseguir (graceful degradation)
            console.warn(`⚠️ [Automation] Market Intel falhou (continuando sem intel): ${e.message}`);
            return { status: 'continue' };
        }
    }
};
