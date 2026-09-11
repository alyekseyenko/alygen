import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import axios from 'axios';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais Supabase não encontradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function trainModel() {
  console.log('🚀 A iniciar o treino do modelo ML...');
  
  // Buscar os leads com scores do Supabase
  const { data: analyses, error } = await supabase
    .from('lead_analyses')
    .select('qscore, performance_mobile, seo_score, security_score, accessibility_score, tracking_total, crm_stage')
    .not('crm_stage', 'is', null);
    
  if (error) {
    console.error('❌ Erro ao buscar análises:', error);
    process.exit(1);
  }
  
  console.log(`📊 Foram encontrados ${analyses.length} registos históricos com estado CRM.`);
  
  if (analyses.length < 20) {
      console.log('⚠️ O modelo ML aconselha no mínimo 20 registos onde crm_stage="CLOSED" ou "FECHADO" vs outros, mas vamos tentar na mesma para testar...');
  }
  
  try {
    const pythonUrl = process.env.PYTHON_FASTAPI_URL || 'http://localhost:3003';
    const { data } = await axios.post(`${pythonUrl}/ml/train`, analyses, { timeout: 30000 });
    if (data.success) {
      console.log(`✅ Sucesso! O modelo tem uma Accuracy de ${data.accuracy}% treinado com ${data.samples} exemplos.`);
    } else {
      console.error('❌ Falha:', data.error);
    }
  } catch (err) {
    console.error('❌ Erro na API Python:', err.message);
  }
  
  process.exit(0);
}

trainModel();
