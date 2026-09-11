import { fetchLeads } from '../services/sheets.js';
import { listSequences, markOpened } from '../services/email-sequences.js';
import { getAllAnalysesMeta, updateLeadEmail, getAnalysisFromSupabase } from '../services/supabase-service.js';
import { supabase } from '../services/supabase-client.js';
import axios from 'axios';
import quotaManager from '../quota-manager.js';
import cacheService from '../services/cache-service.js';
import { sendEmail } from '../services/email.js';
import { mlPredictCloseProbability, getMarketIntelMultiAgent } from '../services/python-bridge.js';
import { performFullAnalysis } from '../services/analysis-service.js';
import { normalizeUrl } from '../utils/url-helper.js';

export { normalizeUrl };

const enrichLeads = async (leads) => {
  try {
    const [{ data: sequences }, { data: analyses }] = await Promise.all([
      listSequences(),
      getAllAnalysesMeta(100000) // 🔥 Aumentado de 5000 para 100000 para acomodar qualquer tamanho de lista sem limites
    ]);

    const sequenceMap = {};
    if (sequences) {
      sequences.forEach(s => {
        if (s.website) {
          sequenceMap[normalizeUrl(s.website)] = s;
        }
      });
    }

    // 🤖 ML Predição com Python (se disponível)
    let mlPredictions = null;
    if (analyses && analyses.length > 0) {
      mlPredictions = await mlPredictCloseProbability(analyses);
    }

    const analysisMap = {};
    if (analyses) {
      analyses.forEach((a, index) => {
        if (a.website) {
          if (mlPredictions && mlPredictions[index]) {
            a.ml_prediction = mlPredictions[index];
          }
          analysisMap[normalizeUrl(a.website)] = a;
        }
      });
    }
    
    return leads.map(lead => {
      const leadUrlNormalized = normalizeUrl(lead.website);
      const analysis = analysisMap[leadUrlNormalized] || lead.analysis || null;
      return {
        ...lead,
        latitude: lead.latitude || analysis?.latitude || null,
        longitude: lead.longitude || analysis?.longitude || null,
        rating: lead.rating || analysis?.rating || null,
        reviews: lead.reviews || analysis?.reviews_count || null,
        sequenceStatus: sequenceMap[leadUrlNormalized] || null,
        analysis
      };
    });
  } catch (enrichError) {
    console.warn('⚠️ Erro ao enriquecer leads:', enrichError.message);
    return leads;
  }
};

export const getLeads = async (req, res) => {
  try {
    const force = req.query.force === 'true';
    const search = req.query.search ? req.query.search.toLowerCase().trim() : '';

    const cache = cacheService.getLeadsCache();
    const now = Date.now();

    let fullResult = null;

    // Helper to get formatted leads list from local database (Single Source of Truth)
    const loadLeadsFromDatabase = async () => {
      const { getAllAnalyses } = await import('../services/supabase-service.js');
      const dbResult = await getAllAnalyses(100000);
      if (!dbResult.success || !dbResult.data) return [];
      
      return dbResult.data.map((item, index) => {
        const isAnalyzed = item.qscore && parseInt(item.qscore) > 0;
        
        const extractedEmail = item.customEmail || 
          (item.extractedEmails && item.extractedEmails[0]) || 
          (item.leadData && item.leadData.email) || 
          item.client_email || 
          item.lead_email || 
          '';

        return {
          id: index + 100,
          name: item.lead_name || item.name || item.lead_website || item.website,
          phone: item.client_phone || item.phone || '',
          email: extractedEmail,
          website: item.lead_website || item.website || '',
          rating: item.rating || '',
          reviews: item.reviews_count || item.reviews || '',
          type: item.type || item.lead_type || '',
          types: item.types || '',
          place_id: item.place_id || `db_${index}`,
          address: item.client_address || item.address || '',
          description: item.private_notes || item.description || '',
          latitude: item.latitude || null,
          longitude: item.longitude || null,
          status: isAnalyzed ? 'analyzed' : 'pending',
          analysis: item
        };
      });
    };

    // Helper to sync from Google Sheets into Database
    const syncGoogleSheetsToDatabase = async () => {
      try {
        console.log('🔄 Sincronizando novas leads do Google Sheets para a Base de Dados...');
        const sheetsResult = await fetchLeads();
        if (sheetsResult && sheetsResult.leads && sheetsResult.leads.length > 0) {
          const { getAnalysisFromSupabase, updateLeadCRMData } = await import('../services/supabase-service.js');
          
          for (const sheetLead of sheetsResult.leads) {
            if (!sheetLead.website) continue;
            
            // Check if website already exists in database
            const dbCheck = await getAnalysisFromSupabase(sheetLead.website);
            const dbLead = dbCheck.data;
            if (!dbCheck.success || !dbLead) {
              console.log(`➕ Nova lead detetada no Google Sheets: ${sheetLead.website}. Adicionando à base de dados local...`);
              await updateLeadCRMData(sheetLead.website, {
                name: sheetLead.name || sheetLead.title || sheetLead.website,
                crm_stage: 'LEAD',
                client_phone: sheetLead.phone || '',
                client_address: sheetLead.address || '',
                private_notes: sheetLead.description || '',
                rating: sheetLead.rating ? parseFloat(sheetLead.rating) : null,
                reviews_count: sheetLead.reviews ? parseInt(sheetLead.reviews) : null,
                latitude: sheetLead.latitude || null,
                longitude: sheetLead.longitude || null,
                sheet_metadata: sheetLead.sheet_metadata
              });
            } else {
              // Always sync sheet_metadata, rating, reviews and GPS coordinates if present or updated
              await updateLeadCRMData(sheetLead.website, {
                rating: sheetLead.rating ? parseFloat(sheetLead.rating) : null,
                reviews_count: sheetLead.reviews ? parseInt(sheetLead.reviews) : null,
                latitude: sheetLead.latitude || null,
                longitude: sheetLead.longitude || null,
                sheet_metadata: sheetLead.sheet_metadata
              });
            }
          }
        }
      } catch (sheetsErr) {
        console.error('⚠️ [Sync Google Sheets] Falha na sincronização (Ignorando graciosamente):', sheetsErr.message);
      }
    };

    // 1. Sincronizar em primeiro plano/segundo plano se forçando ou se a cache expirou
    if (force || !cache.data || now - cache.timestamp >= 60000) {
      if (!cacheService.getActiveFetchPromise()) {
        // Se a cache estiver vazia (arranque do servidor), carregamos IMEDIATAMENTE da base de dados local
        // para garantir que a interface carrega instantaneamente (<50ms) sem bloquear no Google Sheets
        if (!cache.data && !force) {
          console.log('⚡ [SWR] Carregando 5000+ leads da base de dados local instantaneamente...');
          try {
            const dbLeads = await loadLeadsFromDatabase();
            const enriched = await enrichLeads(dbLeads);
            cache.data = { leads: enriched };
            cache.timestamp = now;
            cacheService.setLeadsCache(cache.data);
          } catch (dbErr) {
            console.error('⚠️ [SWR] Falha ao carregar dados locais iniciais:', dbErr.message);
          }
        }

        const syncPromise = (async () => {
          try {
            await syncGoogleSheetsToDatabase();
            const dbLeads = await loadLeadsFromDatabase();
            const enriched = await enrichLeads(dbLeads);
            const result = { leads: enriched };
            cacheService.setLeadsCache(result);
            return result;
          } finally {
            cacheService.setActiveFetchPromise(null);
          }
        })();
        
        cacheService.setActiveFetchPromise(syncPromise);
        if (force) {
          fullResult = await syncPromise;
        } else {
          fullResult = cache.data; // SWR
        }
      } else {
        fullResult = cache.data || await cacheService.getActiveFetchPromise();
      }
    } else {
      console.log('📊 Retornando leads da cache backend...');
      fullResult = cache.data;
    }

    // Aplicar filtragem de pesquisa e fatiamento por página
    const rawLeads = fullResult.leads || (Array.isArray(fullResult) ? fullResult : []);
    
    let filteredLeads = rawLeads;
    if (search) {
      filteredLeads = rawLeads.filter(l => {
        const name = (l.name || '').toLowerCase();
        const website = (l.website || '').toLowerCase();
        const email = (l.email || '').toLowerCase();
        const city = (l.city || '').toLowerCase();
        return name.includes(search) || website.includes(search) || email.includes(search) || city.includes(search);
      });
    }

    const total = filteredLeads.length;
    const hasPaginationParams = req.query.page || req.query.limit;
    
    let paginatedSlice = filteredLeads;
    let pageNum = 1;
    let limitNum = total;
    let totalPages = 1;

    if (hasPaginationParams) {
      pageNum = parseInt(req.query.page) || 1;
      limitNum = parseInt(req.query.limit) || 25;
      totalPages = Math.ceil(total / limitNum) || 1;
      const startIndex = (pageNum - 1) * limitNum;
      paginatedSlice = filteredLeads.slice(startIndex, startIndex + limitNum);
    }

    return res.json({
      success: true,
      data: {
        leads: paginatedSlice,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Erro no getLeads:', error);
    const cache = cacheService.getLeadsCache();
    let rawLeads = [];
    if (cache.data) {
      rawLeads = cache.data.leads || (Array.isArray(cache.data) ? cache.data : []);
    } else {
      console.log('🛡️ [Failsafe] Carregando apenas os clientes reais da Base de Dados Local...');
      try {
        const { getAllAnalyses } = await import('../services/supabase-service.js');
        const dbResult = await getAllAnalyses(1000);
        if (dbResult.success && dbResult.data && dbResult.data.length > 0) {
          rawLeads = dbResult.data.map((item, index) => {
            const isAnalyzed = item.qscore && parseInt(item.qscore) > 0;
            return {
              id: index + 100,
              name: item.name || item.lead_name || item.website,
              phone: item.client_phone || item.phone || '',
              email: item.client_email || item.lead_email || item.email || '',
              website: item.website || item.lead_website || '',
              rating: item.rating || '',
              reviews: item.reviews || '',
              type: item.type || item.lead_type || '',
              types: item.types || '',
              place_id: item.place_id || `local_${index}`,
              address: item.client_address || item.address || '',
              description: item.private_notes || item.description || '',
              status: isAnalyzed ? 'analyzed' : 'pending',
              analysis: isAnalyzed ? item : null
            };
          });
        } else {
          rawLeads = [];
        }
      } catch (dbErr) {
        console.error('❌ Erro ao ler leads da BD Local:', dbErr.message);
        rawLeads = [];
      }
    }

    const total = rawLeads.length;
    return res.json({
      success: true,
      data: {
        leads: rawLeads,
        total,
        page: 1,
        limit: total,
        totalPages: 1
      },
      fromError: true,
      fallbackMode: true
    });
  }
};

export const analyzeLead = async (req, res) => {
  try {
    const { url, leadData, forceReanalyze, phase } = req.body;
    if (!url) return res.status(400).json({ success: false, error: 'URL é obrigatória' });
    
    const { default: analysisQueue } = await import('../analysis-queue.js');
    
    // Check if we already have it in Supabase to avoid queueing if not forced
    // (This is a Senior optimization: don't queue what you already have cached)
    if (!forceReanalyze) {
      const { getAnalysisFromSupabase } = await import('../services/supabase-service.js');
      const cached = await getAnalysisFromSupabase(url);
      if (cached.success) {
        const cachedPhase = cached.data?.audit_phase || 3;
        const requestedPhase = phase || 3;
        
        if (cachedPhase >= requestedPhase) {
          console.log(`📡 [Cache Hit] Análise encontrada para ${url} (Fase ${cachedPhase} >= Solicitada ${requestedPhase}). Verificando automações...`);
          
          // 🔥 Trigger automations even on cache hit (Controller level)
          try {
              const { runAutomationsForLead } = await import('../services/automation-engine.js');
              // Mock lead object with available data
              const leadMock = { 
                  id: cached.raw?.id || cached.data?.id,
                  website: url,
                  name: (leadData && leadData.name) || cached.data?.leadData?.name || url 
              };
              runAutomationsForLead(leadMock, cached.data).catch(err => 
                  console.error('❌ Error triggering automation from cache controller:', err.message)
              );
          } catch (autoErr) {
              console.error('⚠️ Erro ao importar motor de automação no controlador:', autoErr.message);
          }

          return res.json({ 
            success: true, 
            data: cached.data,
            status: 'completed',
            source: 'supabase',
            quota: quotaManager.getQuota()
          });
        }
      }
    }

    // Add to queue for heavy processing
    console.log(`🎟️ Adding analysis of ${url} to the Background Queue (Phase ${phase || 3})...`);
    const job = analysisQueue.add(leadData || { website: url }, forceReanalyze, { phase: phase || 3 });
    
    // --- Lógica Alygen 2026: Processos Prioritários ---
    if (req.body.includeIntel) {
      console.log('🚀 [2026 Engine] Custom Search detectado. Orquestrando Multi-Agente em background...');
      const { getMarketIntelMultiAgent } = await import('../services/python-bridge.js');
      
      const name = (leadData && leadData.name) || url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
      const city = (leadData && leadData.city) || 'Portugal';
      const sector = (leadData && leadData.sector) || 'Negócios';
      
      // Corremos isto em background mas o job da fila guardará o resultado
      getMarketIntelMultiAgent(name, city, sector, url).then(async (intel) => {
        if (intel.success) {
          await supabase
            .from('lead_analyses')
            .update({ agent_intel: intel.intel })
            .ilike('lead_website', `%${normalizeUrl(url)}%`);
          console.log(`✅ [2026 Engine] Intel Multi-Agente guardado para ${url}`);
        }
      }).catch(e => console.error('❌ Erro no Intel Prioritário:', e.message));
    }

    return res.json({ 
      success: true, 
      jobId: job.id, 
      status: 'queued',
      position: job.position,
      estimatedWaitTime: job.estimatedWaitTime,
      quota: quotaManager.getQuota()
    });

  } catch (error) {
    console.error('❌ Erro ao submeter análise para fila:', error);
    res.status(error.message === 'Daily quota exceeded' ? 429 : 500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

export const sendLeadEmail = async (req, res) => {
  try {
    const { leadId, emailBody, recipient, analysis, leadData } = req.body;
    if (!recipient) return res.status(400).json({ success: false, error: 'Destinatário é obrigatório' });
    
    const result = await sendEmail({ leadId, emailBody, recipient, analysis, leadData });
    res.json({ success: true, message: 'Email enviado', ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const trackEmailOpen = async (req, res) => {
  const { id } = req.params;
  try {
    await markOpened(id);
  } catch (e) {}

  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, { 'Content-Type': 'image/gif' });
  res.end(pixel);
};

export const getQuotaStatus = (req, res) => {
  const quota = quotaManager.getQuota();
  res.json({ success: true, quota });
};

export const updateEmail = async (req, res) => {
    try {
      const { website, email } = req.body;
      if (!website || !email) return res.status(400).json({ success: false, error: 'website e email são obrigatórios' });
  
      const result = await updateLeadEmail(website, email);
      res.json({ success: true, data: result.data });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
};

export { getQueueStats, getAnalysisStatus, clearCompletedQueues } from './queue.controller.js';


/**
 * 🧠 [LangChain Market Intelligence]
 * Controller para acionar o agente de IA Python.
 * Consolidado aqui para garantir que port 3001 reconhece a rota.
 */
export const getMarketIntel = async (req, res) => {
    const { id } = req.params;
    const { website } = req.body; 
    try {
        const PYTHON_URL = `http://localhost:${process.env.PYTHON_PORT || 3002}`;
        const targetWebsite = website || '';
        const normalizedWeb = normalizeUrl(targetWebsite);
        
        console.log(`\n🧠 [DEBUG Market Intel] ------------------`);
        console.log(`   ID Recebido: ${id}`);
        console.log(`   Website Recebido: ${targetWebsite}`);
        console.log(`   Website Normalizado: ${normalizedWeb}`);

        // 1. Tentar busca ultra-robusta na BD local (PostgreSQL/SQLite)
        let dbResult = await getAnalysisFromSupabase(targetWebsite);
        if (!dbResult.success && normalizedWeb) {
            dbResult = await getAnalysisFromSupabase(normalizedWeb);
        }
        
        let leadResult = dbResult.success ? dbResult.raw : null;

        if (!leadResult && id) {
            console.log(`   🔍 Website falhou. Tentando por ID na BD local (${id})...`);
            try {
                const db = (await import('../services/local-db-service.js')).default;
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
                let query = '';
                let params = [];
                if (isUuid) {
                    query = 'SELECT * FROM lead_analyses WHERE id = $1';
                    params = [id];
                } else {
                    query = 'SELECT * FROM lead_analyses WHERE id::text = $1 OR id::text LIKE $2';
                    params = [id, `%${id}%`];
                }
                const localRes = await db.query(query, params);
                leadResult = localRes.rows[0];
            } catch (idErr) {
                console.warn(`   ⚠️ Erro ao tentar busca por ID na BD local: ${idErr.message}`);
            }
        }

        if (!leadResult) {
            console.log(`   ❌ Nenhuma análise encontrada na BD Local.`);
            return res.status(404).json({ 
                success: false, 
                error: `Análise não encontrada para ${targetWebsite || id} na BD Local. Execute a análise técnica primeiro.`,
                debug: { id, website: targetWebsite, normalized: normalizedWeb }
            });
        }

        const lead = leadResult;
        const finalUrl = lead.lead_website || targetWebsite;

        let fullAnalysisObj = lead.full_analysis;
        if (typeof fullAnalysisObj === 'string') {
            try { fullAnalysisObj = JSON.parse(fullAnalysisObj); } catch(e) {}
        }
        fullAnalysisObj = fullAnalysisObj || {};
        const sheetMetadata = fullAnalysisObj.sheet_metadata || {};

        // Fallbacks inteligentes usando dados reais extraídos do Google Sheets (sheet_metadata)
        const name    = lead.lead_name || lead.name || lead.company_name || sheetMetadata.title || sheetMetadata.name || finalUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0] || 'Empresa';
        const city    = lead.lead_city || lead.city || sheetMetadata.city || (sheetMetadata.address ? sheetMetadata.address.split(',')[1]?.trim() : '') || 'Portugal';
        const sector  = lead.lead_type || lead.type || sheetMetadata.type || sheetMetadata.types || 'Negócios';

        console.log(`   ✅ Lead Encontrado: ${name} (Setor: ${sector}, Cidade: ${city})`);
        console.log(`   🚀 Acionando Inteligência de Mercado (Multi-Agente)...`);
        
        const { getMarketIntelMultiAgent } = await import('../services/python-bridge.js');
        const agentResult = await getMarketIntelMultiAgent(name, city, sector, finalUrl);
        
        console.log(`   🤖 Agente Python respondeu: ${agentResult.success ? 'SUCESSO' : 'ERRO'}`);

        if (agentResult.success && agentResult.intel) {
            let fullAnalysis = lead.full_analysis;
            if (typeof fullAnalysis === 'string') {
                try { fullAnalysis = JSON.parse(fullAnalysis); } catch(e) {}
            }
            fullAnalysis = fullAnalysis || {};
            fullAnalysis.agent_intel = agentResult.intel;

            try {
                const { generateEmailHtml } = await import('../services/email-template.js');
                const leadDataWithIntel = { ...lead, agent_intel: agentResult.intel };
                const emailGenResult = await generateEmailHtml(fullAnalysis, leadDataWithIntel, []);
                fullAnalysis.emailTemplate = fullAnalysis.emailTemplate || {};
                fullAnalysis.emailTemplate.html = emailGenResult.html;
                agentResult.newEmailHtml = emailGenResult.html;
            } catch (err) {
                console.error("Erro ao regenerar HTML do email:", err);
            }
            const db = (await import('../services/local-db-service.js')).default;
            await db.query(
                `UPDATE lead_analyses SET agent_intel = $1, agent_intel_at = $2, full_analysis = $3 WHERE lead_website = $4`,
                [agentResult.intel, new Date().toISOString(), JSON.stringify(fullAnalysis), lead.lead_website]
            );
            console.log(`   💾 Inteligência e Email re-gravados na Base de Dados Local.`);
        }

        return res.json(agentResult);

    } catch (error) {
        console.error(`❌ [Market Intel Controller] Error: ${error.message}`);
        
        // Se o erro veio do Python (status 500), tentar extrair a mensagem detalhada
        if (error.response && error.response.data) {
            console.error(`🔍 [Python Error Detail]:`, JSON.stringify(error.response.data, null, 2));
            return res.status(error.response.status || 500).json(error.response.data);
        }

        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

/**
 * ⚡ [Alygen 2026] Live Audit for Custom Search
 * Runs technical audit + Multi-Agent Intel synchronously.
 */
export const analyzeTester = async (req, res) => {
    try {
        const { url, leadData } = req.body;
        if (!url) return res.status(400).json({ success: false, error: 'URL é obrigatória' });

        const normalizedUrl = normalizeUrl(url);
        console.log(`🚀 [Tester] Starting Synchronous Live Audit for: ${normalizedUrl}`);

        // 1. Technical Audit (Wait for it)
        const techResult = await performFullAnalysis(normalizedUrl, leadData || { website: normalizedUrl }, true);
        
        if (!techResult.success) {
            throw new Error(techResult.error || 'Falha na análise técnica');
        }

        const analysis = techResult.data;

        // 2. Multi-Agent AI Intel (Wait for it)
        console.log(`🧠 [Tester] Orchestrating Multi-Agent Intelligence...`);
        
        // --- 2026 IMPROVEMENT: Usar o nome REAL extraído do site se disponível ---
        const extractedName = (analysis.seo && analysis.seo.title) || (analysis.meta && analysis.meta.title);
        const name = extractedName || (leadData && leadData.name) || normalizedUrl.split('.')[0] || 'Empresa';
        
        const city = (leadData && leadData.city) || 'Portugal';
        const sector = (analysis.qScore && analysis.qScore.sector) || analysis.sector || 'Negócios';

        const { getMarketIntelMultiAgent } = await import('../services/python-bridge.js');
        const intel = await getMarketIntelMultiAgent(name, city, sector, normalizedUrl);
        
        if (intel.success) {
            analysis.agent_intel = intel.intel;
            // Persist intel in DB so LeadDrawer can see it
            await supabase
                .from('lead_analyses')
                .update({ agent_intel: intel.intel })
                .ilike('lead_website', `%${normalizedUrl}%`);
        }

        // 3. Return everything
        console.log(`✅ [Tester] Full Live Audit Complete for ${normalizedUrl}`);
        res.json({
            success: true,
            data: analysis,
            source: 'live_audit'
        });

    } catch (error) {
        console.error('❌ [Tester] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};
/**
 * 📈 [Alygen 2026] Promote temporary lead to permanent CRM
 * Saves the search result to the master Google Sheet.
 */
export const promoteLead = async (req, res) => {
    try {
        const { lead, analysis } = req.body;
        if (!lead.website) return res.status(400).json({ success: false, error: 'Website é obrigatório' });

        console.log(`📈 Promoting ${lead.website} to permanent CRM...`);

        const { appendRowToSheet } = await import('../services/sheets.js');
        
        // Map to Sheet columns (based on fetchLeads structure)
        const rowData = {
            'title': lead.name || lead.empresa || lead.website.split('.')[0],
            'website': lead.website,
            'phone': lead.phone || analysis?.extractedPhones?.[0] || '',
            'rating': lead.rating || '',
            'reviews': lead.reviews || '',
            'type': lead.type || analysis?.sector || '',
            'address': lead.address || '',
            'place_id': lead.place_id || `temp_${Date.now()}`,
            'status': 'analyzed'
        };

        const success = await appendRowToSheet(process.env.GOOGLE_SHEET_ID, 'Results', rowData);

        if (success) {
            console.log(`✅ ${lead.website} promoted successfully!`);
            return res.json({ success: true, message: 'Lead guardado no CRM com sucesso!' });
        } else {
            throw new Error('Falha ao guardar no Google Sheets');
        }

    } catch (error) {
        console.error('❌ [Promote] Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Controller: AI Copywriter Skill
 * Generates highly persuasive localized Portuguese (PT-PT) copy for Emails and WhatsApp
 * tailored precisely to technical auditing metrics, competitor details, and marketing flaws.
 */
export { generateAICopywriter } from './copywriter.controller.js';

/**
 * 🛡️ [RGPD Art. 17] Direito ao Esquecimento (Right to Erasure)
 * Apaga permanentemente todos os registos do lead: base de dados, sequências de email,
 * screenshots e invalida os caches ativos.
 */
export const eraseLead = async (req, res) => {
  try {
    const rawTarget = req.params.website || req.params.id || req.body?.website || req.body?.email;
    if (!rawTarget) {
      return res.status(400).json({ success: false, error: 'Identificador do lead (website ou email) é obrigatório.' });
    }

    const normalizedWeb = normalizeUrl(rawTarget);
    console.log(`🛡️ [RGPD Art. 17] Pedido de esquecimento recebido para: ${rawTarget} (${normalizedWeb})`);

    let deletedDbCount = 0;

    // 1. Apagar do Supabase / PostgreSQL local
    try {
      const db = (await import('../services/local-db-service.js')).default;
      
      try {
        const delLead = await db.query(
          'DELETE FROM leads WHERE lead_website = $1 OR lead_website = $2 OR client_email = $1 OR client_email = $2',
          [rawTarget, normalizedWeb]
        );
        deletedDbCount += delLead?.rowCount || 0;
      } catch (e) { /* ignore missing leads table */ }

      try {
        const delAnalyses = await db.query(
          'DELETE FROM lead_analyses WHERE lead_website = $1 OR lead_website = $2',
          [rawTarget, normalizedWeb]
        );
        deletedDbCount += delAnalyses?.rowCount || 0;
      } catch (e) { /* ignore */ }

      try {
        const delSeq = await db.query(
          'DELETE FROM email_sequences WHERE website = $1 OR website = $2 OR email = $1',
          [rawTarget, normalizedWeb]
        );
        deletedDbCount += delSeq?.rowCount || 0;
      } catch (e) { /* ignore */ }

    } catch (err) {
      console.warn('⚠️ Erro ao apagar na base de dados local:', err.message);
    }

    if (supabase) {
      try {
        await supabase.from('leads').delete().or(`lead_website.eq.${rawTarget},lead_website.eq.${normalizedWeb},client_email.eq.${rawTarget}`);
        await supabase.from('lead_analyses').delete().or(`lead_website.eq.${rawTarget},lead_website.eq.${normalizedWeb}`);
        await supabase.from('email_sequences').delete().or(`website.eq.${rawTarget},website.eq.${normalizedWeb},email.eq.${rawTarget}`);
      } catch (err) {
        console.warn('⚠️ Erro ao apagar no Supabase:', err.message);
      }
    }

    // 2. Apagar screenshots associados
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const curDir = path.dirname(fileURLToPath(import.meta.url));
      const screenshotsDir = fs.existsSync(path.resolve(curDir, '../screenshots'))
        ? path.resolve(curDir, '../screenshots')
        : path.resolve('backend/screenshots');
      if (fs.existsSync(screenshotsDir)) {
        const files = fs.readdirSync(screenshotsDir);
        const domainClean = normalizedWeb.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '');
        for (const file of files) {
          if (domainClean && file.includes(domainClean)) {
            try {
              fs.unlinkSync(path.join(screenshotsDir, file));
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Erro ao limpar screenshots no eraseLead:', err.message);
    }

    // 3. Invalidar Cache do Redis/Memória
    cacheService.invalidateLeadsCache();

    return res.status(200).json({
      success: true,
      message: 'Registo e dados associados eliminados permanentemente com sucesso ao abrigo do Art. 17.º do RGPD.',
      target: rawTarget,
      recordsRemoved: deletedDbCount
    });
  } catch (error) {
    console.error('❌ [RGPD Art. 17] Erro ao apagar lead:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 🛡️ [RGPD / Lei 41/2004] Endpoint Legal de Opt-out / Unsubscribe
 * Marca o contacto como imune e cancela qualquer envio de email/follow-up futuro.
 */
export const unsubscribeLead = async (req, res) => {
  try {
    const email = (req.query.email || req.body?.email || '').trim().toLowerCase();
    const website = (req.query.website || req.body?.website || '').trim();

    if (!email && !website) {
      return res.status(400).json({ success: false, error: 'Email ou website é obrigatório para processar o cancelamento.' });
    }

    console.log(`🛡️ [Opt-out] Pedido de cancelamento de subscrição para: ${email || website}`);

    // Atualizar base de dados local
    try {
      const db = (await import('../services/local-db-service.js')).default;
      if (email) {
        try {
          await db.query(
            `UPDATE leads SET is_immune = true, status = 'opt_out', opt_out = true WHERE LOWER(client_email) = $1`,
            [email]
          );
        } catch (e) { /* ignore */ }
        
        try {
          await db.query(
            `UPDATE email_sequences SET status = 'cancelled' WHERE LOWER(email) = $1`,
            [email]
          );
        } catch (e) { /* ignore */ }

        try {
          await db.query(
            `UPDATE lead_analyses SET is_immune = 1 WHERE LOWER(client_email) = $1`,
            [email]
          );
        } catch (e) { /* ignore */ }
      }
      if (website) {
        const normalizedWeb = normalizeUrl(website);
        try {
          await db.query(
            `UPDATE leads SET is_immune = true, status = 'opt_out', opt_out = true WHERE lead_website = $1 OR lead_website = $2`,
            [website, normalizedWeb]
          );
        } catch (e) { /* ignore */ }

        try {
          await db.query(
            `UPDATE lead_analyses SET is_immune = 1 WHERE lead_website = $1 OR lead_website = $2`,
            [website, normalizedWeb]
          );
        } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.warn('⚠️ Erro ao atualizar opt-out no DB local:', err.message);
    }

    // Atualizar no Supabase se ativo
    if (supabase) {
      try {
        if (email) {
          await supabase.from('leads').update({ is_immune: true, status: 'opt_out' }).ilike('client_email', email);
          await supabase.from('email_sequences').update({ status: 'cancelled' }).ilike('email', email);
        }
      } catch (err) {}
    }

    // Invalida cache de leads
    cacheService.invalidateLeadsCache();

    // Se o cliente pediu HTML (clicou no link pelo navegador)
    if (req.accepts('html') && req.method === 'GET') {
      const companyName = process.env.COMPANY_NAME || 'Alygen';
      const companyWebsite = process.env.COMPANY_WEBSITE || 'https://alygen.com';
      return res.status(200).send(`<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscrição Cancelada — ${companyName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
    .icon { width: 56px; height: 56px; margin: 0 auto 20px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #22c55e; font-size: 28px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #ffffff; }
    p { font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
    .badge { display: inline-block; background: #1f2937; color: #60a5fa; font-size: 12px; font-family: monospace; padding: 4px 12px; border-radius: 9999px; margin-bottom: 24px; word-break: break-all; }
    a { display: inline-block; background: #FF4F00; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; transition: opacity 0.2s; }
    a:hover { opacity: 0.9; }
    .footer { margin-top: 32px; font-size: 11px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Subscrição Cancelada</h1>
    <p>O seu contacto foi removido com sucesso de todas as nossas listas de comunicação e diagnóstico comercial nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD - UE 2016/679).</p>
    ${email ? `<div class="badge">${email}</div><br>` : ''}
    <a href="${companyWebsite}">Voltar à página principal</a>
    <div class="footer">
      ${companyName} · Conformidade Legal & Privacidade Assegurada
    </div>
  </div>
</body>
</html>`);
    }

    return res.status(200).json({
      success: true,
      message: 'Subscrição cancelada com sucesso. O contacto foi marcado como imune.',
      email: email || null,
      website: website || null
    });
  } catch (error) {
    console.error('❌ [Opt-out] Erro ao processar cancelamento:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 🛡️ [RGPD Art. 5] Execução sob demanda da limpeza da retenção de dados
 */
export const cleanupDataRetention = async (req, res) => {
  try {
    const { retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '365', 10) } = req.body || {};
    const { deleteOldAnalyses } = await import('../services/supabase-service.js');
    const result = await deleteOldAnalyses(retentionDays);

    return res.status(200).json({
      success: true,
      message: `Limpeza de retenção de dados executada com sucesso.`,
      retentionDays,
      deleted: result.deleted || 0
    });
  } catch (error) {
    console.error('❌ [Retenção RGPD] Erro ao executar limpeza:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

