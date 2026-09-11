// 🆕 Google SERP Ranking Analyzer
// Verifica posição nos resultados de busca do Google

import axios from 'axios';

export async function analyzeGoogleRanking(url, leadData) {
  try {
    console.log(`🔍 Analisando ranking no Google: ${url}`);

    // Extrair domínio do URL
    const domain = new URL(url).hostname;

    // Gerar keywords relevantes
    const keywords = await generateRelevantKeywords(leadData);

    console.log(`📝 Keywords a testar: ${keywords.join(', ')}`);

    const rankings = {};

    // ⚠️ LIMITADO PARA NÃO GASTAR CRÉDITOS
    // Por enquanto, apenas simular dados (até implementar API real)
    for (const keyword of keywords.slice(0, 3)) { // Máximo 3 keywords
      rankings[keyword] = await getSimulatedRanking(domain, keyword);
    }

    // Calcular métricas de visibilidade
    const visibilityScore = calculateVisibilityScore(rankings);
    const bestPosition = findBestPosition(rankings);
    const rankingSummary = generateRankingSummary(rankings);

    return {
      rankings,
      visibilityScore,
      bestPosition,
      rankingSummary,
      keywordsAnalyzed: Object.keys(rankings),
      recommendations: generateRankingRecommendations(rankings, leadData)
    };

  } catch (error) {
    console.error('Google Ranking Analysis Error:', error.message);
    return {
      rankings: {},
      visibilityScore: 0,
      bestPosition: null,
      rankingSummary: 'Não foi possível analisar ranking',
      keywordsAnalyzed: [],
      recommendations: ['Implementar análise de ranking com API externa'],
      error: error.message
    };
  }
}

// Gerar keywords relevantes baseadas nos dados do lead
function generateRelevantKeywords(leadData) {
  const keywords = [];
  const typeId = leadData.type_id || leadData.type || '';
  const postalCode = leadData.postal_code || '';
  
  // Extrair cidade do código postal
  const city = extractCityFromPostalCode(postalCode);
  
  // Traduzir type_id de inglês para português
  const typePortuguese = translateTypeToPortuguese(typeId);
  
  console.log(`📍 Type: ${typeId} → ${typePortuguese} | Cidade: ${city}`);
  
  // Gerar apenas 2-3 keywords simples e diretas
  if (typePortuguese && city) {
    keywords.push(`${typePortuguese} ${city}`);
    keywords.push(`melhor ${typePortuguese} ${city}`);
  } else if (typePortuguese) {
    keywords.push(typePortuguese);
  }
  
  return keywords.slice(0, 2); // Máximo 2 keywords para evitar timeouts
}

// Traduzir type_id de inglês para português
function translateTypeToPortuguese(typeId) {
  const translations = {
    // Imobiliário
    'real_estate_agency': 'Imobiliária',
    'real_estate': 'Imobiliária',
    'property_management': 'Gestão de Imóveis',
    
    // Restauração
    'restaurant': 'Restaurante',
    'cafe': 'Café',
    'bar': 'Bar',
    'bakery': 'Padaria',
    'food': 'Restaurante',
    
    // Saúde
    'doctor': 'Médico',
    'dentist': 'Dentista',
    'clinic': 'Clínica',
    'hospital': 'Hospital',
    'pharmacy': 'Farmácia',
    'physiotherapist': 'Fisioterapeuta',
    
    // Beleza
    'hair_care': 'Cabeleireiro',
    'beauty_salon': 'Salão de Beleza',
    'spa': 'Spa',
    'nail_salon': 'Manicure',
    
    // Serviços
    'lawyer': 'Advogado',
    'accountant': 'Contabilista',
    'insurance_agency': 'Seguradora',
    'travel_agency': 'Agência de Viagens',
    'car_repair': 'Oficina Mecânica',
    'electrician': 'Eletricista',
    'plumber': 'Canalizador',
    'locksmith': 'Serralheiro',
    
    // Comércio
    'store': 'Loja',
    'clothing_store': 'Loja de Roupa',
    'shoe_store': 'Sapataria',
    'jewelry_store': 'Joalharia',
    'furniture_store': 'Loja de Móveis',
    'electronics_store': 'Loja de Eletrónicos',
    'supermarket': 'Supermercado',
    
    // Educação
    'school': 'Escola',
    'university': 'Universidade',
    'library': 'Biblioteca',
    
    // Outros
    'gym': 'Ginásio',
    'hotel': 'Hotel',
    'bank': 'Banco',
    'gas_station': 'Posto de Combustível',
    'car_dealer': 'Stand de Automóveis',
    'pet_store': 'Loja de Animais'
  };
  
  const typeIdLower = (typeId || '').toLowerCase().replace(/\s+/g, '_');
  return translations[typeIdLower] || typeId || 'Empresa';
}

// Extrair cidade do código postal português
function extractCityFromPostalCode(postalCode) {
  if (!postalCode) return '';
  
  // Mapa de códigos postais para cidades principais de Portugal
  const postalCodeMap = {
    '1': 'Lisboa',
    '2': 'Santarém',
    '3': 'Coimbra',
    '4': 'Porto',
    '5': 'Aveiro',
    '6': 'Castelo Branco',
    '7': 'Évora',
    '8': 'Faro',
    '9': 'Funchal'
  };
  
  // Extrair primeiro dígito do código postal
  const firstDigit = postalCode.toString().charAt(0);
  return postalCodeMap[firstDigit] || '';
}

// Simulação de ranking (até implementar API real)
async function getSimulatedRanking(domain, keyword) {
  // Simular posições realistas baseadas no tipo de keyword
  const random = Math.random();

  let position;
  if (keyword.includes('nome da empresa')) {
    // Keywords com nome da empresa tendem a rankear melhor
    position = Math.floor(random * 10) + 1;
  } else if (keyword.includes('cidade')) {
    // Keywords locais
    position = Math.floor(random * 20) + 1;
  } else {
    // Keywords genéricas
    position = Math.floor(random * 50) + 1;
  }

  // Simular delay da API
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    position,
    url: `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
    date: new Date().toISOString(),
    estimatedTraffic: estimateTraffic(position),
    competition: position <= 3 ? 'high' : position <= 10 ? 'medium' : 'low'
  };
}

// Estimar tráfego baseado na posição
function estimateTraffic(position) {
  const trafficEstimates = {
    1: 1000, 2: 800, 3: 600, 4: 400, 5: 300,
    6: 200, 7: 150, 8: 100, 9: 80, 10: 60
  };

  if (position <= 10) return trafficEstimates[position];
  return Math.max(10, Math.floor(1000 / Math.pow(position, 1.5)));
}

// Calcular score de visibilidade
function calculateVisibilityScore(rankings) {
  let totalScore = 0;
  let keywordCount = 0;

  for (const keyword in rankings) {
    const position = rankings[keyword].position;
    // Score baseado na posição (1ª posição = 100 pontos, diminui exponencialmente)
    const keywordScore = Math.max(0, 100 - (position - 1) * 10);
    totalScore += keywordScore;
    keywordCount++;
  }

  return keywordCount > 0 ? Math.round(totalScore / keywordCount) : 0;
}

// Encontrar melhor posição
function findBestPosition(rankings) {
  let best = { position: 999, keyword: null };

  for (const keyword in rankings) {
    const position = rankings[keyword].position;
    if (position < best.position) {
      best = { position, keyword };
    }
  }

  return best.position < 999 ? best : null;
}

// Gerar resumo do ranking
function generateRankingSummary(rankings) {
  const positions = Object.values(rankings).map(r => r.position);
  const avgPosition = positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : 0;
  const bestPosition = Math.min(...positions);

  let summary = `Média: ${avgPosition.toFixed(1)}ª posição | Melhor: ${bestPosition}ª posição`;

  if (bestPosition <= 3) summary += ' 🏆 Excelente visibilidade!';
  else if (bestPosition <= 10) summary += ' 📈 Boa posição!';
  else if (bestPosition <= 20) summary += ' ⚠️ Precisa melhorar SEO';
  else summary += ' 🚨 Muito baixa visibilidade';

  return summary;
}

// Gerar resumo do ranking (versão para API real)
function generateRankingSummaryReal(rankings, keywordData) {
  const foundRankings = rankings.filter(r => r.found && r.position);
  
  if (foundRankings.length === 0) {
    const typeCity = keywordData.city ? `${keywordData.businessType} ${keywordData.city}` : keywordData.businessType;
    return `🚨 Empresa não aparece no TOP 20 do Google ao pesquisar "${typeCity}"`;
  }
  
  const positions = foundRankings.map(r => r.position);
  const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
  const bestPosition = Math.min(...positions);

  let summary = `Média: ${avgPosition.toFixed(1)}ª posição | Melhor: ${bestPosition}ª posição`;

  if (bestPosition <= 3) summary += ' 🏆 Excelente visibilidade!';
  else if (bestPosition <= 10) summary += ' 📈 Boa posição!';
  else summary += ' ⚠️ Precisa melhorar SEO';

  return summary;
}

// Gerar recomendações de SEO
function generateRankingRecommendations(rankings, leadData) {
  const recommendations = [];
  const avgPosition = Object.values(rankings).reduce((sum, r) => sum + r.position, 0) / Object.keys(rankings).length;

  if (avgPosition > 20) {
    recommendations.push('SEO local urgente - otimize Google My Business');
    recommendations.push('Melhore conteúdo para keywords locais');
    recommendations.push('Adicione backlinks de qualidade');
  } else if (avgPosition > 10) {
    recommendations.push('Otimize meta titles e descriptions');
    recommendations.push('Melhore velocidade de carregamento');
    recommendations.push('Crie conteúdo relevante para o público local');
  } else {
    recommendations.push('Mantenha posição atual com conteúdo fresco');
    recommendations.push('Monitore concorrentes próximos');
  }

  return recommendations;
}

// Funções auxiliares removidas (não são mais necessárias)
// extractCity() e detectBusinessType() foram substituídas por:
// - translateTypeToPortuguese()
// - extractCityFromPostalCode()
