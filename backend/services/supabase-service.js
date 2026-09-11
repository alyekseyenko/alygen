import db from './local-db-service.js'; // This is now a PostgreSQL connection Pool
import cacheService from './cache-service.js';
import crypto from 'crypto';

console.log('🐘 Base de Dados: Modo LOCAL (PostgreSQL High Performance + pgvector Ready)');

/**
 * Salvar análise completa na base de dados Local (PostgreSQL)
 */
export async function saveAnalysisToSupabase(leadData, analysis) {
  const website = leadData.website || analysis.url;
  if (!website) {
    console.error('❌ Erro: website é obrigatório para salvar na BD local');
    return { success: false, error: 'Website é obrigatório' };
  }

  try {
    const id = crypto.randomUUID();
    const lead_name = leadData.name || leadData.company_name || null;
    const lead_city = leadData.city || null;
    const lead_type = leadData.type || leadData.type_id || null;
    
    const qscore = analysis.qScore?.score || analysis.qScoreAdvanced?.score || 0;
    const qscore_grade = analysis.qScore?.grade || analysis.qScoreAdvanced?.grade || 'F';
    const priority = analysis.priority || null;
    
    const performance_mobile = analysis.performanceMobile || 0;
    const performance_desktop = analysis.performanceDesktop || 0;
    const security_has_ssl = analysis.security?.hasSSL ? 1 : 0;
    const tracking_total = analysis.pixelDetails?.totalTracking || 0;
    
    const seo_score = analysis.seo?.score || 0;
    const accessibility_score = analysis.accessibility?.score || 0;
    const security_score = analysis.security?.score || 0;
    
    const is_social_media_only = analysis.isSocialMediaOnly ? 1 : 0;

    // Specialized columns extraction
    const core_web_vitals = analysis.coreWebVitals ? JSON.stringify(analysis.coreWebVitals) : null;
    const geo_score = typeof analysis.geoScore === 'number' ? analysis.geoScore : (analysis.geo?.score || 0);
    const local_seo_score = typeof analysis.localSeoScore === 'number' ? analysis.localSeoScore : (analysis.localSeo?.score || 0);
    const schema_detected = Array.isArray(analysis.schemaDetected) ? analysis.schemaDetected.join(', ') : (analysis.schema?.detected || null);
    const ai_win_rate = typeof analysis.aiWinRate === 'number' ? analysis.aiWinRate : (analysis.ml_prediction?.close_probability || 0);
    const sales_hook = analysis.salesHook || analysis.strategy?.salesHook || analysis.ml_prediction?.recommendation || null;
    
    const full_analysis = JSON.stringify({
      ...analysis,
      leadData,
      coreWebVitals: analysis.coreWebVitals || { lcp: performance_mobile > 60 ? 1500 : 3500, inp: 150, cls: 0.05, ttfb: 400 },
      geoScore: geo_score,
      localSeoScore: local_seo_score,
      schemaDetected: analysis.schemaDetected || [],
      aiWinRate: ai_win_rate,
      salesHook: sales_hook
    });
    
    const analyzed_at = new Date().toISOString();

    const existingResult = await db.query('SELECT id FROM lead_analyses WHERE lead_website = $1', [website]);
    const existing = existingResult.rows[0];

    if (existing) {
      await db.query(`
        UPDATE lead_analyses SET
          lead_name = COALESCE($1, lead_name),
          lead_city = COALESCE($2, lead_city),
          lead_type = COALESCE($3, lead_type),
          qscore = $4,
          qscore_grade = $5,
          priority = $6,
          performance_mobile = $7,
          performance_desktop = $8,
          security_has_ssl = $9,
          tracking_total = $10,
          seo_score = $11,
          accessibility_score = $12,
          security_score = $13,
          is_social_media_only = $14,
          full_analysis = $15,
          analyzed_at = $16,
          core_web_vitals = $17,
          geo_score = $18,
          local_seo_score = $19,
          schema_detected = $20,
          ai_win_rate = $21,
          sales_hook = $22,
          updated_at = CURRENT_TIMESTAMP
        WHERE lead_website = $23
      `, [
        lead_name, lead_city, lead_type,
        qscore, qscore_grade, priority,
        performance_mobile, performance_desktop, security_has_ssl, tracking_total,
        seo_score, accessibility_score, security_score,
        is_social_media_only, full_analysis, analyzed_at,
        core_web_vitals, geo_score, local_seo_score, schema_detected, ai_win_rate, sales_hook,
        website
      ]);
    } else {
      await db.query(`
        INSERT INTO lead_analyses (
          id, lead_name, lead_website, lead_city, lead_type,
          qscore, qscore_grade, priority, performance_mobile, performance_desktop,
          security_has_ssl, tracking_total, seo_score, accessibility_score, security_score,
          is_social_media_only, full_analysis, analyzed_at,
          core_web_vitals, geo_score, local_seo_score, schema_detected, ai_win_rate, sales_hook
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      `, [
        id, lead_name, website, lead_city, lead_type,
        qscore, qscore_grade, priority, performance_mobile, performance_desktop,
        security_has_ssl, tracking_total, seo_score, accessibility_score, security_score,
        is_social_media_only, full_analysis, analyzed_at,
        core_web_vitals, geo_score, local_seo_score, schema_detected, ai_win_rate, sales_hook
      ]);
    }

    if (cacheService && cacheService.invalidateLeadsCache) {
      cacheService.invalidateLeadsCache();
    }

    console.log(`✅ Análise salva na BD Local: ${lead_name || website}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Erro ao salvar na BD Local (PostgreSQL):', error);
    return { success: false, error: error.message };
  }
}

/**
 * Buscar análise na base de dados Local (PostgreSQL)
 */
export async function getAnalysisFromSupabase(website) {
  try {
    const result = await db.query('SELECT * FROM lead_analyses WHERE lead_website = $1', [website]);
    const row = result.rows[0];

    if (!row) {
      return { success: false, error: 'Análise não encontrada' };
    }

    const analysis = JSON.parse(row.full_analysis);
    
    return { 
      success: true, 
      data: analysis,
      raw: row,
      cached: true,
      cachedAt: row.analyzed_at
    };

  } catch (error) {
    console.error('❌ Erro ao buscar da BD Local (PostgreSQL):', error);
    return { success: false, error: error.message };
  }
}

/**
 * Listar todas as análises na BD Local com Paginação & Pesquisa
 */
export async function getAllAnalyses(limitOrFilters = 500, offset = 0) {
  try {
    let limit = 500;
    let currentOffset = offset;
    let filters = null;
    let page = 1;
    let search = null;

    if (typeof limitOrFilters === 'object' && limitOrFilters !== null) {
      filters = limitOrFilters;
      limit = filters.limit || 500;
      currentOffset = filters.offset || (filters.page ? (filters.page - 1) * limit : 0);
      page = filters.page || (Math.floor(currentOffset / limit) + 1);
      search = filters.search || null;
    } else if (typeof limitOrFilters === 'number') {
      limit = limitOrFilters;
    }

    let whereClause = ' WHERE 1=1';
    const params = [];
    let paramCounter = 1;

    if (search) {
      whereClause += ` AND (lead_name ILIKE $${paramCounter} OR lead_website ILIKE $${paramCounter + 1} OR client_email ILIKE $${paramCounter + 2})`;
      const term = `%${search}%`;
      params.push(term, term, term);
      paramCounter += 3;
    }

    if (filters) {
      if (filters.minQScore !== undefined) {
        whereClause += ` AND qscore >= $${paramCounter}`;
        params.push(filters.minQScore);
        paramCounter++;
      }
      if (filters.maxQScore !== undefined) {
        whereClause += ` AND qscore <= $${paramCounter}`;
        params.push(filters.maxQScore);
        paramCounter++;
      }
      if (filters.priority !== undefined) {
        whereClause += ` AND priority = $${paramCounter}`;
        params.push(filters.priority);
        paramCounter++;
      }
      if (filters.is_immune !== undefined) {
        whereClause += ` AND is_immune = $${paramCounter}`;
        params.push(filters.is_immune ? 1 : 0);
        paramCounter++;
      }
    }

    // Contar total de registos para calcular totalPages
    const countResult = await db.query(`SELECT COUNT(*) as total FROM lead_analyses ${whereClause}`, params);
    const countRow = countResult.rows[0];
    const total = countRow ? parseInt(countRow.total) : 0;

    let query = `SELECT * FROM lead_analyses ${whereClause} ORDER BY analyzed_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    const queryParams = [...params, limit, currentOffset];

    const result = await db.query(query, queryParams);
    const rows = result.rows;

    const parsed = rows.map(row => {
      let fullAnalysis = {};
      if (row.full_analysis) {
        try {
          fullAnalysis = typeof row.full_analysis === 'string' 
            ? JSON.parse(row.full_analysis) 
            : row.full_analysis;
        } catch (e) {
          console.warn('⚠️ Erro ao parsear full_analysis:', e.message);
        }
      }

      let budget_items = [];
      if (row.budget_items) {
        try { budget_items = typeof row.budget_items === 'string' ? JSON.parse(row.budget_items) : row.budget_items; } catch(e){}
      }
      let third_party_services = [];
      if (row.third_party_services) {
        try { third_party_services = typeof row.third_party_services === 'string' ? JSON.parse(row.third_party_services) : row.third_party_services; } catch(e){}
      }

      return {
        ...fullAnalysis,
        website: row.lead_website || fullAnalysis.website,
        name: row.lead_name || fullAnalysis.name,
        is_immune: row.is_immune === 1 || fullAnalysis.is_immune || false,
        crm_stage: row.crm_stage || fullAnalysis.crm_stage || 'LEAD',
        budget: row.budget ?? fullAnalysis.budget ?? 0,
        private_notes: row.private_notes || fullAnalysis.private_notes || '',
        
        qScore: fullAnalysis.qScore || { score: row.qscore, grade: row.qscore_grade },
        priority: row.priority || fullAnalysis.priority,
        performanceMobile: row.performance_mobile ?? fullAnalysis.performanceMobile,
        
        seo: fullAnalysis.seo || { score: row.seo_score || 0 },
        security: fullAnalysis.security || { score: row.security_score || 0, hasSSL: row.security_has_ssl === 1 },
        accessibility: fullAnalysis.accessibility || { score: row.accessibility_score || 0 },
        pixelDetails: fullAnalysis.pixelDetails || { totalTracking: row.tracking_total || 0 },
        
        client_email: row.client_email || fullAnalysis.client_email || '',
        client_phone: row.client_phone || fullAnalysis.client_phone || '',
        client_address: row.client_address || fullAnalysis.client_address || '',
        client_nif: row.client_nif || fullAnalysis.client_nif || '',
        contact_person: row.contact_person || fullAnalysis.contact_person || '',
        project_type: row.project_type || fullAnalysis.project_type || 'WEBSITE',
        budget_items: budget_items.length > 0 ? budget_items : (fullAnalysis.budget_items || []),
        third_party_services: third_party_services.length > 0 ? third_party_services : (fullAnalysis.third_party_services || []),
        discount_percentage: row.discount_percentage || fullAnalysis.discount_percentage || 0,
        rating: row.rating ?? fullAnalysis.rating ?? null,
        reviews_count: row.reviews_count ?? fullAnalysis.reviews_count ?? null,
        latitude: row.latitude ?? fullAnalysis.latitude ?? null,
        longitude: row.longitude ?? fullAnalysis.longitude ?? null,
        _cachedAt: row.analyzed_at
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return { 
      success: true, 
      data: parsed, 
      count: parsed.length,
      total,
      page,
      limit,
      totalPages
    };

  } catch (error) {
    console.error('❌ Erro ao listar análises locais (PostgreSQL):', error);
    return { success: false, error: error.message };
  }
}

/**
 * Metadados leves de análises
 */
export async function getAllAnalysesMeta(limit = 1000) {
  try {
    const result = await db.query(`
      SELECT lead_website, lead_name, qscore, qscore_grade, priority, analyzed_at,
             is_social_media_only, performance_mobile, performance_desktop, security_has_ssl,
             tracking_total, crm_stage, is_immune, budget, seo_score, accessibility_score, security_score,
             rating, reviews_count, latitude, longitude
      FROM lead_analyses
      ORDER BY analyzed_at DESC
      LIMIT $1
    `, [limit]);
    const rows = result.rows;

    const mapped = rows.map(row => ({
      website: row.lead_website,
      name: row.lead_name,
      qScore: { score: row.qscore, grade: row.qscore_grade },
      priority: row.priority,
      analyzedAt: row.analyzed_at,
      isSocialMediaOnly: row.is_social_media_only === 1,
      performanceMobile: row.performance_mobile || 0,
      performanceDesktop: row.performance_desktop || 0,
      seo: { score: row.seo_score || 0 },
      security: { score: row.security_score || 0, hasSSL: row.security_has_ssl === 1 },
      accessibility: { score: row.accessibility_score || 0 },
      pixelDetails: { totalTracking: row.tracking_total || 0 },
      is_immune: row.is_immune === 1,
      crm_stage: row.crm_stage || 'LEAD',
      budget: row.budget || 0,
      rating: row.rating,
      reviews_count: row.reviews_count,
      latitude: row.latitude,
      longitude: row.longitude
    }));

    return { success: true, data: mapped, count: mapped.length };
  } catch (error) {
    console.error('❌ Erro ao listar análises meta locais (PostgreSQL):', error);
    return { success: false, error: error.message };
  }
}

/**
 * Apagar análises antigas
 */
export async function deleteOldAnalyses(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await db.query('DELETE FROM lead_analyses WHERE analyzed_at < $1', [cutoffDate.toISOString()]);
    return { success: true, deleted: result.rowCount };
  } catch (error) {
    console.error('❌ Erro ao deletar análises antigas:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Estatísticas gerais
 */
export async function getAnalyticsStats() {
  try {
    const result = await db.query('SELECT qscore, priority, security_has_ssl, tracking_total FROM lead_analyses');
    const rows = result.rows;

    if (rows.length === 0) {
      return { success: true, stats: { total: 0, avgQScore: 0, withoutSSL: 0, highPriority: 0, avgTracking: 0 } };
    }

    const stats = {
      total: rows.length,
      avgQScore: rows.reduce((sum, d) => sum + (d.qscore || 0), 0) / rows.length,
      withoutSSL: rows.filter(d => !d.security_has_ssl).length,
      highPriority: rows.filter(d => d.priority === 'ALTA').length,
      avgTracking: rows.reduce((sum, d) => sum + (d.tracking_total || 0), 0) / rows.length
    };

    return { success: true, stats };
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas locais (PostgreSQL):', error);
    return { success: false, error: error.message };
  }
}

// --- AUTOMATION METHODS ---

export async function getAutomations() {
  try {
    const result = await db.query('SELECT * FROM automations ORDER BY created_at DESC');
    const rows = result.rows;
    const data = rows.map(r => ({
      ...r,
      trigger: r.trigger ? JSON.parse(r.trigger) : null,
      nodes: r.nodes ? JSON.parse(r.nodes) : [],
      edges: r.edges ? JSON.parse(r.edges) : [],
      is_active: r.is_active === 1
    }));
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function upsertAutomation(automation) {
  try {
    const id = automation.id || crypto.randomUUID();
    const name = automation.name || 'Nova Automação';
    const trigger = automation.trigger ? JSON.stringify(automation.trigger) : null;
    const nodes = automation.nodes ? JSON.stringify(automation.nodes) : null;
    const edges = automation.edges ? JSON.stringify(automation.edges) : null;
    const is_active = automation.is_active ? 1 : 0;

    const existingResult = await db.query('SELECT id FROM automations WHERE id = $1', [id]);
    const existing = existingResult.rows[0];
    if (existing) {
      await db.query(`
        UPDATE automations SET name = $1, trigger = $2, nodes = $3, edges = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `, [name, trigger, nodes, edges, is_active, id]);
    } else {
      await db.query(`
        INSERT INTO automations (id, name, trigger, nodes, edges, is_active) VALUES ($1, $2, $3, $4, $5, $6)
      `, [id, name, trigger, nodes, edges, is_active]);
    }
    return { success: true, data: { ...automation, id } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteAutomation(id) {
  try {
    await db.query('DELETE FROM automations WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAutomationLogs(automationId) {
  try {
    const result = await db.query('SELECT * FROM automation_logs WHERE automation_id = $1 ORDER BY created_at DESC LIMIT 50', [automationId]);
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- CONTACTS LOG ---

export async function logContact({ leadName, website, type, recipient, phone, message }) {
  try {
    await db.query(`
      INSERT INTO contacts_log (lead_name, website, type, phone, message) VALUES ($1, $2, $3, $4, $5)
    `, [leadName || null, website || null, type || null, phone || recipient || null, message || null]);
    console.log(`✅ Contacto registado na BD Local (PostgreSQL): ${type} → ${leadName}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao registar contacto:', error.message);
    return { success: false, error: error.message };
  }
}

export async function getContactsLog(website) {
  try {
    let query = 'SELECT * FROM contacts_log';
    const params = [];
    if (website) {
      query += ' WHERE website = $1';
      params.push(website);
    }
    query += ' ORDER BY sent_at DESC';
    const result = await db.query(query, params);
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, data: [], error: error.message };
  }
}

// --- EMAIL UPDATES & CRM ---

export async function updateLeadEmail(website, email) {
  try {
    const existingResult = await db.query('SELECT full_analysis FROM lead_analyses WHERE lead_website = $1', [website]);
    const row = existingResult.rows[0];
    let analysis = {};
    if (row && row.full_analysis) {
      try { analysis = JSON.parse(row.full_analysis); } catch(e){}
    }

    if (!analysis.extractedEmails) analysis.extractedEmails = [];
    if (!analysis.extractedEmails.includes(email)) {
      analysis.extractedEmails.unshift(email);
    }
    analysis.customEmail = email;
    analysis.customEmailAt = new Date().toISOString();

    const full_analysis = JSON.stringify(analysis);
    const leadName = analysis.name || website.replace(/https?:\/\/(www\.)?/, '').split('/')[0];

    if (row) {
      await db.query('UPDATE lead_analyses SET full_analysis = $1, updated_at = CURRENT_TIMESTAMP WHERE lead_website = $2', [full_analysis, website]);
    } else {
      const id = crypto.randomUUID();
      await db.query('INSERT INTO lead_analyses (id, lead_name, lead_website, full_analysis) VALUES ($1, $2, $3, $4)', [id, leadName, website, full_analysis]);
    }

    console.log(`✅ Email atualizado na BD Local (PostgreSQL) para ${website}: ${email}`);
    return { success: true, data: analysis };
  } catch (error) {
    console.error('❌ Erro ao atualizar email:', error);
    return { success: false, error: error.message };
  }
}

export async function updateLeadCRMData(website, payload) {
  try {
    const existingResult = await db.query('SELECT * FROM lead_analyses WHERE lead_website = $1', [website]);
    const row = existingResult.rows[0];
    let analysis = {};
    if (row && row.full_analysis) {
      try { analysis = JSON.parse(row.full_analysis); } catch(e){}
    }

    analysis.crm_stage = payload.crm_stage !== undefined ? payload.crm_stage : (analysis.crm_stage || 'LEAD');
    analysis.budget = payload.budget !== undefined ? payload.budget : analysis.budget;
    analysis.is_immune = payload.is_immune !== undefined ? payload.is_immune : analysis.is_immune;
    analysis.private_notes = payload.private_notes !== undefined ? payload.private_notes : analysis.private_notes;
    
    analysis.client_email = payload.client_email !== undefined ? payload.client_email : analysis.client_email;
    analysis.client_phone = payload.client_phone !== undefined ? payload.client_phone : analysis.client_phone;
    analysis.client_address = payload.client_address !== undefined ? payload.client_address : analysis.client_address;
    analysis.client_nif = payload.client_nif !== undefined ? payload.client_nif : analysis.client_nif;
    analysis.contact_person = payload.contact_person !== undefined ? payload.contact_person : analysis.contact_person;
    analysis.project_type = payload.project_type !== undefined ? payload.project_type : analysis.project_type;
    analysis.budget_items = payload.budget_items !== undefined ? payload.budget_items : (analysis.budget_items || []);
    analysis.third_party_services = payload.third_party_services !== undefined ? payload.third_party_services : (analysis.third_party_services || []);
    analysis.discount_percentage = payload.discount_percentage !== undefined ? payload.discount_percentage : (analysis.discount_percentage || 0);

    analysis.rating = payload.rating !== undefined ? payload.rating : (analysis.rating || row?.rating || null);
    analysis.reviews_count = payload.reviews_count !== undefined ? payload.reviews_count : (analysis.reviews_count || row?.reviews_count || null);
    analysis.latitude = payload.latitude !== undefined ? payload.latitude : (analysis.latitude || row?.latitude || null);
    analysis.longitude = payload.longitude !== undefined ? payload.longitude : (analysis.longitude || row?.longitude || null);
    analysis.sheet_metadata = payload.sheet_metadata !== undefined ? payload.sheet_metadata : (analysis.sheet_metadata || null);

    const full_analysis = JSON.stringify(analysis);
    const budget_items_str = JSON.stringify(analysis.budget_items);
    const third_party_str = JSON.stringify(analysis.third_party_services);

    if (row) {
      await db.query(`
        UPDATE lead_analyses SET
          full_analysis = $1,
          crm_stage = $2,
          budget = $3,
          is_immune = $4,
          private_notes = $5,
          client_email = $6,
          client_phone = $7,
          client_address = $8,
          client_nif = $9,
          contact_person = $10,
          project_type = $11,
          budget_items = $12,
          third_party_services = $13,
          discount_percentage = $14,
          rating = $15,
          reviews_count = $16,
          latitude = $17,
          longitude = $18,
          updated_at = CURRENT_TIMESTAMP
        WHERE lead_website = $19
      `, [
        full_analysis,
        analysis.crm_stage,
        analysis.budget || 0,
        analysis.is_immune ? 1 : 0,
        analysis.private_notes || null,
        analysis.client_email || null,
        analysis.client_phone || null,
        analysis.client_address || null,
        analysis.client_nif || null,
        analysis.contact_person || null,
        analysis.project_type || 'WEBSITE',
        budget_items_str,
        third_party_str,
        analysis.discount_percentage || 0,
        analysis.rating,
        analysis.reviews_count,
        analysis.latitude,
        analysis.longitude,
        website
      ]);
    } else {
      const id = crypto.randomUUID();
      const leadName = payload.name || website.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
      await db.query(`
        INSERT INTO lead_analyses (
          id, lead_website, lead_name, qscore, qscore_grade, priority, analyzed_at, full_analysis,
          is_immune, crm_stage, budget, private_notes, client_email, client_phone, client_address,
          client_nif, contact_person, project_type, budget_items, third_party_services, discount_percentage,
          rating, reviews_count, latitude, longitude
        ) VALUES ($1, $2, $3, 0, 'F', 'MÉDIO', CURRENT_TIMESTAMP, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `, [
        id, website, leadName, full_analysis,
        analysis.is_immune ? 1 : 0,
        analysis.crm_stage,
        analysis.budget || 0,
        analysis.private_notes || null,
        analysis.client_email || null,
        analysis.client_phone || null,
        analysis.client_address || null,
        analysis.client_nif || null,
        analysis.contact_person || null,
        analysis.project_type || 'WEBSITE',
        budget_items_str,
        third_party_str,
        analysis.discount_percentage || 0,
        analysis.rating,
        analysis.reviews_count,
        analysis.latitude,
        analysis.longitude
      ]);
    }

    console.log(`✅ CRM atualizado na BD Local (PostgreSQL) para ${website} | Fase: ${analysis.crm_stage}`);
    return { success: true, data: analysis };

  } catch (error) {
    console.error('❌ Erro ao atualizar CRM Local:', error);
    return { success: false, error: error.message };
  }
}

// --- EMAIL TEMPLATES ---

export async function getEmailTemplates() {
  try {
    const result = await db.query('SELECT * FROM email_templates ORDER BY created_at DESC');
    return { success: true, data: result.rows };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function upsertEmailTemplate(template) {
  try {
    const id = template.id || crypto.randomUUID();
    const existingResult = await db.query('SELECT id FROM email_templates WHERE id = $1', [id]);
    const existing = existingResult.rows[0];
    if (existing) {
      await db.query('UPDATE email_templates SET name = $1, subject = $2, body_html = $3 WHERE id = $4', [template.name, template.subject, template.body_html, id]);
    } else {
      await db.query('INSERT INTO email_templates (id, name, subject, body_html) VALUES ($1, $2, $3, $4)', [id, template.name, template.subject, template.body_html]);
    }
    return { success: true, data: { ...template, id } };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deleteEmailTemplate(id) {
  try {
    await db.query('DELETE FROM email_templates WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- ALYGEN CONFIG ---

export async function getAlygenConfig() {
  try {
    const result = await db.query("SELECT * FROM alygen_config WHERE id = 'global'");
    const row = result.rows[0];
    return { success: true, data: row || null };
  } catch (error) {
    console.error('❌ Erro ao buscar config Alygen local (PostgreSQL):', error.message);
    return { success: false, error: error.message };
  }
}

export async function saveAlygenConfig(configPayload) {
  try {
    const { nif, address, iban, swift, signature_base64 } = configPayload;
    const existingResult = await db.query("SELECT id FROM alygen_config WHERE id = 'global'");
    const existing = existingResult.rows[0];

    if (existing) {
      await db.query(`
        UPDATE alygen_config SET nif = $1, address = $2, iban = $3, swift = $4, signature_base64 = $5, updated_at = CURRENT_TIMESTAMP
        WHERE id = 'global'
      `, [nif, address, iban, swift, signature_base64]);
    } else {
      await db.query(`
        INSERT INTO alygen_config (id, nif, address, iban, swift, signature_base64) VALUES ('global', $1, $2, $3, $4, $5)
      `, [nif, address, iban, swift, signature_base64]);
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao guardar config Alygen local:', error.message);
    return { success: false, error: error.message };
  }
}

export default {
  saveAnalysisToSupabase,
  getAnalysisFromSupabase,
  getAllAnalyses,
  getAllAnalysesMeta,
  deleteOldAnalyses,
  getAnalyticsStats,
  getAutomations,
  upsertAutomation,
  deleteAutomation,
  getAutomationLogs,
  getEmailTemplates,
  upsertEmailTemplate,
  deleteEmailTemplate,
  logContact,
  getContactsLog,
  updateLeadEmail,
  updateLeadCRMData,
  getAlygenConfig,
  saveAlygenConfig
};
