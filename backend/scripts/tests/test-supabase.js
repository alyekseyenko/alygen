import dotenv from 'dotenv';
import { saveAnalysisToSupabase, getAnalysisFromSupabase, getAllAnalyses, getAnalyticsStats } from './services/supabase-service.js';

dotenv.config();

console.log('🧪 Testando integração Supabase...\n');

// Mock de dados de teste
const mockLeadData = {
  name: 'Empresa Teste',
  website: 'https://example-test.com',
  email: 'contato@example-test.com',
  phone: '(11) 99999-9999',
  city: 'São Paulo',
  type: 'Restaurante'
};

const mockAnalysis = {
  qScore: { score: 75, grade: 'B', category: 'Bom' },
  performanceMobile: 85,
  performanceScore: 90,
  seo: {
    score: 80,
    title: 'Empresa Teste - Melhor Restaurante',
    hasTitle: true,
    hasMetaDescription: true,
    h1Count: 1,
    imagesWithoutAlt: 2,
    hasSitemap: true,
    hasRobotsTxt: true
  },
  security: {
    score: 100,
    hasSSL: true
  },
  accessibility: {
    score: 70,
    errors: 3,
    warnings: 5
  },
  pixelDetails: {
    totalTracking: 4,
    facebook: true,
    ga4: true,
    gtm: true,
    googleAds: false
  },
  priority: 'MÉDIA'
};

async function testSupabase() {
  try {
    // 1. Testar salvamento
    console.log('1️⃣ Testando salvamento...');
    const saveResult = await saveAnalysisToSupabase(mockLeadData, mockAnalysis);
    
    if (saveResult.success) {
      console.log('✅ Análise salva com sucesso!\n');
    } else {
      console.log('❌ Erro ao salvar:', saveResult.error, '\n');
      return;
    }

    // 2. Testar busca específica
    console.log('2️⃣ Testando busca específica...');
    const getResult = await getAnalysisFromSupabase(mockLeadData.website);
    
    if (getResult.success) {
      console.log('✅ Análise recuperada com sucesso!');
      console.log(`   Q-Score: ${getResult.data.qScore?.score || 0}`);
      console.log(`   Cached em: ${getResult.cachedAt}\n`);
    } else {
      console.log('❌ Erro ao buscar:', getResult.error, '\n');
    }

    // 3. Testar listagem
    console.log('3️⃣ Testando listagem de todas as análises...');
    const allResult = await getAllAnalyses();
    
    if (allResult.success) {
      console.log(`✅ ${allResult.count} análises encontradas!\n`);
    } else {
      console.log('❌ Erro ao listar:', allResult.error, '\n');
    }

    // 4. Testar estatísticas
    console.log('4️⃣ Testando estatísticas...');
    const statsResult = await getAnalyticsStats();
    
    if (statsResult.success) {
      console.log('✅ Estatísticas calculadas:');
      console.log(`   Total: ${statsResult.stats.total}`);
      console.log(`   Q-Score médio: ${statsResult.stats.avgQScore.toFixed(2)}`);
      console.log(`   Sem SSL: ${statsResult.stats.withoutSSL}`);
      console.log(`   Alta prioridade: ${statsResult.stats.highPriority}\n`);
    } else {
      console.log('❌ Erro ao calcular stats:', statsResult.error, '\n');
    }

    console.log('🎉 Todos os testes concluídos!');

  } catch (error) {
    console.error('❌ Erro nos testes:', error);
  }
}

testSupabase();
