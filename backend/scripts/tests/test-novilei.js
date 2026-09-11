import axios from 'axios';

const testLead = {
  url: 'https://www.novilei.pt/',
  name: 'Novilei',
  type: 'Real estate agency',
  type_id: 'real_estate_agency',
  address: 'R. Combatentes da Grande Guerra 56, 2400-122 Leiria, Portugal',
  postal_code: '2400',
  phone: '',
  rating: '4.5',
  reviews: '50'
};

console.log('🧪 Testando análise de: https://www.novilei.pt/');
console.log('📍 Imobiliária em Leiria');
console.log('');

axios.post('http://localhost:3005/api/analyze-lead', testLead)
  .then(response => {
    console.log('✅ Análise concluída!');
    console.log('');
    console.log('📊 RESULTADOS:');
    console.log('─────────────────────────────────────');
    console.log(`Score Geral: ${response.data.analysis.overallScore}/100`);
    console.log(`Performance Mobile: ${response.data.analysis.performanceMobile}/100`);
    console.log(`SEO Score: ${response.data.analysis.seo?.score}/100`);
    console.log(`Tracking: ${response.data.analysis.pixelDetails?.totalTracking}/7`);
    console.log(`Prioridade: ${response.data.analysis.priority}`);
    
    if (response.data.analysis.googleRanking) {
      console.log('');
      console.log('🔍 RANKING GOOGLE:');
      console.log('─────────────────────────────────────');
      console.log(`Visibilidade: ${response.data.analysis.googleRanking.visibilityScore}/100`);
      console.log(`Keywords testadas: ${response.data.analysis.googleRanking.keywordData?.keywords?.join(', ')}`);
      
      if (response.data.analysis.googleRanking.stats?.bestPosition) {
        console.log(`✅ Melhor posição: #${response.data.analysis.googleRanking.stats.bestPosition}`);
      } else {
        console.log('❌ Não encontrado no TOP 10');
      }
      
      console.log(`Resumo: ${response.data.analysis.googleRanking.rankingSummary}`);
    }
    
    console.log('');
    console.log('📧 Emails encontrados:', response.data.analysis.extractedEmails || 'Nenhum');
    console.log('');
  })
  .catch(error => {
    console.error('❌ Erro na análise:', error.response?.data || error.message);
  });
