import axios from 'axios';
import * as cheerio from 'cheerio';

export async function analyzeSEO(url, htmlContent = null, groqApiKey = null) {
  try {
    let html = htmlContent;
    if (!html) {
      const { data } = await axios.get(url, { timeout: 30000 });
      html = data;
    }
    const $ = cheerio.load(html);
    
    // Meta Tags
    const title = $('title').text();
    const description = $('meta[name="description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    
    // Open Graph
    const ogTitle = $('meta[property="og:title"]').attr('content') || '';
    const ogDescription = $('meta[property="og:description"]').attr('content') || '';
    const ogImage = $('meta[property="og:image"]').attr('content') || '';
    
    // Estrutura de Headings
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h1Text = $('h1').first().text();
    
    // Canonical
    const canonical = $('link[rel="canonical"]').attr('href') || '';
    
    // Schema.org
    const hasSchema = $('script[type="application/ld+json"]').length > 0;
    let schemaTypes = [];
    if (hasSchema) {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const schema = JSON.parse($(el).html());
          if (schema['@type']) schemaTypes.push(schema['@type']);
        } catch (e) {}
      });
    }
    
    // Robots.txt e Sitemap
    const baseUrl = new URL(url).origin;
    const [robotsRes, sitemapRes] = await Promise.allSettled([
      axios.head(`${baseUrl}/robots.txt`, { timeout: 10000 }),
      axios.head(`${baseUrl}/sitemap.xml`, { timeout: 10000 })
    ]);
    
    const hasRobotsTxt = robotsRes.status === 'fulfilled' && robotsRes.value.status === 200;
    const hasSitemap = sitemapRes.status === 'fulfilled' && sitemapRes.value.status === 200;
    
    // Imagens sem ALT
    const images = $('img');
    const imagesWithoutAlt = images.filter((i, el) => !$(el).attr('alt')).length;
    
    // Links
    const internalLinks = $('a[href^="/"], a[href^="' + baseUrl + '"]').length;
    const externalLinks = $('a[href^="http"]').not('[href^="' + baseUrl + '"]').length;
    
    // 🆕 MOBILE SEO
    const mobileSEO = analyzeMobileSEO($, html);
    
    // 🆕 INDEXABILIDADE
    const indexability = analyzeIndexability($, html);
    
    // 🆕 KEYWORD ANALYSIS
    const keywordAnalysis = analyzeKeywords($, title, description, html);
    
    // 🆕 AI STRATEGIC SEO AUDIT (Groq)
    let aiDeepAudit = null;
    if (groqApiKey) {
      aiDeepAudit = await generateAISEOAudit(url, title, description, keywordAnalysis, html, groqApiKey);
    }
    
    // Score SEO (atualizado)
    const score = calculateSEOScore({
      title: title.length > 0 && title.length <= 60,
      description: description.length >= 120 && description.length <= 160,
      h1Count: h1Count === 1,
      hasRobotsTxt,
      hasSitemap,
      hasSchema,
      imagesWithAlt: imagesWithoutAlt === 0,
      mobileFriendly: mobileSEO.score > 70,
      indexable: indexability.isIndexable
    });
    
    return {
      title: {
        text: title,
        length: title.length,
        optimal: title.length > 0 && title.length <= 60
      },
      description: {
        text: description,
        length: description.length,
        optimal: description.length >= 120 && description.length <= 160
      },
      keywords: keywords,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        image: ogImage,
        complete: !!(ogTitle && ogDescription && ogImage)
      },
      headings: {
        h1Count,
        h2Count,
        h1Text,
        optimal: h1Count === 1
      },
      canonical,
      hasSchema,
      schemaTypes,
      hasRobotsTxt,
      hasSitemap,
      images: {
        total: images.length,
        withoutAlt: imagesWithoutAlt,
        altCoverage: images.length > 0 ? ((images.length - imagesWithoutAlt) / images.length * 100).toFixed(0) : 100
      },
      links: {
        internal: internalLinks,
        external: externalLinks
      },
      // 🆕 Novos dados
      mobileSEO,
      indexability,
      keywordAnalysis,
      aiDeepAudit,
      score
    };
  } catch (error) {
    console.error('SEO Analysis Error:', error.message);
    return { score: 0, error: error.message };
  }
}

// 🆕 Análise de Mobile SEO
function analyzeMobileSEO($, html) {
  const issues = [];
  let score = 100;
  
  // Viewport
  const viewport = $('meta[name="viewport"]').attr('content');
  if (!viewport) {
    issues.push('Meta viewport ausente');
    score -= 30;
  } else if (!viewport.includes('width=device-width')) {
    issues.push('Viewport não responsivo');
    score -= 20;
  }
  
  // Font size
  const bodyFontSize = $('body').css('font-size');
  if (bodyFontSize && parseInt(bodyFontSize) < 16) {
    issues.push('Fonte muito pequena para mobile (<16px)');
    score -= 15;
  }
  
  // Tap targets (links/botões muito próximos)
  const buttons = $('button, a, input[type="submit"]');
  if (buttons.length > 20) {
    issues.push('Muitos elementos clicáveis (possíveis tap targets pequenos)');
    score -= 10;
  }
  
  // Mobile-friendly content
  const hasFlash = html.includes('flash') || html.includes('.swf');
  if (hasFlash) {
    issues.push('Contém Flash (não suportado em mobile)');
    score -= 25;
  }
  
  return {
    score: Math.max(score, 0),
    hasViewport: !!viewport,
    viewportContent: viewport || null,
    issues,
    recommendation: score < 70 ? 'Site não otimizado para mobile' : 'Mobile-friendly'
  };
}

// 🆕 Análise de Indexabilidade
function analyzeIndexability($, html) {
  const blockers = [];
  let isIndexable = true;
  
  // Meta robots
  const metaRobots = $('meta[name="robots"]').attr('content')?.toLowerCase() || '';
  if (metaRobots.includes('noindex')) {
    blockers.push('Meta robots: noindex');
    isIndexable = false;
  }
  if (metaRobots.includes('nofollow')) {
    blockers.push('Meta robots: nofollow');
  }
  
  // X-Robots-Tag (precisa verificar headers, mas podemos detectar no HTML)
  if (html.includes('x-robots-tag')) {
    blockers.push('X-Robots-Tag pode estar bloqueando');
  }
  
  // Canonical apontando para outra página
  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical && !canonical.includes(new URL($('base').attr('href') || 'http://example.com').hostname)) {
    blockers.push('Canonical aponta para outro domínio');
  }
  
  // Conteúdo muito pouco (thin content)
  const bodyText = $('body').text().trim();
  const wordCount = bodyText.split(/\s+/).length;
  if (wordCount < 100) {
    blockers.push('Conteúdo insuficiente (thin content)');
  }
  
  // JavaScript rendering issues (heurística)
  const hasReact = html.includes('react') || html.includes('_react');
  const hasVue = html.includes('vue') || html.includes('__vue');
  const hasAngular = html.includes('angular') || html.includes('ng-');
  const hasMinimalHTML = $('body').children().length < 5;
  
  if ((hasReact || hasVue || hasAngular) && hasMinimalHTML) {
    blockers.push('Possível problema de renderização JavaScript (SPA)');
  }
  
  return {
    isIndexable,
    blockers,
    metaRobots: metaRobots || 'Não definido',
    wordCount,
    recommendation: isIndexable ? 'Página indexável' : 'Página bloqueada para indexação'
  };
}

// 🆕 Análise de Keywords
function analyzeKeywords($, title, description, html) {
  const bodyText = $('body').text().toLowerCase();
  const h1Text = $('h1').first().text().toLowerCase();
  
  // Extrair possíveis keywords do título
  const titleWords = title.toLowerCase()
    .replace(/[^\w\sáàâãéèêíïóôõöúçñ]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  const keywordDensity = [];
  
  titleWords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = bodyText.match(regex) || [];
    const density = (matches.length / bodyText.split(/\s+/).length * 100).toFixed(2);
    
    keywordDensity.push({
      keyword,
      count: matches.length,
      density: parseFloat(density),
      inH1: h1Text.includes(keyword),
      inDescription: description.toLowerCase().includes(keyword)
    });
  });
  
  // Ordenar por densidade
  keywordDensity.sort((a, b) => b.count - a.count);
  
  return {
    primary: keywordDensity[0] || null,
    secondary: keywordDensity.slice(1, 4),
    overOptimization: keywordDensity.some(k => k.density > 3), // Keyword stuffing
    recommendation: keywordDensity.length === 0 ? 'Definir keywords alvo' :
                    keywordDensity[0]?.density > 3 ? 'Reduzir densidade de keywords (over-optimization)' :
                    'Densidade de keywords adequada'
  };
}

function calculateSEOScore(checks) {
  const weights = {
    title: 15,
    description: 15,
    h1Count: 10,
    hasRobotsTxt: 8,
    hasSitemap: 12,
    hasSchema: 10,
    imagesWithAlt: 8,
    mobileFriendly: 12,
    indexable: 10
  };
  
  let score = 0;
  Object.keys(checks).forEach(key => {
    if (checks[key]) score += weights[key] || 0;
  });
  
  return score;
}

// 🆕 Expanded AI Strategic SEO Audit (Groq Llama-3)
async function generateAISEOAudit(url, title, description, keywordAnalysis, html, groqApiKey) {
  try {
    const $ = cheerio.load(html);
    // Extract a snippet of the main content to send to the AI
    const contentSnippet = $('body').text().replace(/\s+/g, ' ').substring(0, 3000);

    const prompt = `
Tu és um Consultor de SEO Estratégico Sênior (Especialista Nível Global). Estou a auditar o website: ${url}.
O objetivo não é ler a tag H1 ou a meta description — isso as ferramentas básicas já fazem. Quero a TUA inteligência estratégica de mercado.

Aqui estão os dados recolhidos do site:
Título: "${title}"
Descrição: "${description}"
Palavra-chave principal detectada pelo bot: "${keywordAnalysis?.primary?.keyword || 'Nenhuma'}"
Conteúdo (excerto): "${contentSnippet}"

Analisa o negócio através deste conteúdo e gera um JSON ESTRITAMENTE VÁLIDO com as seguintes chaves ESTRATÉGICAS:
{
  "userIntent": "Qual é a intenção de quem pesquisa por este tipo de serviço? (ex: 'Procuram um restaurante com ambiente relaxado para grupos em Gaia' ou 'Procuram urgência na resolução de um problema legal')",
  "semanticKeywords": ["Keyword 1 (focada em intenção/conversão e não volume bruto)", "Keyword 2", "Keyword 3"],
  "contentGap": "Observando o conteúdo (ou a falta dele), o que o concorrente que está em #1 no Google tem no site dele que este site *não* tem? Qual é a lacuna de conteúdo?",
  "strategicRecommendation": "Um parágrafo forte e persuasivo para eu enviar ao cliente (na 3ª pessoa), explicando o impacto comercial de corrigir a estratégia de SEO dele, dizendo por que o site dele está invisível na hora da decisão do consumidor."
}
O output TEM de ser apenas o JSON válido, sem qualquer texto markdown ou explicações antes ou depois. Responde SEMPRE EM PORTUGUÊS (PT-PT).
`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const content = response.data.choices[0].message.content;
    const result = JSON.parse(content);
    
    return {
      success: true,
      userIntent: result.userIntent || '',
      semanticKeywords: result.semanticKeywords || [],
      contentGap: result.contentGap || '',
      strategicRecommendation: result.strategicRecommendation || ''
    };
  } catch (err) {
    console.error('Groq AI SEO Analysis Error:', err.message);
    return { success: false, error: 'Falha na IA', userIntent: '', semanticKeywords: [], contentGap: '', strategicRecommendation: '' };
  }
}
