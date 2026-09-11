import axios from 'axios';
import * as cheerio from 'cheerio';

// 🔍 Google Ranking Analyzer - ScraperAPI Version

// Extrair código postal do endereço
function extractPostalCode(address) {
  if (!address) return null;
  
  // Padrões de código postal português: 1000-001, 2410, 4000-123
  const patterns = [
    /\b(\d{4})[-\s]?(\d{3})?\b/,
    /\b(\d{4})\b/
  ];
  
  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Extrair cidade do endereço
function extractCity(address) {
  if (!address) return '';
  
  const cityMatch = address.match(/([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+(?:\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+)*)/g);
  return cityMatch ? cityMatch[cityMatch.length - 1] : '';
}

// Buscar type_id baseado no leadData
async function getBusinessTypeFromSheet(postalCode, leadData) {
  try {
    if (leadData.type) {
      return {
        type_id: leadData.type,
        type_ids: leadData.types || leadData.type,
        source: 'leadData'
      };
    }
    
    return {
      type_id: leadData.type || 'Negócio',
      type_ids: leadData.types || leadData.type || 'Negócio',
      source: 'fallback'
    };
  } catch (error) {
    console.error('Erro ao buscar type_id:', error.message);
    return {
      type_id: leadData.type || 'Negócio',
      type_ids: leadData.types || leadData.type || 'Negócio',
      source: 'error'
    };
  }
}

// Gerar keywords relevantes
async function generateRelevantKeywords(leadData) {
  const address = leadData.address || '';
  const name = leadData.name || '';
  const postalCode = extractPostalCode(address);
  const city = extractCity(address);
  
  const businessType = await getBusinessTypeFromSheet(postalCode, leadData);
  const mainType = businessType.type_id;
  const allTypes = businessType.type_ids.split(',').map(t => t.trim());
  
  const keywords = [];
  
  // 1. Nome da empresa
  if (name) {
    keywords.push(name);
  }
  
  // 2. Tipo + Cidade
  if (mainType && city) {
    keywords.push(`${mainType} ${city}`);
    keywords.push(`${mainType} em ${city}`);
    keywords.push(`melhor ${mainType} ${city}`);
  }
  
  // 3. Variações de tipos
  allTypes.forEach(type => {
    if (city && type !== mainType) {
      keywords.push(`${type} ${city}`);
    }
  });
  
  // 4. Keywords transacionais
  if (mainType && city) {
    const transactionalPrefixes = ['comprar', 'contratar', 'encontrar'];
    transactionalPrefixes.forEach(prefix => {
      keywords.push(`${prefix} ${mainType.toLowerCase()} ${city}`);
    });
  }
  
  // 5. Código postal específico
  if (postalCode && mainType) {
    keywords.push(`${mainType} ${postalCode}`);
  }
  
  return {
    keywords: keywords.filter(k => k.length > 0).slice(0, 10),
    mainKeyword: keywords[0] || name,
    city,
    postalCode,
    businessType: mainType,
    allTypes
  };
}

// Buscar posição no Google usando ScraperAPI
async function searchGooglePosition(keyword, websiteUrl) {
  const scraperApiKey = process.env.SCRAPER_API_KEY;
  
  if (!scraperApiKey) {
    console.warn('⚠️ SCRAPER_API_KEY não configurada');
    return {
      position: null,
      found: false,
      error: 'API não configurada'
    };
  }
  
  try {
    console.log(`🔎 Buscando: "${keyword}"`);
    
    // Limpar URL para comparação
    const cleanUrl = websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    
    // Fazer busca no Google via ScraperAPI
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=pt&hl=pt&num=20`;
    
    const { data } = await axios.get('http://api.scraperapi.com', {
      params: {
        api_key: scraperApiKey,
        url: googleUrl,
        country_code: 'pt'
      },
      timeout: 30000
    });
    
    // Parse HTML dos resultados
    const $ = cheerio.load(data);
    const results = [];
    
    // Seletores para resultados orgânicos
    $('div.tF2Cxc, div.Gx5Zad, div.g').each((index, element) => {
      const $element = $(element);
      const $link = $element.find('a[href]').first();
      const link = $link.attr('href');
      const title = $element.find('h3').text() || $link.text();
      const snippet = $element.find('.VwiC3b, .yXK7lf, .p4wth').text();
      
      if (link && link.startsWith('http') && title) {
        results.push({ position: results.length + 1, url: link, title, snippet });
      }
    });
    
    // Seletores para resultados locais (empresas)
    $('div.w7Dbne').each((index, element) => {
      const $element = $(element);
      const $link = $element.find('a[href^="http"]').first();
      const link = $link.attr('href');
      const title = $element.find('.dbg0pd, .OSrXXb').text();
      const snippet = $element.find('.rllt__details').text();
      
      if (link && title && !results.find(r => r.url === link)) {
        results.push({ position: results.length + 1, url: link, title, snippet });
      }
    });
    
    // Procurar o site nos resultados
    for (let i = 0; i < results.length; i++) {
      const resultUrl = results[i].url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      
      if (resultUrl.includes(cleanUrl) || cleanUrl.includes(resultUrl)) {
        return {
          position: i + 1,
          found: true,
          page: Math.ceil((i + 1) / 10),
          url: results[i].url,
          title: results[i].title,
          snippet: results[i].snippet,
          totalResults: results.length
        };
      }
    }
    
    // Não encontrado
    return {
      position: null,
      found: false,
      totalResults: results.length,
      message: `Não encontrado nos primeiros ${results.length} resultados`
    };
    
  } catch (error) {
    console.error('Erro ao buscar no Google:', error.message);
    return {
      position: null,
      found: false,
      error: error.message
    };
  }
}

// Analisar concorrentes (top 3)
async function analyzeCompetitors(keyword) {
  const scraperApiKey = process.env.SCRAPER_API_KEY;
  
  if (!scraperApiKey) {
    return [];
  }
  
  try {
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=pt&hl=pt&num=3`;
    
    const { data } = await axios.get('http://api.scraperapi.com', {
      params: {
        api_key: scraperApiKey,
        url: googleUrl,
        country_code: 'pt'
      },
      timeout: 30000
    });
    
    const $ = cheerio.load(data);
    const competitors = [];
    
    // Resultados orgânicos
    $('div.tF2Cxc, div.g').slice(0, 3).each((index, element) => {
      const $element = $(element);
      const $link = $element.find('a[href]').first();
      const link = $link.attr('href');
      const title = $element.find('h3').text();
      const snippet = $element.find('.VwiC3b, .yXK7lf').text();
      
      if (link && link.startsWith('http') && title && !competitors.find(c => c.url === link)) {
        competitors.push({ position: competitors.length + 1, url: link, title, snippet });
      }
    });
    
    // Resultados locais
    $('div.w7Dbne').slice(0, 3).each((index, element) => {
      const $element = $(element);
      const $link = $element.find('a[href^="http"]').first();
      const link = $link.attr('href');
      const title = $element.find('.dbg0pd').text();
      const snippet = $element.find('.rllt__details').text();
      
      if (link && title && !competitors.find(c => c.url === link)) {
        competitors.push({ position: competitors.length + 1, url: link, title, snippet });
      }
    });
    
    return competitors;
    
  } catch (error) {
    console.error('Erro ao analisar concorrentes:', error.message);
    return [];
  }
}

// Calcular score de visibilidade
function calculateVisibilityScore(rankings) {
  if (rankings.length === 0) return 0;
  
  let totalScore = 0;
  let foundCount = 0;
  
  rankings.forEach(ranking => {
    if (ranking.found && ranking.position) {
      foundCount++;
      if (ranking.position === 1) totalScore += 100;
      else if (ranking.position === 2) totalScore += 90;
      else if (ranking.position === 3) totalScore += 80;
      else if (ranking.position <= 5) totalScore += 70;
      else if (ranking.position <= 10) totalScore += 50;
      else totalScore += 20;
    }
  });
  
  return foundCount > 0 ? Math.round(totalScore / rankings.length) : 0;
}

// Função principal
export async function analyzeGoogleRanking(websiteUrl, leadData) {
  console.log(`🔍 Analisando ranking no Google: ${websiteUrl}`);
  
  try {
    // 1. Gerar keywords
    const keywordData = await generateRelevantKeywords(leadData);
    console.log(`📊 Keywords geradas: ${keywordData.keywords.length}`);
    
    // 2. Buscar posições (máximo 5 para economizar quota)
    const rankings = [];
    const keywordsToSearch = keywordData.keywords.slice(0, 5);
    
    for (const keyword of keywordsToSearch) {
      const result = await searchGooglePosition(keyword, websiteUrl);
      rankings.push({
        keyword,
        ...result
      });
      
      // Delay para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 3. Analisar concorrentes
    const competitors = await analyzeCompetitors(keywordData.mainKeyword);
    
    // 4. Calcular score
    const visibilityScore = calculateVisibilityScore(rankings);
    
    // 5. Estatísticas
    const foundKeywords = rankings.filter(r => r.found).length;
    const avgPosition = rankings
      .filter(r => r.found && r.position)
      .reduce((acc, r) => acc + r.position, 0) / (foundKeywords || 1);
    
    const bestPosition = Math.min(
      ...rankings.filter(r => r.found && r.position).map(r => r.position),
      Infinity
    );
    
    return {
      score: visibilityScore,
      rankings,
      competitors,
      keywordData,
      stats: {
        totalKeywords: keywordsToSearch.length,
        foundKeywords,
        notFoundKeywords: keywordsToSearch.length - foundKeywords,
        avgPosition: foundKeywords > 0 ? Math.round(avgPosition) : null,
        bestPosition: bestPosition !== Infinity ? bestPosition : null,
        visibility: `${Math.round((foundKeywords / keywordsToSearch.length) * 100)}%`
      },
      recommendations: generateRecommendations(rankings, visibilityScore)
    };
    
  } catch (error) {
    console.error('❌ Erro na análise de ranking:', error.message);
    return {
      score: 0,
      rankings: [],
      competitors: [],
      error: error.message
    };
  }
}

function generateRecommendations(rankings, score) {
  const recommendations = [];
  
  if (score < 30) {
    recommendations.push('CRÍTICO: Invisível no Google. Implementar estratégia SEO urgente.');
  } else if (score < 50) {
    recommendations.push('Baixa visibilidade. Otimizar conteúdo e backlinks.');
  } else if (score < 70) {
    recommendations.push('Visibilidade média. Focar em keywords de cauda longa.');
  } else if (score < 90) {
    recommendations.push('Boa visibilidade. Manter e expandir para mais keywords.');
  } else {
    recommendations.push('Excelente visibilidade! Domínio local estabelecido.');
  }
  
  const notFound = rankings.filter(r => !r.found).length;
  if (notFound > 0) {
    recommendations.push(`${notFound} keywords sem ranking. Criar conteúdo específico.`);
  }
  
  const lowPositions = rankings.filter(r => r.found && r.position > 5).length;
  if (lowPositions > 0) {
    recommendations.push(`${lowPositions} keywords em posições baixas. Otimizar páginas existentes.`);
  }
  
  return recommendations;
}
