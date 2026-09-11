import axios from 'axios';
import * as cheerio from 'cheerio';
import { translateTypeToPortuguese } from './type-translations.js';
import { getGoogleRanking } from './python-bridge.js';

// 🔍 Google Ranking Analyzer - Posição Real no Google

// Extrair código postal do endereço (função auxiliar)
function extractPostalCode(address) {
  if (!address) return null;
  
  const patterns = [
    /\b(\d{4})[-\s]?(\d{3})?\b/,
    /\b(\d{4})\b/
  ];
  
  for (const pattern of patterns) {
    const match = address.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// Extrair cidade do endereço completo (prioridade) ou código postal
function extractCityFromAddress(address, postalCode) {
  if (!address && !postalCode) return '';
  
  // 1. Tentar extrair cidade do endereço completo
  if (address) {
    // Padrão: "Rua X, 2415-123 Leiria" ou "Rua X, Leiria"
    const cityPatterns = [
      /,\s*\d{4}[-\s]?\d{3}\s+([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+(?:\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+)*)/,
      /,\s*([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+(?:\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+)*)\s*$/,
      /\b([A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+(?:\s+[A-ZÀÁÂÃÇÉÊÍÓÔÕÚ][a-zàáâãçéêíóôõú]+)*)\s*,\s*Portugal/i
    ];
    
    for (const pattern of cityPatterns) {
      const match = address.match(pattern);
      if (match && match[1]) {
        const city = match[1].trim();
        // Filtrar palavras comuns que não são cidades
        if (!['Portugal', 'Rua', 'Avenida', 'Praça'].includes(city)) {
          return city;
        }
      }
    }
  }
  
  // 2. Fallback: usar código postal
  return extractCityFromPostalCode(postalCode);
}

// Extrair cidade do código postal português (fallback)
function extractCityFromPostalCode(postalCode) {
  if (!postalCode) return '';
  
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
  
  const firstDigit = postalCode.toString().charAt(0);
  return postalCodeMap[firstDigit] || '';
}

// Gerar keywords relevantes baseadas no negócio e localização
async function generateRelevantKeywords(leadData) {
  const typeId = leadData.type_id || leadData.type || '';
  const address = leadData.address || '';
  const postalCode = leadData.postal_code || extractPostalCode(address);
  
  // Extrair cidade do endereço completo (prioridade) ou código postal
  const city = extractCityFromAddress(address, postalCode);
  
  // Traduzir type_id usando arquivo de traduções
  const typePortuguese = translateTypeToPortuguese(typeId);
  
  console.log(`📍 Type: ${typeId} → ${typePortuguese} | Cidade: ${city} (CP: ${postalCode}) | Endereço: ${address.substring(0, 50)}...`);
  
  // Gerar apenas 1 keyword simples
  const keywords = [];
  
  if (typePortuguese && city) {
    keywords.push(`${typePortuguese} ${city}`);
  } else if (typePortuguese) {
    keywords.push(typePortuguese);
  }
  
  return {
    keywords: keywords.slice(0, 1), // Máximo 1 keyword
    mainKeyword: keywords[0] || typePortuguese,
    city,
    postalCode,
    businessType: typePortuguese,
    allTypes: [typePortuguese]
  };
}

// ⚡ Buscar posição no Google — Python Playwright (primary) + ScraperAPI (fallback)
async function searchGooglePosition(keyword, websiteUrl) {
  const cleanUrl = websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

  // 1️⃣ Python Playwright (sem API paga, sem 403)
  try {
    const pythonResult = await getGoogleRanking(cleanUrl, keyword, 10);
    if (pythonResult?.success) {
      const pos = pythonResult.position;
      console.log(`  🐍 Python Ranking: "${keyword}" → ${pythonResult.ranking}`);
      return {
        position: pos,
        found: pos !== null,
        url: pythonResult.top_results?.[0] || null,
        title: pythonResult.ranking,
        totalResults: pythonResult.total_found,
        source: 'playwright'
      };
    }
  } catch (pyErr) {
    console.warn(`  ⚠️ Python Ranking falhou: ${pyErr.message}`);
  }

  // 2️⃣ Fallback: ScraperAPI (se a key estiver configurada)
  const scraperApiKey = process.env.SCRAPER_API_KEY;
  if (!scraperApiKey) {
    console.warn('  ⚠️ SCRAPER_API_KEY não configurada e Python offline — ranking indisponível');
    return { position: null, found: false, error: 'Sem motor de ranking disponível' };
  }

  try {
    const googleSearchUrl = `https://www.google.pt/search?q=${encodeURIComponent(keyword)}&num=10&gl=pt&hl=pt`;
    const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(googleSearchUrl)}&country_code=pt`;
    const { data } = await axios.get(scraperUrl, { timeout: 120000 });
    const $ = cheerio.load(data);

    const results = [];
    ['.g', '.tF2Cxc', '.Gx5Zad', 'div[data-sokoban-container]'].forEach(sel => {
      $(sel).each((i, el) => {
        const link = $(el).find('a').first().attr('href');
        const title = $(el).find('h3').first().text();
        if (link && link.startsWith('http') && !results.find(r => r.url === link))
          results.push({ position: results.length + 1, url: link, title: title || 'Sem título' });
      });
    });

    console.log(`  📊 ScraperAPI resultados: ${results.length}`);
    if (results.length === 0) return { position: null, found: false, totalResults: 0, error: 'ScraperAPI sem resultados' };

    for (let i = 0; i < results.length; i++) {
      const resultUrl = results[i].url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      if (resultUrl.includes(cleanUrl) || cleanUrl.includes(resultUrl.split('/')[0])) {
        console.log(`  ✅ ScraperAPI: posição #${i + 1}`);
        return { position: i + 1, found: true, url: results[i].url, title: results[i].title, totalResults: results.length, source: 'scraperapi' };
      }
    }
    return { position: null, found: false, totalResults: results.length };
  } catch (error) {
    const status = error?.response?.status;
    const hint = status === 403 ? ' (403: API key inválida/sem créditos)' : '';
    console.error(`  ❌ ScraperAPI erro: ${error.message}${hint}`);
    return { position: null, found: false, error: `${error.message}${hint}` };
  }
}

// Analisar top resultados como concorrentes — Python Playwright (primary) + ScraperAPI (fallback)
async function analyzeCompetitors(keyword) {
  // 1️⃣ Tentar via Python Playwright
  try {
    const pythonResult = await getGoogleRanking('__competitors__', keyword, 5);
    if (pythonResult?.success && pythonResult.top_results?.length > 0) {
      return pythonResult.top_results.slice(0, 3).map((url, i) => ({
        position: i + 1,
        url,
        title: url,
        snippet: '',
        source: 'playwright'
      }));
    }
  } catch (_) {}

  // 2️⃣ Fallback ScraperAPI
  const scraperApiKey = process.env.SCRAPER_API_KEY;
  if (!scraperApiKey) return [];

  try {
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=3&gl=pt&hl=pt`;
    const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(googleSearchUrl)}`;
    const { data } = await axios.get(scraperUrl, { timeout: 120000 });
    const $ = cheerio.load(data);
    const competitors = [];
    $('.g, .tF2Cxc').slice(0, 3).each((i, el) => {
      const link = $(el).find('a').first().attr('href');
      const title = $(el).find('h3').first().text();
      const snippet = $(el).find('.VwiC3b, .lEBKkf').first().text();
      if (link && link.startsWith('http')) competitors.push({ position: i + 1, url: link, title, snippet });
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
      // Score baseado na posição (1º = 100, 2º = 90, 3º = 80, etc)
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

// Função principal de análise
export async function analyzeGoogleRanking(websiteUrl, leadData) {
  console.log(`🔍 Analisando ranking no Google: ${websiteUrl}`);
  
  try {
    // 1. Gerar keywords relevantes
    const keywordData = await generateRelevantKeywords(leadData);
    console.log(`📊 Keywords geradas: ${keywordData.keywords.length}`);
    
    // 2. Buscar posições para cada keyword (apenas 1 keyword)
    const rankings = [];
    const keywordsToSearch = keywordData.keywords.slice(0, 1); // Apenas 1 keyword
    
    for (const keyword of keywordsToSearch) {
      console.log(`🔎 Buscando: "${keyword}"`);
      const result = await searchGooglePosition(keyword, websiteUrl);
      rankings.push({
        keyword,
        ...result
      });
      
      // Delay para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. Analisar concorrentes para keyword principal
    const competitors = await analyzeCompetitors(keywordData.mainKeyword);
    
    // 4. Calcular score de visibilidade
    const visibilityScore = calculateVisibilityScore(rankings);
    
    // 5. Estatísticas e resumo
    const foundKeywords = rankings.filter(r => r.found).length;
    const avgPosition = rankings
      .filter(r => r.found && r.position)
      .reduce((acc, r) => acc + r.position, 0) / (foundKeywords || 1);
    
    const bestPosition = Math.min(
      ...rankings.filter(r => r.found && r.position).map(r => r.position),
      Infinity
    );
    
    // Gerar resumo personalizado
    let rankingSummary;
    if (foundKeywords === 0) {
      const typeCity = keywordData.city ? `${keywordData.businessType} ${keywordData.city}` : keywordData.businessType;
      rankingSummary = `🚨 Empresa não aparece no TOP 10 do Google ao pesquisar "${typeCity}"`;
    } else {
      rankingSummary = `Média: ${avgPosition.toFixed(1)}ª posição | Melhor: ${bestPosition}ª posição`;
      if (bestPosition <= 3) rankingSummary += ' 🏆 Excelente visibilidade!';
      else if (bestPosition <= 10) rankingSummary += ' 📈 Boa posição!';
      else rankingSummary += ' ⚠️ Precisa melhorar SEO';
    }
    
    return {
      score: visibilityScore,
      rankings,
      competitors,
      keywordData,
      rankingSummary,
      stats: {
        totalKeywords: keywordsToSearch.length,
        foundKeywords,
        notFoundKeywords: keywordsToSearch.length - foundKeywords,
        avgPosition: foundKeywords > 0 ? Math.round(avgPosition) : null,
        bestPosition: bestPosition !== Infinity ? bestPosition : null,
        visibility: `${Math.round((foundKeywords / keywordsToSearch.length) * 100)}%`
      },
      recommendations: generateRecommendations(rankings, visibilityScore, keywordData)
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

function generateRecommendations(rankings, score, keywordData) {
  const recommendations = [];
  const notFound = rankings.filter(r => !r.found).length;
  
  if (notFound === rankings.length) {
    const typeCity = keywordData?.city ? `${keywordData.businessType} ${keywordData.city}` : keywordData?.businessType || 'keywords principais';
    recommendations.push(`🚨 CRÍTICO: Empresa não aparece no TOP 10 ao pesquisar "${typeCity}".`);
    recommendations.push('Implementar estratégia SEO local urgente.');
    recommendations.push('Otimizar Google My Business.');
    recommendations.push('Criar conteúdo relevante para a região.');
    return recommendations;
  }
  
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
  
  if (notFound > 0) {
    recommendations.push(`${notFound} keywords sem ranking. Criar conteúdo específico.`);
  }
  
  const lowPositions = rankings.filter(r => r.found && r.position > 5).length;
  if (lowPositions > 0) {
    recommendations.push(`${lowPositions} keywords em posições baixas. Otimizar páginas existentes.`);
  }
  
  return recommendations;
}
