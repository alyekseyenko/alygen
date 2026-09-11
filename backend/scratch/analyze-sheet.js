import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const credentials = JSON.parse(
  readFileSync(join(__dirname, '..', 'google-credentials.json'), 'utf8')
);

const serviceAccountAuth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function run() {
  console.log('Reading Google Sheet...');
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  
  const sheet = doc.sheetsByTitle['Results'] || doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  console.log(`Total rows: ${rows.length}`);
  
  const seenPlaceIds = new Set();
  const seenWebsites = new Set();
  const leads = [];
  
  for (const row of rows) {
    const placeId = row.get('place_id');
    const website = row.get('website');
    
    if (!website) continue;
    
    // Exact deduplication of sheets.js:
    if ((placeId && seenPlaceIds.has(placeId)) || seenWebsites.has(website)) {
      continue;
    }
    
    if (placeId) seenPlaceIds.add(placeId);
    seenWebsites.add(website);
    
    leads.push({
      name: row.get('title') || website,
      website: website,
      phone: row.get('phone') || ''
    });
  }
  
  console.log(`Leads after exact sheets.js deduplication: ${leads.length}`);
  console.log(`Leads with phone: ${leads.filter(l => l.phone).length}`);
}

run().catch(console.error);
