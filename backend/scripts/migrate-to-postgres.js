import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

console.log('🔄 ALYGEN DATABASE MIGRATOR: SQLite -> PostgreSQL 🚀');

const sqliteDbPath = path.join(__dirname, '..', 'data', 'crm_local.db');

if (!fs.existsSync(sqliteDbPath)) {
  console.log('⚠️ SQLite database file not found at:', sqliteDbPath);
  console.log('Nothing to migrate. Exiting...');
  process.exit(0);
}

const sqliteDb = new Database(sqliteDbPath);

const pgPool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'alygen_crm',
});

async function runMigration() {
  let pgClient;
  try {
    pgClient = await pgPool.connect();
    console.log('✅ Connected to local PostgreSQL database.');

    // 1. Migrate lead_analyses
    console.log('⏳ Migrating [lead_analyses]...');
    const leads = sqliteDb.prepare('SELECT * FROM lead_analyses').all();
    console.log(`Found ${leads.length} leads in SQLite.`);
    
    for (const lead of leads) {
      await pgClient.query(`
        INSERT INTO lead_analyses (
          id, lead_name, lead_website, lead_email, lead_phone, lead_address, lead_city, lead_type,
          qscore, qscore_grade, priority, performance_mobile, performance_desktop, seo_score,
          security_score, security_has_ssl, accessibility_score, tracking_total, is_social_media_only,
          crm_stage, budget, is_immune, private_notes, client_email, client_phone, client_address,
          client_nif, contact_person, project_type, budget_items, third_party_services,
          discount_percentage, full_analysis, analyzed_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22,
          $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34
        ) ON CONFLICT (lead_website) DO NOTHING
      `, [
        lead.id, lead.lead_name, lead.lead_website, lead.lead_email, lead.lead_phone, lead.lead_address, lead.lead_city, lead.lead_type,
        lead.qscore, lead.qscore_grade, lead.priority, lead.performance_mobile, lead.performance_desktop, lead.seo_score,
        lead.security_score, lead.security_has_ssl, lead.accessibility_score, lead.tracking_total, lead.is_social_media_only,
        lead.crm_stage, lead.budget, lead.is_immune, lead.private_notes, lead.client_email, lead.client_phone, lead.client_address,
        lead.client_nif, lead.contact_person, lead.project_type, lead.budget_items, lead.third_party_services,
        lead.discount_percentage, lead.full_analysis, lead.analyzed_at
      ]);
    }
    console.log('✅ Lead analyses migrated.');

    // 2. Migrate alygen_config
    console.log('⏳ Migrating [alygen_config]...');
    const configs = sqliteDb.prepare('SELECT * FROM alygen_config').all();
    for (const conf of configs) {
      await pgClient.query(`
        INSERT INTO alygen_config (id, nif, address, iban, swift, signature_base64)
        VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING
      `, [conf.id, conf.nif, conf.address, conf.iban, conf.swift, conf.signature_base64]);
    }
    console.log('✅ Alygen config migrated.');

    // 3. Migrate certificates
    console.log('⏳ Migrating [certificates]...');
    const certs = sqliteDb.prepare('SELECT * FROM certificates').all();
    for (const cert of certs) {
      await pgClient.query(`
        INSERT INTO certificates (certificate_id, company_name, website, qscore, qgrade, metrics, issued_at, valid_until, full_certificate)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (certificate_id) DO NOTHING
      `, [cert.certificate_id, cert.company_name, cert.website, cert.qscore, cert.qgrade, cert.metrics, cert.issued_at, cert.valid_until, cert.full_certificate]);
    }
    console.log('✅ Certificates migrated.');

    // 4. Migrate automations
    console.log('⏳ Migrating [automations]...');
    const automations = sqliteDb.prepare('SELECT * FROM automations').all();
    for (const aut of automations) {
      await pgClient.query(`
        INSERT INTO automations (id, name, trigger, nodes, edges, is_active)
        VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING
      `, [aut.id, aut.name, aut.trigger, aut.nodes, aut.edges, aut.is_active]);
    }
    console.log('✅ Automations migrated.');

    // 5. Migrate automation_logs
    console.log('⏳ Migrating [automation_logs]...');
    const logs = sqliteDb.prepare('SELECT * FROM automation_logs').all();
    for (const log of logs) {
      await pgClient.query(`
        INSERT INTO automation_logs (automation_id, lead_website, status, details)
        VALUES ($1, $2, $3, $4)
      `, [log.automation_id, log.lead_website, log.status, log.details]);
    }
    console.log('✅ Automation logs migrated.');

    // 6. Migrate contacts_log
    console.log('⏳ Migrating [contacts_log]...');
    const contacts = sqliteDb.prepare('SELECT * FROM contacts_log').all();
    for (const cont of contacts) {
      await pgClient.query(`
        INSERT INTO contacts_log (lead_name, website, type, phone, message)
        VALUES ($1, $2, $3, $4, $5)
      `, [cont.lead_name, cont.website, cont.type, cont.phone, cont.message]);
    }
    console.log('✅ Contacts log migrated.');

    // 7. Migrate automation_states
    console.log('⏳ Migrating [automation_states]...');
    const states = sqliteDb.prepare('SELECT * FROM automation_states').all();
    for (const st of states) {
      await pgClient.query(`
        INSERT INTO automation_states (id, automation_id, lead_id, current_node_id, context, resume_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING
      `, [st.id, st.automation_id, st.lead_id, st.current_node_id, st.context, st.resume_at, st.status]);
    }
    console.log('✅ Automation states migrated.');

    // 8. Migrate email_templates
    console.log('⏳ Migrating [email_templates]...');
    const templates = sqliteDb.prepare('SELECT * FROM email_templates').all();
    for (const temp of templates) {
      await pgClient.query(`
        INSERT INTO email_templates (id, name, subject, body_html)
        VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING
      `, [temp.id, temp.name, temp.subject, temp.body_html]);
    }
    console.log('✅ Email templates migrated.');

    console.log('\n🎉 ALL DATA MIGRATED SUCCESSFULLY TO LOCAL POSTGRESQL! 🎉');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    if (pgClient) pgClient.release();
    sqliteDb.close();
    await pgPool.end();
  }
}

runMigration();
