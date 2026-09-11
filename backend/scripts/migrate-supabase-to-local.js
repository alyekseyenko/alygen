import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import db from '../services/local-db-service.js';
import crypto from 'crypto';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

async function migrate() {
  console.log('🔄 Iniciando migração do Supabase Cloud -> SQLite Local...');

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Supabase URL ou Key não definidos no .env. Ignorando download do Supabase Cloud.');
    console.log('✅ A Base de Dados Local SQLite está pronta e a funcionar vazia/limpa.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // 1. Migrar lead_analyses
    console.log('📥 Descarregando lead_analyses do Supabase...');
    const { data: analyses, error: err1 } = await supabase.from('lead_analyses').select('*');
    if (err1) {
      console.warn('⚠️ Não foi possível obter lead_analyses do Supabase Cloud:', err1.message);
    } else if (analyses && analyses.length > 0) {
      console.log(`📦 A importar ${analyses.length} análises/leads para o SQLite local...`);
      const stmt = db.prepare(`
        INSERT INTO lead_analyses (
          id, lead_name, lead_website, lead_email, lead_phone, lead_address, lead_city, lead_type,
          qscore, qscore_grade, priority, performance_mobile, performance_desktop, seo_score,
          security_score, security_has_ssl, accessibility_score, tracking_total, is_social_media_only,
          crm_stage, budget, is_immune, private_notes, client_email, client_phone, client_address,
          client_nif, contact_person, project_type, budget_items, third_party_services, discount_percentage,
          full_analysis, analyzed_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?
        ) ON CONFLICT(lead_website) DO UPDATE SET
          lead_name = excluded.lead_name,
          qscore = excluded.qscore,
          qscore_grade = excluded.qscore_grade,
          priority = excluded.priority,
          crm_stage = excluded.crm_stage,
          budget = excluded.budget,
          is_immune = excluded.is_immune,
          full_analysis = excluded.full_analysis,
          updated_at = CURRENT_TIMESTAMP
      `);

      for (const row of analyses) {
        let fullAnalysisStr = row.full_analysis;
        if (typeof fullAnalysisStr === 'object') {
          fullAnalysisStr = JSON.stringify(fullAnalysisStr);
        } else if (!fullAnalysisStr) {
          fullAnalysisStr = JSON.stringify({ website: row.lead_website, name: row.lead_name });
        }

        stmt.run(
          row.id || crypto.randomUUID(),
          row.lead_name || null,
          row.lead_website,
          row.lead_email || null,
          row.lead_phone || null,
          row.lead_address || null,
          row.lead_city || null,
          row.lead_type || null,
          row.qscore || 0,
          row.qscore_grade || 'F',
          row.priority || null,
          row.performance_mobile || 0,
          row.performance_desktop || 0,
          row.seo_score || 0,
          row.security_score || 0,
          row.security_has_ssl ? 1 : 0,
          row.accessibility_score || 0,
          row.tracking_total || 0,
          row.is_social_media_only ? 1 : 0,
          row.crm_stage || 'LEAD',
          row.budget || 0,
          row.is_immune ? 1 : 0,
          row.private_notes || null,
          row.client_email || null,
          row.client_phone || null,
          row.client_address || null,
          row.client_nif || null,
          row.contact_person || null,
          row.project_type || 'WEBSITE',
          row.budget_items ? JSON.stringify(row.budget_items) : null,
          row.third_party_services ? JSON.stringify(row.third_party_services) : null,
          row.discount_percentage || 0,
          fullAnalysisStr,
          row.analyzed_at || new Date().toISOString()
        );
      }
      console.log('✅ Lead analyses migradas com sucesso!');
    }

    // 2. Migrar alygen_config
    console.log('📥 Descarregando alygen_config do Supabase...');
    const { data: configs } = await supabase.from('alygen_config').select('*');
    if (configs && configs.length > 0) {
      const cfg = configs[0];
      db.prepare(`
        INSERT INTO alygen_config (id, nif, address, iban, swift, signature_base64)
        VALUES ('global', ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          nif=excluded.nif, address=excluded.address, iban=excluded.iban,
          swift=excluded.swift, signature_base64=excluded.signature_base64
      `).run(cfg.nif || null, cfg.address || null, cfg.iban || null, cfg.swift || null, cfg.signature_base64 || null);
      console.log('✅ Configurações fiscais Alygen migradas!');
    }

    // 3. Migrar email_templates
    console.log('📥 Descarregando email_templates do Supabase...');
    const { data: templates } = await supabase.from('email_templates').select('*');
    if (templates && templates.length > 0) {
      const stmt = db.prepare(`
        INSERT INTO email_templates (id, name, subject, body_html) VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET name=excluded.name, subject=excluded.subject, body_html=excluded.body_html
      `);
      for (const t of templates) {
        stmt.run(t.id || crypto.randomUUID(), t.name, t.subject, t.body_html);
      }
      console.log('✅ Email templates migrados!');
    }

    console.log('🎉 Migração concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro na migração de dados:', err.message);
  }
}

migrate();
