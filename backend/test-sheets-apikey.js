import { GoogleSpreadsheet } from 'google-spreadsheet';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

console.log('🔍 Testing Google Sheets access using API Key...');
console.log('Sheet ID:', process.env.GOOGLE_SHEET_ID);
console.log('API Key:', process.env.PAGESPEED_API_KEY ? 'Present' : 'Missing');

try {
  // Try with API key (requires the sheet to be "Anyone with link can view")
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, { apiKey: process.env.PAGESPEED_API_KEY });
  await doc.loadInfo();
  console.log('✅ Connected successfully with API Key!');
  console.log('Title:', doc.title);
  const sheet = doc.sheetsByIndex[0];
  console.log('Sheet Name:', sheet.title);
  const rows = await sheet.getRows();
  console.log(`📊 Found ${rows.length} rows!`);
} catch (error) {
  console.error('❌ API Key method failed:', error.message);
}
