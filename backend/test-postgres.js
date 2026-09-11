import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

console.log('🔍 Testing local PostgreSQL Connection...');
console.log('Host:', process.env.PGHOST || 'localhost');
console.log('Port:', process.env.PGPORT || '5432');
console.log('User:', process.env.PGUSER || 'postgres');
console.log('Database:', process.env.PGDATABASE || 'alygen_crm');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'alygen_crm',
});

try {
  const client = await pool.connect();
  console.log('✅ Connection to PostgreSQL succeeded!');
  const res = await client.query('SELECT NOW()');
  console.log('Current Time from DB:', res.rows[0].now);
  client.release();
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  console.log('\n💡 Setup instructions:');
  console.log('1. Make sure your local PostgreSQL server is running.');
  console.log('2. Create a database named "alygen_crm" using pgAdmin or psql: CREATE DATABASE alygen_crm;');
  console.log('3. Ensure credentials in backend/.env match your local PostgreSQL.');
} finally {
  await pool.end();
}
