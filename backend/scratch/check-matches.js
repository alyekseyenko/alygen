import { fetchLeads } from '../services/sheets.js';
import { getAllAnalysesMeta } from '../services/supabase-service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const normalizeUrl = (url) => {
  if (!url) return '';
  return url.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
};

async function check() {
  console.log('🔍 Checking matches between Sheets and Supabase...');
  
  const { leads } = await fetchLeads();
  const { data: analyses } = await getAllAnalysesMeta(5000);
  
  console.log(`📊 Sheets: ${leads.length} leads`);
  console.log(`📊 Supabase: ${analyses.length} analyses`);
  
  const analysisMap = {};
  analyses.forEach(a => {
    analysisMap[normalizeUrl(a.website)] = a;
  });
  
  let matches = 0;
  let mismatches = [];
  
  leads.forEach(lead => {
    const norm = normalizeUrl(lead.website);
    if (analysisMap[norm]) {
      matches++;
    } else {
      if (mismatches.length < 10) mismatches.push(lead.website);
    }
  });
  
  console.log(`✅ Matches: ${matches}`);
  console.log(`❌ Mismatches: ${leads.length - matches}`);
  
  if (mismatches.length > 0) {
    console.log('📋 Example mismatches (Sheets URL):');
    mismatches.forEach(m => console.log(`  - ${m}`));
    
    console.log('📋 Example Supabase URLs:');
    analyses.slice(0, 5).forEach(a => console.log(`  - ${a.website}`));
  }
}

check();
