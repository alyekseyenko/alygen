import { sendEmail } from './email.js';
import { sendWhatsApp, isWhatsAppRegistered } from './whatsapp.js';
import { saveAnalysisToSupabase, getContactsLog } from './supabase-service.js';
import { listSequences } from './email-sequences.js';
import { generateEmailTemplate } from './email-template.js';
import { fetchLeads, appendRowToSheet } from './sheets.js';
import { generateAIPitch } from './ai-service.js';
import { supabase } from './supabase-client.js';
import { WorkflowSchema } from '../schemas/automation.schema.js';
import dotenv from 'dotenv';
dotenv.config();

// Cache de execuções em curso para evitar disparos múltiplos seguidos (Debounce)
const activeExecutions = new Map();
const EXECUTION_COOLDOWN = 10000; // 10 segundos de bloqueio para a mesma lead/automação


export async function executeWorkflow(automation, lead, analysis, options = {}) {
    const isDryRun = !!options.dryRun;
    console.log(`🤖 Executando automação: ${automation.name} para o lead: ${lead.name} ${isDryRun ? '(DRY RUN)' : ''}`);
    
    if (analysis?.is_immune && !isDryRun) {
        console.log(`🛡️ [IMUNIDADE] Automação cancelada: O cliente ${lead.name} (${analysis.website}) marcou como IMUNE a automações.`);
        return;
    }
    
    const lockKey = `${automation.id}_${lead.id}`;
    const now = Date.now();
    
    if (activeExecutions.has(lockKey) && (now - activeExecutions.get(lockKey)) < EXECUTION_COOLDOWN) {
        console.log(`🚫 [Debounce] Automação ${automation.name} já disparada recentemente para ${lead.name}. Ignorando duplicado.`);
        return;
    }
    activeExecutions.set(lockKey, now);

    // Proteção extra: Verificação de ID válido para o log
    if (!automation.id || String(automation.id).length < 5) {
        console.warn(`⚠️ Automação com ID inválido (${automation.id}). Abortando para evitar erros de DB.`);
        return;
    }

    const parsed = WorkflowSchema.safeParse(automation.workflow_data);
    if (!parsed.success) {
        console.warn(`⚠️ [WorkflowSchema] Definição de workflow inválida para '${automation.name}':`, parsed.error.issues);
        return;
    }
    const workflow = parsed.data;

    try {
        const nodes = workflow.nodes;
        // Encontrar o gatilho (Trigger)
        const triggerNode = nodes.find(n => n.type === 'trigger');
        if (!triggerNode) return;

        // Executar sequência de nós (Suporta bifurcação agora)
        let context = { lead, analysis, variables: {}, steps: [], email_success: false, whatsapp_success: false };
        
        // Função recursiva para processar caminhos
        async function runPath(node) {
            if (!node) return;
            // Proteção de duplicidade por Nó (dentro da mesma execução)
            const nodeLockKey = `node_${automation.id}_${lead.id}_${node.id}`;
            if (activeExecutions.has(nodeLockKey) && (Date.now() - activeExecutions.get(nodeLockKey)) < 5000) {
                console.log(`⏭️ [Skip] Nó ${node.id} já processado segundos atrás. Evitando triplicação.`);
                return { status: 'continue', branch: 'skipped' };
            }
            activeExecutions.set(nodeLockKey, Date.now());

            const result = await processNode(node, context, workflow, isDryRun, automation);
            
            // Registar passo no log
            context.steps.push({
                id: node.id,
                type: node.type,
                label: node.data?.label || node.label,
                status: result.status,
                branch: result.branch,
                message: result.message
            });

            if (result.status === 'stop' || result.status === 'error') {
                return;
            }

            // Encontrar todos os próximos nós baseados nos edges (Bifurcação Paralela)
            const nextEdges = workflow.edges?.filter(e => e.from === node.id && (e.condition === undefined || e.condition === result.branch)) || [];
            
            const nextNodes = nextEdges.map(edge => nodes.find(n => n.id === edge.to)).filter(Boolean);
            
            // Se houver múltiplos caminhos, disparar em paralelo (sem await no grupo todo se quisermos que um não bloqueie o outro, 
            // mas aqui usamos Promise.all para organização simples por enquanto)
            if (nextNodes.length > 0) {
                await Promise.all(nextNodes.map(nextNode => runPath(nextNode)));
            }
        }

        await runPath(triggerNode);

        // --- REGISTO FINAL DE LOG ---
        // Se chegamos aqui, o fluxo "terminou" (ou parou para aprovação)
        if (!isDryRun) {
            const hasErrors = context.steps.some(s => s.status === 'error');
            const finalStatus = hasErrors ? 'failed' : (context.isWaiting ? 'pending_approval' : 'success');
            
            await logAutomation(automation.id, lead, finalStatus, { 
                reason: context.isWaiting ? 'Aguardando aprovação humana via Telegram' : (hasErrors ? 'Erro durante a execução' : 'Fluxo concluído (todos os caminhos)'),
                steps: context.steps,
                leadName: lead.name,
                leadWebsite: lead.website
            });

            // 🔔 Notificar Telegram que o circuito terminou (apenas se sucesso total)
            if (finalStatus === 'success') {
                try {
                    const chatId = process.env.TELEGRAM_CHAT_ID;
                    if (chatId) {
                        const { default: TelegramBot } = await import('node-telegram-bot-api');
                        const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN.replace(/[\"']/g, ''));
                        const msg = `✅ *Circuito Concluído: ${automation.name}*\n` +
                                    `👤 *Lead:* ${lead.name || lead.company_name}\n` +
                                    `📊 *Status:* Sucesso\n` +
                                    `🔗 [Abrir CRM](http://localhost:4000/?lead=${encodeURIComponent(lead.website || '')})`;
                        await bot.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
                        console.log(`📡 Notificação de conclusão enviada para Telegram: ${lead.name}`);
                    }
                } catch (tgErr) {
                    console.warn('⚠️ Erro ao enviar notificação de conclusão para Telegram:', tgErr.message);
                }
            }
        }

    } catch (error) {
        console.error(`❌ Erro crítico no motor de automação:`, error);
        if(!options.dryRun) await logAutomation(automation.id, lead, 'failed', { error: error.message });
    }
}

/**
 * Retoma um workflow que estava em pausa (Checkpoint)
 */
export async function resumeWorkflow(stateId) {
    console.log(`🔄 Retomando workflow a partir do estado: ${stateId}`);
    
    const { data: state, error } = await supabase
        .from('automation_states')
        .select('*, automations(*)')
        .eq('id', stateId)
        .single();

    if (error || !state) {
        console.error('❌ Erro ao buscar estado para retoma:', error?.message);
        return;
    }

    // Marcar como processando para evitar duplicados
    await supabase.from('automation_states').update({ status: 'processing' }).eq('id', stateId);

    const automation = state.automations;
    const { lead, analysis, context } = state.context;
    const nodes = automation.workflow_data.nodes;

    try {
        // Encontrar o nó onde parámos
        const currentNode = nodes.find(n => n.id === state.current_node_id);
        if (!currentNode) throw new Error(`Nó ${state.current_node_id} não encontrado na automação.`);

        console.log(`🏠 Retomando no nó: ${currentNode.id} (${currentNode.type}) para ${lead.name}`);

        // Função recursiva para continuar a partir deste ponto
        async function runPath(node) {
            if (!node) return;
            
            // Se o nó for do tipo 'wait', e nós ACABÁMOS de acordar dele, temos de avançar para o PRÓXIMO 
            // senão entramos em loop infinito de suspensão.
            let result;
            if (node.id === state.current_node_id && (node.type === 'wait' || node.backendType === 'wait')) {
                console.log(`⏩ Nó de espera concluído. Avançando para os próximos...`);
                result = { status: 'continue' }; 
            } else {
                result = await processNode(node, context, automation.workflow_data, false, automation);
                
                context.steps.push({
                    id: node.id,
                    type: node.type,
                    label: node.data?.label,
                    status: result.status,
                    branch: result.branch,
                    message: result.message
                });
            }

            if (result.status === 'stop' || result.status === 'error' || context.isWaiting) {
                return;
            }

            const nextEdges = automation.workflow_data.edges?.filter(e => e.from === node.id && (e.condition === undefined || e.condition === result.branch)) || [];
            const nextNodes = nextEdges.map(edge => nodes.find(n => n.id === edge.to)).filter(Boolean);
            
            if (nextNodes.length > 0) {
                await Promise.all(nextNodes.map(nextNode => runPath(nextNode)));
            }
        }

        await runPath(currentNode);

        // Se terminou sem entrar noutro wait
        if (!context.isWaiting) {
            await supabase.from('automation_states').update({ status: 'completed' }).eq('id', stateId);
            await logAutomation(automation.id, lead, 'success', { 
                reason: 'Fluxo retomado e concluído',
                steps: context.steps
            });
        }

    } catch (err) {
        console.error(`❌ Erro ao retomar workflow:`, err.message);
        await supabase.from('automation_states').update({ status: 'error' }).eq('id', stateId);
    }
}


async function renderTemplate(text, context) {
    if(!text) return '';
    const { lead, analysis } = context;
    let result = text;
    
    // Base URL for reports (default to localhost:4000 if not in env)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    const reportLink = analysis?.website ? `${baseUrl}/?lead=${encodeURIComponent(analysis.website)}` : `${baseUrl}`;

    // Replace logic variables
    const variables = {
        'lead.id': lead?.id || '',
        'lead.name': lead?.name || lead?.company_name || 'Empresa',
        'lead.website': lead?.website || '',
        'lead.phone': lead?.phone || analysis?.extractedPhones?.[0] || '',
        'lead.email': lead?.email || analysis?.extractedEmails?.[0] || '',
        'analysis.id': analysis?.id || '',
        'analysis.qScore': analysis?.overallScore || analysis?.qScoreAdvanced?.score || analysis?.qScore?.score || '0',
        'analysis.overallScore': analysis?.overallScore || '0',
        'analysis.reportUrl': reportLink,
        'analysis.performanceMobile': analysis?.performanceMobile || 'N/A',
        'analysis.seo.score': analysis?.seo?.score || 'N/A',
        'analysis.category': analysis?.category || 'N/A',
        'analysis.priority': analysis?.priority || 'N/A',
        'ai_pitch': context.variables?.ai_pitch || '',
        'flow.indicators': `${context.email_success ? '✅' : '❌'}${context.whatsapp_success ? '✅' : '❌'}`
    };
    
    for (const [key, val] of Object.entries(variables)) {
        // Safe global replacement for {{key}}
        // Using toString() to handle numbers
        const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        result = result.replace(pattern, (val !== undefined && val !== null) ? val.toString() : '');
    }
    return result;
}

async function processNode(node, context, workflow, isDryRun, automation) {
    const { lead, analysis } = context;

    // Normalizar: suportar node.config (formato direto) E node.data.config (formato ReactFlow)
    // Alguns nós são criados via UI (data.config) e outros via script (config direto)
    node = {
        ...node,
        actionType: node.actionType || node.data?.actionType,
        config: { ...(node.data?.config || {}), ...(node.config || {}) }
    };

    switch (node.type) {
        case 'trigger':
            // Se for trigger de Calendly, apenas continua
            if (node.label === 'Calendly Booking' || node.data?.label === 'Calendly Booking') {
                console.log('📅 Trigger: Calendly Booking detectado no fluxo.');
            }
            return { status: 'continue' };

        case 'condition':
            const { property, operator = 'eq', value } = node.config;
            let actualValue = getNestedProperty(analysis, property);
            
            // Fallback for properties on the lead object (e.g., alreadyEmailed, alreadyWhatsApped)
            if (actualValue === undefined) {
                actualValue = getNestedProperty(lead, property);
            }
            
            // Suporte para propriedades dinâmicas/reais
            if (property === 'isWhatsApp') {
                const phone = lead.phone || analysis?.extractedPhones?.[0];
                if (phone) {
                    console.log(`🔍 Verificando registro WhatsApp para: ${phone}...`);
                    actualValue = await isWhatsAppRegistered(phone);
                } else {
                    actualValue = false;
                }
            }
            
            // Debug if undefined
            if (actualValue === undefined) {
                const keys = Object.keys(analysis);
                console.log(`⚠️ Propriedade "${property}" não encontrada. Chaves disponíveis na análise: ${keys.join(', ')}`);
                // Fallback attempt: check for case insensitivity if first level
                const baseProp = property.split('.')[0];
                const matchingKey = keys.find(k => k.toLowerCase() === baseProp.toLowerCase());
                if (matchingKey && matchingKey !== baseProp) {
                    console.log(`💡 Sugestão: Tentaste "${baseProp}" mas existe "${matchingKey}".`);
                }
            }

            const isMatch = evaluateCondition(actualValue, operator, value);
            console.log(`⚖️ Condição [${property} ${operator} ${value}]: ${isMatch} (Valor real: ${actualValue === undefined ? 'undefined' : (typeof actualValue === 'object' ? JSON.stringify(actualValue) : actualValue)})`);
            
            return { status: 'continue', branch: isMatch ? 'true' : 'false' };

        case 'action':
            const { executeAction } = await import('./automation/actions-core.js');
            return await executeAction(node, context, isDryRun, automation, renderTemplate);
            
        case 'wait':
            const delayInSeconds = parseInt(node.config.delay || 0);
            
            if (isDryRun) {
                console.log(`🧪 (DRY RUN) Timeout de ${delayInSeconds}s ignorado.`);
                return { status: 'continue' };
            }

            // --- NOVO: Persistência de Estado (Checkpoints) ---
            const resumeAt = new Date(Date.now() + delayInSeconds * 1000);
            console.log(`💾 Suspendendo automação. Retoma agendada para: ${resumeAt.toISOString()}`);

            try {
                const { error } = await supabase.from('automation_states').insert([{
                    automation_id: automation.id,
                    lead_id: lead.id,
                    current_node_id: node.id,
                    context: { lead, analysis, context }, // Guardamos o estado atual completo
                    resume_at: resumeAt.toISOString(),
                    status: 'pending'
                }]);

                if (error) throw error;

                context.isWaiting = true; // Flag para o motor parar o runPath atual
                return { status: 'stop', message: `Suspenso até ${resumeAt.toLocaleString()}` };
            } catch (err) {
                console.error('❌ Erro ao salvar checkpoint de espera:', err.message);
                return { status: 'error', message: `Failed to save wait state: ${err.message}` };
            }


        default:
            return { status: 'continue' };
    }
}

function getNestedProperty(obj, path) {
    if (!path) return undefined;
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        
        let val = current[part];
        
        // --- SENIOR NORMALIZATION ---
        // Se a propriedade direta falhar, tentamos case-insensitive (ex: qscore vs qScore)
        if (val === undefined) {
            const keys = Object.keys(current);
            const foundKey = keys.find(k => k.toLowerCase() === part.toLowerCase());
            if (foundKey) val = current[foundKey];
        }

        // Fallback for qScore.score -> qScore.technical se estivermos no dash
        if (val === undefined && part === 'score' && current.technical !== undefined) {
            val = current.technical;
        }
        
        current = val;
    }

    // --- SENIOR STRATEGIC SEARCH ---
    // Se não encontrou no root, tenta procurar dentro dos sub-objetos estratégicos do Python
    if (current === undefined || current === null) {
        const lastPart = parts[parts.length - 1];
        const strategicVal = obj?.strategicInsights?.[path] || obj?.strategicInsights?.[lastPart];
        if (strategicVal !== undefined) return strategicVal;

        const qScoreVal = obj?.qScore?.[path] || obj?.qScore?.[lastPart] || obj?.qScore?.benchmark?.[path] || obj?.qScore?.benchmark?.[lastPart];
        if (qScoreVal !== undefined) return qScoreVal;
    }

    return current;
}


function evaluateCondition(actual, operator, expected) {
    // Normalizar booleanos (string "true" -> true, etc.) e tratar undefined como false
    const normExpected = (expected === 'true' || expected === true) ? true : (expected === 'false' || expected === false) ? false : expected;
    const normActual = (actual === 'true' || actual === true) ? true : (actual === 'false' || actual === false) ? false : (actual === undefined || actual === null) ? false : actual;

    switch (operator) {
        case 'eq': return normActual === normExpected;
        case 'neq': return normActual !== normExpected;
        case 'gt': return Number(actual) > Number(expected);
        case 'lt': return Number(actual) < Number(expected);
        case 'contains': 
            return String(actual || '').toLowerCase().includes(String(expected || '').toLowerCase());
        case 'exists': return actual !== undefined && actual !== null && actual !== '';
        default: return false;
    }
}


async function logAutomation(automationId, lead, status, details) {
    try {
        // Ensure leadId is only used if it's likely a UUID, otherwise null.
        // Postgres will throw an error if we try to insert a website string into a UUID column.
        let leadId = lead?.id || null;
        // 🔥 SENIOR FIX: Ensure leadId is treated as string before calling .includes
        const leadIdStr = String(leadId || '');
        if (leadIdStr && leadIdStr.includes('.')) {
            leadId = null; // Looks like a website, not a UUID
        }

        const { error } = await supabase.from('automation_logs').insert([{
            automation_id: automationId,
            lead_id: leadId,
            status,
            details: {
                ...details,
                leadName: lead?.name || lead?.company_name || null,
                leadWebsite: lead?.website || null
            }
        }]);

        if (error) {
            console.error('❌ Erro Supabase ao gravar log de automação:', error.message);
            return;
        }
        
        if (status === 'success') {
            await supabase.rpc('increment_automation_count', { automation_uuid: automationId });
        }
    } catch (e) {
        console.error('❌ Erro exception ao gravar log de automação:', e.message);
    }
}

// Cache simples para evitar excesso de queries em processamento rápido
let cachedAutomations = null;
let cachedSequences = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30000; // 30 segundos

/**
 * Função principal para ser chamada após cada análise
 */
export async function runAutomationsForLead(lead, analysis) {
    console.log('🏁 [AutomationEngine] runAutomationsForLead chamado!');
    try {
        console.log(`🤖 Verificando automações para ${lead.website || lead.name}...`);
        
        const now = Date.now();
        const shouldRefresh = !cachedAutomations || (now - lastCacheUpdate > CACHE_TTL);

        // 1. Procurar automações ativas
        if (shouldRefresh) {
            console.log('🔄 Atualizando cache de automações e sequências...');
            const [{ data: automations }, { data: sequences }] = await Promise.all([
                supabase.from('automations').select('*').eq('is_active', true),
                listSequences()
            ]);
            
        cachedAutomations = automations || [];
        console.log(`🔍 Encontradas ${cachedAutomations.length} automações ativas no DB.`);
        cachedSequences = sequences || [];
        lastCacheUpdate = now;
    }

    if (!cachedAutomations || cachedAutomations.length === 0) {
        console.log('ℹ️ Nenhuma automação ativa encontrada no DB.');
        return;
    }

        // 2. Enriquecer lead com histórico de contacto (Anti-Duplicate)
        try {
            // Verificar WhatsApp e Email
            const { data: contacts } = await getContactsLog(lead.website);
            const log = contacts || [];
            lead.alreadyWhatsApped = log.some(c => c.type === 'whatsapp');
            lead.alreadyEmailed = log.some(c => c.type === 'email');

            // --- NOVO: Verificar se abriu o email ---
            lead.openedEmail = false;
            try {
                const { listSequences } = await import('./email-sequences.js');
                const seqResult = await listSequences({ q: lead.email || analysis?.website });
                if (seqResult.success && seqResult.data?.length > 0) {
                    // Verificar se alguma sequência deste lead tem open_count > 0
                    lead.openedEmail = seqResult.data.some(s => (s.open_count || 0) > 0);
                }
            } catch (seqError) {
                console.warn('⚠️ Erro ao verificar abertura de email:', seqError.message);
            }

            // Enriquecer com flags de contacto disponíveis
            lead.hasEmail = !!(lead.email || analysis?.extractedEmails?.[0]);
            lead.hasPhone = !!(lead.phone || analysis?.extractedPhones?.[0]);
            
            console.log(`🔍 Histórico de ${lead.website}: Email=${lead.alreadyEmailed}, WA=${lead.alreadyWhatsApped} | Disponível: Email=${lead.hasEmail}, Phone=${lead.hasPhone}`);
        } catch (historyError) {
            console.warn('⚠️ Erro ao buscar histórico de contacto (não crítico):', historyError.message);
        }

        // 3. Executar fluxos
        console.log(`📡 [AutomationEngine] Encontradas ${cachedAutomations.length} automações ativas.`);

        for (const automation of cachedAutomations) {
            try {
                console.log(`🚀 [AutomationEngine] A disparar: ${automation.name} para ${lead.name || lead.website}`);
                await executeWorkflow(automation, lead, analysis);
                console.log(`✅ [AutomationEngine] Execução de ${automation.name} terminada.`);
            } catch (autoError) {
                console.error(`❌ [AutomationEngine] Erro ao executar ${automation.name}:`, autoError.message);
                // Continua para a próxima automação
            }
        }
    } catch (error) {
        console.error('❌ Erro no motor de automação (runAutomations):', error.message);
    }
}

/**
 * ⚡ NOVO: Executar automações temporizadas (Timed Triggers)
 * Procura por leads que precisam de follow-up ou automações de "manutenção"
 */
export async function runTimedAutomations() {
    try {
        console.log('⏰ [TimedTrigger] Verificando automações agendadas...');
        
        // 1. Buscar automações que tenham trigger de tempo ou que sejam 'auto' e devam correr recorrentemente
        const { data: automations } = await supabase
            .from('automations')
            .select('*')
            .eq('is_active', true)
            .or('trigger_type.eq.timed,trigger_type.eq.auto');

        if (!automations || automations.length === 0) return;

        // 2. Buscar leads recentes para processar (ex: os últimos 100)
        const { data: leads } = await supabase
            .from('lead_analyses')
            .select('*')
            .order('analyzed_at', { ascending: false })
            .limit(100);

        if (!leads || leads.length === 0) return;

        console.log(`🔄 [TimedTrigger] Processando ${automations.length} automações para ${leads.length} leads...`);

        for (const leadData of leads) {
            let analysis;
            try {
                analysis = JSON.parse(leadData.full_analysis);
            } catch (e) {
                continue;
            }
            
            const lead = {
                id: leadData.id,
                website: leadData.lead_website,
                name: leadData.lead_name,
                ...analysis.leadData
            };

            for (const automation of automations) {
                await executeWorkflow(automation, lead, analysis);
            }
        }
    } catch (err) {
        console.error('❌ Erro em runTimedAutomations:', err.message);
    }
}
