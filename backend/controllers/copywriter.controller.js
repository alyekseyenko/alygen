import axios from 'axios';
import { normalizeUrl } from '../utils/url-helper.js';
import { getAnalysisFromSupabase } from '../services/supabase-service.js';

/**
 * 🤖 [Alygen 2026] Multi-Tone AI Copywriter Engine (PT-PT Native)
 * Generates custom pitch via Groq (LLaMA-3.1-8B) with local Ollama fallback.
 */
export const generateAICopywriter = async (req, res) => {
    try {
        const { id } = req.params;
        const { style = 'consultant_senior', channel = 'email', website } = req.body;

        const targetWebsite = website || '';
        const normalizedWeb = normalizeUrl(targetWebsite);

        // Retrieve local metrics
        let dbResult = await getAnalysisFromSupabase(targetWebsite);
        if (!dbResult.success && normalizedWeb) {
            dbResult = await getAnalysisFromSupabase(normalizedWeb);
        }

        let leadResult = dbResult.success ? dbResult.raw : null;

        if (!leadResult && id) {
            try {
                const db = (await import('../services/local-db-service.js')).default;
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                let query = isUuid ? 'SELECT * FROM lead_analyses WHERE id = $1' : 'SELECT * FROM lead_analyses WHERE id::text = $1';
                const localRes = await db.query(query, [id]);
                leadResult = localRes.rows[0];
            } catch (err) {}
        }

        if (!leadResult) {
            return res.status(404).json({ success: false, error: 'Análise técnica não encontrada para gerar copy.' });
        }

        const analysis = JSON.parse(leadResult.full_analysis || '{}');
        const leadName = leadResult.lead_name || 'Empresa';
        const finalUrl = leadResult.lead_website || targetWebsite;
        const score = leadResult.qscore || 50;

        // Extract issues
        const issues = [];
        if (leadResult.performance_mobile < 50) issues.push(`Performance Mobile muito fraca (${leadResult.performance_mobile}/100) causando perda de conversões`);
        if (leadResult.seo_score < 70) issues.push(`SEO Técnico deficiente (${leadResult.seo_score}/100) tornando o site invisível no Google`);
        if (leadResult.security_score < 70) issues.push(`Problemas de segurança ou headers SSL ausentes`);
        if (leadResult.tracking_total < 2) issues.push(`Ausência de ferramentas de rastreamento avançadas (Meta Pixel/GA4) para marketing`);

        const issuesText = issues.join(', e ');

        const vision = analysis.visionAnalysis || {};
        let visionText = '';
        if (vision.success) {
            visionText = `- Elementos Visuais Detetados (Google Cloud Vision): ${vision.labels?.slice(0, 5).join(', ')}
- Cores Dominantes do Site: ${vision.colors?.join(' | ')}
- Palavras/Textos Encontrados Visualmente no Site: "${vision.fullText?.substring(0, 200).replace(/\n/g, ' ') || ''}"
- Associações de Marca Visual: ${vision.webEntities?.slice(0, 5).join(', ')}`;
        }

        let personaPrompt = '';
        if (style === 'vadym_senior' || style === 'consultant_senior') {
            personaPrompt = `Você é um Consultor Sénior de Crescimento Digital na Alygen CRM. 
Seu tom de voz é de elite, directo, executivo, elegante e focado em resultados de negócio em Português Europeu (PT-PT). 
Use termos como "vossa equipa", "connosco", "website", "contacto". Nunca utilize termos em português do Brasil como "sua equipe", "você", "mídia", "cadastro". Assine sempre como "${process.env.SENDER_NAME || 'Consultor Sénior'} — ${process.env.COMPANY_NAME || 'Alygen'}".`;
        } else if (style === 'technical') {
            personaPrompt = `Você é um Engenheiro de Sistemas e Auditor de Segurança Web Sénior. 
Seu tom de voz é extremamente preciso, cirúrgico, recheado de factos técnicos analíticos mas fácil de entender pelo cliente, focado na resolução dos erros técnicos e conformidade legal em Português Europeu (PT-PT).`;
        } else {
            personaPrompt = `Você é um Copywriter de Conversão Direta (Direct Response) focado em urgência e lacunas de mercado. 
Seu tom é persuasivo, instigante e focado em fecho rápido de reuniões comerciais em Português Europeu (PT-PT).`;
        }

        let channelInstructions = '';
        if (channel === 'whatsapp') {
            channelInstructions = `Gere uma mensagem profissional, altamente persuasiva, concisa e de forte impacto para o WhatsApp, focada em vender o serviço de engenharia de IA, automações e soluções completas da Alygen, ligando-o diretamente à análise técnica personalizada que acabámos de realizar para o website deles.
Fórmula:
- Parágrafo 1 (Gancho Forte & Diagnóstico): Saudação executiva curta personalizada com o nome do cliente. Refira diretamente que realizámos uma auditoria ao website (${finalUrl}) e obtiveram um Q-Score geral de apenas ${score}/100 devido a falhas de velocidade mobile e ausência de rastreamento de conversões estratégico.
- Parágrafo 2 (Comparação de Mercado & Perda): Exponha de forma cirúrgica o impacto financeiro (ex: perda diária de leads e faturamento por lentidão). Diga que concorrentes locais do mesmo setor estão a capturar toda a atenção e clientes no Google enquanto o website deles perde tração.
- Parágrafo 3 (Proposta Personalizada Alygen): Apresente o nosso foco de atuação como especialistas em soluções completas, engenharia de IA e automações. ${visionText ? 'Mencione brevemente que analisámos o site usando a nossa inteligência cognitiva visual (Google Cloud Vision AI) e detetámos o vosso foco de imagem.' : ''} Explique que o nosso relatório completo de prioridades já está pronto e desenhado à medida para corrigir estas fragilidades e automatizar o seu funil de captação.
- Parágrafo 4 (Micro-compromisso Direto): Sugira uma breve chamada de 10 minutos (ou troca de mensagens rápidas) para lhes enviar o plano de ação detalhado com o cronograma, soluções e estimativa de investimento. Sem compromisso.

Diretriz estrita: Não utilize qualquer emoji visual (nada de bonequinhos, setas, corações, etc). Use apenas parágrafos curtos, limpos e marcas de texto simples em negrito (*texto*) para formatação profissional e rápida leitura no ecrã do telemóvel. Mantenha o texto extremamente direto, forte, elegante e focado em resultados de negócio em Português Europeu (PT-PT).`;
        } else {
            channelInstructions = `Gere uma análise persuasiva e personalizada em Português Europeu (PT-PT) sobre o website do cliente (${finalUrl}).
Este texto será inserido diretamente no centro de um e-mail com layout de elite corporativo da Alygen, portanto escreva diretamente a análise estratégica de vendas.
Fórmula:
- Identificar as falhas críticas do site (${finalUrl}) detetadas na auditoria (Score Q-Score de ${score}/100, Performance Mobile de ${leadResult.performance_mobile}/100, SEO Técnico de ${leadResult.seo_score}/100).
- Expor os impactos comerciais e perda de clientes decorrentes destas falhas. ${visionText ? 'Adicione um comentário inteligente sobre o alinhamento visual do site com base no que o Google Vision AI detetou (ex: se o estilo visual e cores comunicam profissionalismo ou se há espaço para melhoria).' : ''}
- Criar urgência e convidar para uma conversa comercial estratégica curta.
Não inclua cabeçalhos, assuntos ou saudações repetitivas de e-mail. Escreva o corpo do veredicto em parágrafos elegantes usando tags <p>, <strong>, <ul> e <li>.`;
        }

        const prompt = `
${personaPrompt}

${channelInstructions}

**DADOS DA AUDITORIA REAL DO CLIENTE:**
- Nome da Empresa: ${leadName}
- Website: ${finalUrl}
- Pontuação Geral (Q-Score): ${score}/100
- Performance Mobile: ${leadResult.performance_mobile}/100
- SEO Técnico: ${leadResult.seo_score}/100
- Ferramentas de Tracking Ativas: ${leadResult.tracking_total}
- Erros Detetados: ${issuesText}
${visionText ? `\n**ANÁLISE COGNITIVA VISUAL (Google Cloud Vision AI):**\n${visionText}\n` : ''}

Gere o texto final diretamente, sem introduções ou observações. RESPONDA APENAS com o texto gerado da mensagem.`;

        // Generate using Groq rotating keys with Ollama local fallback
        let copyText = '';
        try {
            const { default: groqKeyManager } = await import('../services/groq-key-manager.js');
            const groqApiKey = groqKeyManager.getCurrentKey();
            if (groqApiKey) {
                const response = await axios.post(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        model: 'llama-3.1-8b-instant',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.7,
                        max_tokens: 1200
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${groqApiKey}`,
                            'Content-Type': 'application/json'
                        },
                        timeout: 15000
                    }
                );
                copyText = response.data.choices[0].message.content;
            }
        } catch (groqErr) {
            console.warn('⚠️ Groq falhou ao gerar copywriter pitch, tentando Ollama local...', groqErr.message);
        }

        // Local Ollama fallback if Groq failed or is empty
        if (!copyText) {
            try {
                const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
                const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.1:latest';
                console.log(`🦙 [Ollama Copywriter Fallback] Calling Ollama model "${ollamaModel}"...`);
                const response = await axios.post(ollamaUrl, {
                    model: ollamaModel,
                    messages: [{ role: 'user', content: prompt }],
                    stream: false,
                    options: { temperature: 0.7 }
                }, { timeout: 20000 });
                copyText = response.data?.message?.content;
            } catch (ollamaErr) {
                console.warn('⚠️ Ollama local também offline/falhou:', ollamaErr.message);
            }
        }

        // Hard fallback template if everything else is offline
        if (!copyText) {
            const senderName = process.env.SENDER_NAME || 'Consultor Alygen';
            const companyName = process.env.COMPANY_NAME || 'Alygen';
            if (channel === 'whatsapp') {
                copyText = `Olá! Sou o ${senderName} da ${companyName}.\n\nAnalisei o website da *${leadName}* (${finalUrl}) e detetei que o vosso Q-Score técnico é de ${score}/100. Temos perdas graves ao nível de conversão e velocidade mobile.\n\nEnviei um relatório completo por e-mail. Teriam interesse em conversar brevemente (10 min) para ajustar isto?\n\nCumprimentos,\n${senderName} — ${companyName}`;
            } else {
                copyText = `<h3>Assunto: Oportunidade Crítica de Conversão - Website da ${leadName}</h3><p>Olá,</p><p>Analisei o vosso website (<strong>${finalUrl}</strong>) e detetei problemas graves que estão a prejudicar a vossa visibilidade e conversão, com um Q-Score geral de apenas <strong>${score}/100</strong>.</p><p>Estou disponível para uma curta conversa de 10 minutos para apresentar soluções práticas e sem compromisso.</p><p>Melhores cumprimentos,<br>${senderName} — ${companyName}</p>`;
            }
        }

        if (channel === 'email' && copyText) {
            try {
                const { generateEmailTemplate } = await import('../services/email-template.js');
                const tempAnalysis = {
                    ...analysis,
                    agent_intel: copyText
                };
                const tempLeadData = {
                    ...leadResult,
                    agent_intel: copyText,
                    website: finalUrl,
                    name: leadName,
                    city: leadResult.lead_city || analysis.city || ''
                };

                // Query local database directly (PostgreSQL with SQLite fallback) for competitors
                const db = (await import('../services/local-db-service.js')).default;
                const clientSector = leadResult.lead_type || analysis.sector || '';
                const clientCity = leadResult.lead_city || analysis.city || '';

                console.log(`📡 [Local Competitor Search] Sector: "${clientSector}", City: "${clientCity}"`);
                let localLeads = [];
                try {
                    const query = `
                        SELECT lead_name as name, lead_website as website, lead_address as address, lead_city as city, lead_type as type, qscore, full_analysis
                        FROM lead_analyses 
                        WHERE (lead_website != $1)
                          AND (
                            lead_type ILIKE $2 
                            OR lead_city ILIKE $3
                          )
                        LIMIT 50
                    `;
                    const queryParams = [
                        finalUrl, 
                        `%${clientSector}%`, 
                        `%${clientCity}%`
                    ];
                    
                    const localRes = await db.query(query, queryParams);
                    if (localRes && localRes.rows) {
                        localLeads = localRes.rows.map(row => {
                            let parsedFull = {};
                            if (typeof row.full_analysis === 'string') {
                                try { parsedFull = JSON.parse(row.full_analysis); } catch(e) {}
                            } else {
                                parsedFull = row.full_analysis || {};
                            }
                            return {
                                ...parsedFull,
                                name: row.name || row.website,
                                website: row.website,
                                address: row.address,
                                city: row.city,
                                type: row.type,
                                qscore: row.qscore
                            };
                        });
                        console.log(`✅ [Local Competitor Search] Found ${localLeads.length} competitors in local database.`);
                    }
                } catch (dbErr) {
                    console.error("⚠️ Falha ao ler concorrentes da base de dados local:", dbErr.message);
                }

                // Fallback to Supabase only if local database query returned nothing
                let allLeads = localLeads;
                if (allLeads.length === 0) {
                    try {
                        const { getAllAnalyses } = await import('../services/supabase-service.js');
                        const allLeadsRes = await getAllAnalyses(1000);
                        allLeads = allLeadsRes.success ? allLeadsRes.data : [];
                    } catch (sErr) {}
                }

                const emailGenResult = await generateEmailTemplate(tempAnalysis, tempLeadData, allLeads);
                
                if (emailGenResult && emailGenResult.html) {
                    console.log("💎 [AI Copywriter] Successfully merged new copy into beautiful email template HTML!");
                    return res.json({ 
                        success: true, 
                        text: emailGenResult.html, 
                        rawCopyText: copyText, 
                        style, 
                        channel 
                    });
                }
            } catch (tplErr) {
                console.error("⚠️ Erro ao tentar fundir cópia gerada no template do email:", tplErr.message);
            }
        }

        return res.json({ success: true, text: copyText, style, channel });

    } catch (error) {
        console.error('❌ [AI Copywriter Controller] Erro:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
};
