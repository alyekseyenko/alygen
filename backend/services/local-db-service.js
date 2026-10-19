import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'alygen_crm',
  connectionTimeoutMillis: 5000,
});

let postgresReady = false;

let resolveDbReady;
export const dbReady = new Promise((resolve) => {
  resolveDbReady = resolve;
});

function finishDbReady() {
  resolveDbReady?.();
  resolveDbReady = null;
}

/** @deprecated Always Postgres when ready; kept for callers that branch on dialect. */
export function isPostgresPrimary() {
  return postgresReady;
}

async function initPostgresSchema() {
  const maxAttempts = parseInt(process.env.PG_CONNECT_RETRIES || '15', 10);
  const delayMs = parseInt(process.env.PG_CONNECT_RETRY_MS || '2000', 10);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let client;
    try {
      client = await pool.connect();
      console.log('🐘 PostgreSQL: Conectado com sucesso ao servidor local!');
      postgresReady = true;

      await client.query(`
      CREATE TABLE IF NOT EXISTS lead_analyses (
        id TEXT PRIMARY KEY,
        lead_name TEXT,
        lead_website TEXT UNIQUE NOT NULL,
        lead_email TEXT,
        lead_phone TEXT,
        lead_address TEXT,
        lead_city TEXT,
        lead_type TEXT,
        qscore REAL DEFAULT 0,
        qscore_grade TEXT,
        priority TEXT,
        performance_mobile REAL DEFAULT 0,
        performance_desktop REAL DEFAULT 0,
        seo_score REAL DEFAULT 0,
        security_score REAL DEFAULT 0,
        security_has_ssl INTEGER DEFAULT 0,
        accessibility_score REAL DEFAULT 0,
        tracking_total INTEGER DEFAULT 0,
        is_social_media_only INTEGER DEFAULT 0,
        crm_stage TEXT DEFAULT 'LEAD',
        budget REAL DEFAULT 0,
        is_immune INTEGER DEFAULT 0,
        private_notes TEXT,
        client_email TEXT,
        client_phone TEXT,
        client_address TEXT,
        client_nif TEXT,
        contact_person TEXT,
        project_type TEXT DEFAULT 'WEBSITE',
        budget_items TEXT,
        third_party_services TEXT,
        discount_percentage REAL DEFAULT 0,
        full_analysis TEXT NOT NULL,
        analyzed_at TEXT,
        rating REAL,
        reviews_count INTEGER,
        latitude REAL,
        longitude REAL,
        core_web_vitals TEXT,
        geo_score REAL DEFAULT 0,
        local_seo_score REAL DEFAULT 0,
        schema_detected TEXT,
        ai_win_rate REAL DEFAULT 0,
        sales_hook TEXT,
        agent_intel TEXT,
        agent_intel_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS rating REAL;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS reviews_count INTEGER;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS latitude REAL;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS longitude REAL;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS core_web_vitals TEXT;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS geo_score REAL DEFAULT 0;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS local_seo_score REAL DEFAULT 0;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS schema_detected TEXT;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS ai_win_rate REAL DEFAULT 0;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS sales_hook TEXT;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS agent_intel TEXT;
      ALTER TABLE lead_analyses ADD COLUMN IF NOT EXISTS agent_intel_at TIMESTAMP;

      CREATE TABLE IF NOT EXISTS alygen_config (
        id TEXT PRIMARY KEY DEFAULT 'global',
        nif TEXT,
        address TEXT,
        iban TEXT,
        swift TEXT,
        signature_base64 TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        certificate_id TEXT UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        website TEXT NOT NULL,
        qscore INTEGER NOT NULL,
        qgrade TEXT NOT NULL,
        metrics TEXT,
        issued_at TEXT,
        valid_until TEXT,
        full_certificate TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS semantic_memories (
        id SERIAL PRIMARY KEY,
        sector TEXT NOT NULL,
        district TEXT NOT NULL,
        company_name TEXT,
        website TEXT,
        pain_points TEXT,
        competitors TEXT,
        intel_text TEXT,
        embedding vector(768),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS automations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        trigger TEXT,
        nodes TEXT,
        edges TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS automation_logs (
        id SERIAL PRIMARY KEY,
        automation_id TEXT,
        lead_website TEXT,
        status TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contacts_log (
        id SERIAL PRIMARY KEY,
        lead_name TEXT,
        website TEXT,
        type TEXT,
        phone TEXT,
        message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS automation_states (
        id TEXT PRIMARY KEY,
        automation_id TEXT,
        lead_id TEXT,
        current_node_id TEXT,
        context TEXT,
        resume_at TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS email_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body_html TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

      const { runMigrations } = await import('../db/run-migrations.js');
      await runMigrations({ query: (sql, params) => client.query(sql, params) }, { dialect: 'postgres' });
      console.log('✅ PostgreSQL: Esquema de base de dados verificado e inicializado com sucesso.');
      finishDbReady();
      return;
    } catch (error) {
      postgresReady = false;
      if (attempt >= maxAttempts) {
        console.error(
          '❌ PostgreSQL indisponível após várias tentativas. Arranca `docker compose up postgres -d`.',
          error.message
        );
      } else {
        console.warn(
          `⚠️ PostgreSQL indisponível (tentativa ${attempt}/${maxAttempts}): ${error.message} — nova tentativa em ${delayMs}ms`
        );
        await new Promise((r) => setTimeout(r, delayMs));
      }
    } finally {
      if (client) client.release();
    }
  }
  finishDbReady();
}

initPostgresSchema();

export const db = {
  async query(sql, params = []) {
    if (!postgresReady) {
      throw new Error(
        'PostgreSQL indisponível. Arranca `docker compose up postgres -d` e reinicia o backend.'
      );
    }
    return pool.query(sql, params);
  },
};

export { pool };
export default db;
