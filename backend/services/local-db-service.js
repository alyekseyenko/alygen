import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 1. Initialize SQLite Local Database (Graceful Fallback)
const dbPath = path.join(dataDir, 'crm_local.db');
const sqliteDb = new Database(dbPath);
sqliteDb.pragma('journal_mode = WAL');

function initSqliteSchema() {
  sqliteDb.exec(`
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
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alygen_config (
      id TEXT PRIMARY KEY DEFAULT 'global',
      nif TEXT,
      address TEXT,
      iban TEXT,
      swift TEXT,
      signature_base64 TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_id TEXT UNIQUE NOT NULL,
      company_name TEXT NOT NULL,
      website TEXT NOT NULL,
      qscore INTEGER NOT NULL,
      qgrade TEXT NOT NULL,
      metrics TEXT,
      issued_at TEXT,
      valid_until TEXT,
      full_certificate TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS semantic_memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector TEXT NOT NULL,
      district TEXT NOT NULL,
      company_name TEXT,
      website TEXT,
      pain_points TEXT,
      competitors TEXT,
      embedding TEXT, -- JSON array fallback for SQLite
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS automations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      trigger TEXT,
      nodes TEXT,
      edges TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS automation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      automation_id TEXT,
      lead_website TEXT,
      status TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_name TEXT,
      website TEXT,
      type TEXT,
      phone TEXT,
      message TEXT,
      sent_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS automation_states (
      id TEXT PRIMARY KEY,
      automation_id TEXT,
      lead_id TEXT,
      current_node_id TEXT,
      context TEXT,
      resume_at TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      body_html TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Run dynamic migrations for existing SQLite installations
  try { sqliteDb.exec("ALTER TABLE lead_analyses ADD COLUMN rating REAL;"); } catch (e) {}
  try { sqliteDb.exec("ALTER TABLE lead_analyses ADD COLUMN reviews_count INTEGER;"); } catch (e) {}
  try { sqliteDb.exec("ALTER TABLE lead_analyses ADD COLUMN latitude REAL;"); } catch (e) {}
  try { sqliteDb.exec("ALTER TABLE lead_analyses ADD COLUMN longitude REAL;"); } catch (e) {}
  try { sqliteDb.exec("ALTER TABLE lead_analyses ADD COLUMN core_web_vitals TEXT;"); } catch (e) {}
  try { sqliteDb.exec("ALTER TABLE lead_analyses ADD COLUMN geo_score REAL DEFAULT 0;"); } catch (e) {}
  try { sqliteDb.exec("ALTER TABLE lead_analyses ADD COLUMN local_seo_score REAL DEFAULT 0;"); } catch (e) {}
  try { sqliteDb.exec("ALTER TABLE lead_analyses ADD COLUMN schema_detected TEXT;"); } catch (e) {}
  try { sqliteDb.exec("ALTER TABLE lead_analyses ADD COLUMN ai_win_rate REAL DEFAULT 0;"); } catch (e) {}
  try { sqliteDb.exec("ALTER TABLE lead_analyses ADD COLUMN sales_hook TEXT;"); } catch (e) {}
}
initSqliteSchema();

// 2. Initialize PostgreSQL Pool
const { Pool } = pg;
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'alygen_crm',
  connectionTimeoutMillis: 1500,
});

let usePostgres = false;

// Check connection and initialize Postgres Schema if online
async function initPostgresSchema() {
  let client;
  try {
    client = await pool.connect();
    console.log('🐘 PostgreSQL: Conectado com sucesso ao servidor local!');
    usePostgres = true;

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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Run dynamic migrations for existing Postgres installations
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

      -- Enable pgvector support in PostgreSQL
      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS semantic_memories (
        id SERIAL PRIMARY KEY,
        sector TEXT NOT NULL,
        district TEXT NOT NULL,
        company_name TEXT,
        website TEXT,
        pain_points TEXT,
        competitors TEXT,
        embedding vector(1536), -- Standard size for Llama/OpenAI/Gemini
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
    console.log('✅ PostgreSQL: Esquema de base de dados verificado e inicializado com sucesso.');
  } catch (error) {
    console.warn('⚠️ [PostgreSQL Failsafe] Falha ao ligar ao PostgreSQL local. Usando SQLite Local como Fallback!');
    usePostgres = false;
  } finally {
    if (client) client.release();
  }
}

initPostgresSchema();

// 3. Dual-Database Dynamic Query Abstraction
export const db = {
  async query(sql, params = []) {
    if (usePostgres) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        console.error('❌ Erro no PostgreSQL, aplicando fallback dinâmico para SQLite:', err.message);
      }
    }

    // SQLite Fallback translation: convert $1, $2 parameters to ? and ILIKE to LIKE
    const sqliteSql = sql.replace(/\$\d+/g, '?').replace(/\bILIKE\b/gi, 'LIKE');
    const isSelect = sqliteSql.trim().toUpperCase().startsWith('SELECT');

    try {
      if (isSelect) {
        const stmt = sqliteDb.prepare(sqliteSql);
        const rows = stmt.all(...params);
        return { rows, rowCount: rows.length };
      } else {
        const stmt = sqliteDb.prepare(sqliteSql);
        const info = stmt.run(...params);
        return { rows: [], rowCount: info.changes };
      }
    } catch (sqliteErr) {
      console.error('❌ Erro na base de dados SQLite Fallback:', sqliteErr.message);
      throw sqliteErr;
    }
  },

  // 100% Backward Compatibility with legacy better-sqlite3 prepare() syntax
  prepare(sql) {
    const sqliteSql = sql.replace(/\$\d+/g, '?').replace(/\bILIKE\b/gi, 'LIKE');
    return sqliteDb.prepare(sqliteSql);
  }
};

export { pool };
export default db;
