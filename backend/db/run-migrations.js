import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, 'migrations');

function splitStatements(sql) {
  const trimmed = sql.trim();
  // PL/pgSQL ($$ ... $$) não pode ser partido por ';' — corre o ficheiro inteiro
  if (trimmed.includes('$$')) {
    return [trimmed];
  }
  return trimmed
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
}

/**
 * Aplica migrações SQL numeradas. Funciona em Postgres; em SQLite ignora extensões vector/tsvector.
 */
export async function runMigrations(db, { dialect = 'postgres' } = {}) {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const name = file.replace(/\.sql$/, '');
    const check = await db.query('SELECT 1 FROM schema_migrations WHERE name = $1 LIMIT 1', [name]).catch(() => ({ rows: [] }));
    if (check.rows?.length) continue;

    const raw = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    let sql = raw;
    if (dialect === 'sqlite') {
      sql = sql
        .replace(/CREATE EXTENSION IF NOT EXISTS vector;?/gi, '')
        .replace(/vector\(768\)/gi, 'TEXT')
        .replace(/\btsvector\b/gi, 'TEXT')
        .replace(/USING GIN\(tsv\)/gi, '')
        .replace(/ADD COLUMN IF NOT EXISTS/gi, 'ADD COLUMN')
        .replace(/ALTER TABLE ([a-z_]+) ADD COLUMN IF NOT EXISTS/gi, '-- sqlite alter skipped');
    }

    for (const statement of splitStatements(sql)) {
      if (statement.includes('-- sqlite alter skipped')) {
        try {
          const colMatch = statement.match(/ADD COLUMN (\w+)/i);
          if (colMatch) {
            await db.query(`ALTER TABLE automations ADD COLUMN ${colMatch[1]} TEXT`).catch(() => {});
          }
        } catch { /* ignore */ }
        continue;
      }
      try {
        await db.query(statement);
      } catch (err) {
        if (dialect === 'sqlite' && /duplicate column|already exists/i.test(err.message)) continue;
        throw new Error(`Migration ${file}: ${err.message}`);
      }
    }

    await db.query('INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [name]).catch(async () => {
      await db.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]).catch(() => {});
    });
    console.log(`✅ Migration applied: ${name}`);
  }
}

export default runMigrations;
