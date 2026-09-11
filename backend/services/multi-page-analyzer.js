import axios from 'axios';
import xml2js from 'xml2js';

/**
 * 🌐 MULTI-PAGE ANALYZER - Sitemap Parser + Fallback Inteligente
 * Analisa múltiplas páginas com variações PT/EN/ES
 */

// Variações de URLs comuns (PT/EN/ES)
const PAGE_VARIATIONS = {
  about: ['sobre', 'sobre-nos', 'quem-somos', 'about', 'about-us', 'nosotros', 'acerca-de'],
  services: ['servicos', 'serviços', 'services', 'servicios'],
  contact: ['contacto', 'contato', 'contactos', 'contact', 'contactar'],
  portfolio: ['portfolio', 'portfólio', 'trabalhos', 'projetos', 'projects'],
  blog: ['blog', 'noticias', 'notícias', 'news', 'artigos'],
  pricing: ['precos', 'preços', 'pricing', 'tarifas', 'planos'],
  faq: ['faq', 'perguntas', 'ajuda', 'help'],
  team: ['equipa', 'equipe', 'team', 'equipo'],
  careers: ['carreiras', 'careers', 'emprego', 'jobs', 'trabalhe-conosco'],
  testimonials: ['testemunhos', 'depoimentos', 'testimonials', 'clientes']
};

/**
 * 1️⃣ Tenta buscar sitemap.xml
 */
async function fetchSitemap(baseUrl) {
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap-index.xml`,
    `${baseUrl}/wp-sitemap.xml`, // WordPress
    `${baseUrl}/index.php/page-sitemap.xml` // WordPress alternativo
  ];

  for (const url of sitemapUrls) {
    try {
      console.log(`🔍 Tentando: ${url}`);
      const response = await axios.get(url, { timeout: 10000 });
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(response.data);
      
      // Extrai URLs do sitemap
      const urls = [];
      
      // Sitemap normal
      if (result.urlset?.url) {
        const extracted = result.urlset.url.map(u => u.loc[0]);
        console.log(`✅ Sitemap normal: ${extracted.length} URLs`);
        urls.push(...extracted);
      }
      
      // Sitemap index - busca sub-sitemaps
      if (result.sitemapindex?.sitemap) {
        console.log(`📚 Sitemap index encontrado: ${result.sitemapindex.sitemap.length} sub-sitemaps`);
        for (const sitemap of result.sitemapindex.sitemap.slice(0, 5)) { // Máximo 5 sub-sitemaps
          try {
            const subUrl = sitemap.loc[0];
            console.log(`  ➡️ Buscando sub-sitemap: ${subUrl}`);
            const subResponse = await axios.get(subUrl, { timeout: 10000 });
            const subResult = await parser.parseStringPromise(subResponse.data);
            
            if (subResult.urlset?.url) {
              const subUrls = subResult.urlset.url.map(u => u.loc[0]);
              console.log(`  ✅ ${subUrls.length} URLs encontradas`);
              urls.push(...subUrls);
            }
          } catch (subError) {
            console.warn(`  ⚠️ Erro ao buscar sub-sitemap: ${subError.message}`);
          }
        }
      }
      
      if (urls.length > 0) {
        console.log(`✅ Total de URLs coletadas: ${urls.length}`);
        return urls; // Retorna TODAS as URLs encontradas
      }
    } catch (error) {
      console.log(`❌ ${url} - ${error.message}`);
      continue; // Tenta próximo
    }
  }
  
  console.log(`❌ Nenhum sitemap encontrado`);
  return null;
}

/**
 * 2️⃣ Fallback: Gera URLs comuns com variações PT/EN/ES
 */
function generateFallbackUrls(baseUrl) {
  const urls = [baseUrl]; // Homepage sempre
  
  Object.values(PAGE_VARIATIONS).forEach(variations => {
    variations.forEach(slug => {
      urls.push(`${baseUrl}/${slug}`);
      urls.push(`${baseUrl}/${slug}/`);
    });
  });
  
  return urls;
}

/**
 * 3️⃣ Valida se URL existe (HEAD request)
 */
async function validateUrl(url) {
  try {
    const response = await axios.head(url, { 
      timeout: 3000,
      maxRedirects: 3,
      validateStatus: (status) => status < 400
    });
    return response.status < 400;
  } catch {
    return false;
  }
}

/**
 * 4️⃣ Filtra URLs válidas em paralelo
 */
async function filterValidUrls(urls) {
  const validationPromises = urls.map(async (url) => {
    const isValid = await validateUrl(url);
    return isValid ? url : null;
  });
  
  const results = await Promise.all(validationPromises);
  return results.filter(url => url !== null);
}

/**
 * 5️⃣ Categoriza páginas por tipo
 */
function categorizePages(urls) {
  const categories = {
    homepage: [],
    about: [],
    services: [],
    contact: [],
    portfolio: [],
    blog: [],
    other: []
  };
  
  urls.forEach(url => {
    const path = new URL(url).pathname.toLowerCase();
    
    if (path === '/' || path === '') {
      categories.homepage.push(url);
    } else if (PAGE_VARIATIONS.about.some(v => path.includes(v))) {
      categories.about.push(url);
    } else if (PAGE_VARIATIONS.services.some(v => path.includes(v))) {
      categories.services.push(url);
    } else if (PAGE_VARIATIONS.contact.some(v => path.includes(v))) {
      categories.contact.push(url);
    } else if (PAGE_VARIATIONS.portfolio.some(v => path.includes(v))) {
      categories.portfolio.push(url);
    } else if (PAGE_VARIATIONS.blog.some(v => path.includes(v))) {
      categories.blog.push(url);
    } else {
      categories.other.push(url);
    }
  });
  
  return categories;
}

/**
 * 🚀 FUNÇÃO PRINCIPAL: Descobre todas as páginas do site
 */
async function discoverPages(websiteUrl) {
  console.log(`🔍 Descobrindo páginas de: ${websiteUrl}`);
  
  const baseUrl = websiteUrl.replace(/\/$/, ''); // Remove trailing slash
  
  // 1️⃣ Tenta sitemap primeiro
  let urls = await fetchSitemap(baseUrl);
  let source = 'fallback';
  
  if (urls && urls.length > 0) {
    console.log(`✅ Sitemap encontrado: ${urls.length} URLs`);
    source = 'sitemap';
  } else {
    // 2️⃣ Fallback: Gera URLs comuns
    console.log(`⚠️ Sitemap não encontrado. Usando fallback...`);
    const fallbackUrls = generateFallbackUrls(baseUrl);
    console.log(`🔍 Testando ${fallbackUrls.length} URLs comuns...`);
    urls = await filterValidUrls(fallbackUrls);
    console.log(`✅ Fallback: ${urls.length} URLs válidas`);
  }
  
  // 3️⃣ Categoriza páginas
  const categorized = categorizePages(urls);
  
  // 4️⃣ Retorna TODAS as páginas (não limita mais)
  const allPages = [
    ...categorized.homepage,
    ...categorized.services,
    ...categorized.about,
    ...categorized.contact,
    ...categorized.portfolio,
    ...categorized.blog,
    ...categorized.other
  ];
  
  console.log(`🎯 Páginas selecionadas para análise: ${allPages.length}`);
  
  return {
    total: urls.length,
    analyzed: allPages.length,
    pages: allPages,
    categories: categorized,
    source
  };
}

/**
 * 🎯 Analisa múltiplas páginas em paralelo
 */
async function analyzeMultiplePages(pages, analyzeFn) {
  const results = await Promise.all(
    pages.map(async (url) => {
      try {
        const analysis = await analyzeFn(url);
        return { url, success: true, data: analysis };
      } catch (error) {
        return { url, success: false, error: error.message };
      }
    })
  );
  
  return results;
}

/**
 * 📊 Agrega resultados de múltiplas páginas
 */
function aggregateResults(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  // Calcula médias
  const avgPerformance = successful.reduce((sum, r) => 
    sum + (r.data.performanceMobile || 0), 0) / successful.length || 0;
  
  const totalPixels = new Set(
    successful.flatMap(r => {
      const pixels = [];
      if (r.data.pixelDetails?.facebook) pixels.push('Meta Pixel');
      if (r.data.pixelDetails?.ga4) pixels.push('GA4');
      if (r.data.pixelDetails?.gtm) pixels.push('GTM');
      return pixels;
    })
  );
  
  const totalCTAs = successful.reduce((sum, r) => 
    sum + (r.data.conversion?.ctas?.total || 0), 0);
  
  return {
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      avgPerformance: Math.round(avgPerformance),
      totalPixels: totalPixels.size,
      totalCTAs
    },
    pages: results,
    recommendations: generateMultiPageRecommendations(successful)
  };
}

/**
 * 💡 Gera recomendações baseadas em múltiplas páginas
 */
function generateMultiPageRecommendations(results) {
  const recommendations = [];
  
  // Performance inconsistente
  const scores = results.map(r => r.data.performanceMobile || 0);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  
  if (maxScore - minScore > 30) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: `Performance inconsistente: ${minScore}-${maxScore}. Otimizar páginas mais lentas.`
    });
  }
  
  // Pixels faltando em algumas páginas
  const pagesWithPixels = results.filter(r => 
    r.data.pixelDetails?.totalTracking > 0
  ).length;
  
  if (pagesWithPixels < results.length) {
    recommendations.push({
      type: 'tracking',
      priority: 'high',
      message: `Pixels ausentes em ${results.length - pagesWithPixels} páginas. Implementar tracking global.`
    });
  }
  
  // CTAs faltando
  const pagesWithoutCTAs = results.filter(r => 
    !r.data.conversion?.ctas || r.data.conversion.ctas.total === 0
  ).length;
  
  if (pagesWithoutCTAs > 0) {
    recommendations.push({
      type: 'conversion',
      priority: 'medium',
      message: `${pagesWithoutCTAs} páginas sem CTAs. Adicionar calls-to-action.`
    });
  }
  
  return recommendations;
}

export {
  discoverPages,
  analyzeMultiplePages,
  aggregateResults,
  PAGE_VARIATIONS
};
