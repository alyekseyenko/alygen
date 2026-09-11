import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';

/**
 * AEO (Answer Engine Optimization) & GEO Analyzer
 * Analyzes how well the content is optimized for AI Answer Engines (Perplexity, Gemini, ChatGPT, Claude)
 * Performs direct live checks on robots.txt and AI agent accessibility.
 */
export async function analyzeAEO(url, html, leadData = {}) {
  try {
    if (!html) return { score: 0, factors: {}, status: 'Não analisado' };

    const $ = cheerio.load(html);
    const factors = {
      hasSchema: false,
      schemaTypes: [],
      hasFAQ: false,
      headingStructure: 0, // 0-100
      answerFormat: 0, // 0-100
      semanticDensity: 0, // 0-100
      aiBotsBlocked: false,
      blockedBots: [],
      checkedRobots: false,
      hasLlmsTxt: false,
      aiSearchVisibility: 0, // 0-100
      searchRank: 'Não listado'
    };

    const origin = new URL(url).origin;

    // 1. Detect JSON-LD Schemas
    const scripts = $('script[type="application/ld+json"]');
    scripts.each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        factors.hasSchema = true;
        const types = Array.isArray(json['@type']) ? json['@type'] : [json['@type']];
        factors.schemaTypes.push(...types.filter(Boolean));
      } catch (e) {
        // Ignore invalid JSON
      }
    });

    // 2. Detect FAQ
    const faqKeywords = ['perguntas frequentes', 'faq', 'perguntas comuns', 'dúvidas', 'perguntas e respostas'];
    const bodyText = $('body').text().toLowerCase();
    factors.hasFAQ = faqKeywords.some(kw => bodyText.includes(kw)) || factors.schemaTypes.includes('FAQPage');

    // 3. Page Title & Action/Conversational Keyword Check (AEO/GEO optimization)
    const pageTitle = $('title').text().trim();
    const titleKeywords = ['como', 'melhor', 'onde', 'o que', 'preço', 'serviços', 'comprar', 'especialista', 'agenda', 'marcação', 'consultório', 'empresa', 'empresa', 'profissional', 'consultor', 'loja', 'contactos'];
    const titleLower = pageTitle.toLowerCase();
    factors.pageTitle = pageTitle || 'Sem Título';
    factors.titleAEOReady = titleKeywords.some(kw => titleLower.includes(kw));
    if (!factors.titleAEOReady && pageTitle) {
      factors.suggestedAEOTitle = `Como Encontrar o Melhor Serviço - ${pageTitle} | Avaliação e Contactos`;
    }

    // 4. Heading Structure (Questions in H2/H3)
    const questionHeaders = $('h2, h3').filter((i, el) => {
      const text = $(el).text().toLowerCase().trim();
      return text.endsWith('?') || 
             text.startsWith('como') || 
             text.startsWith('o que') || 
             text.startsWith('porquê') || 
             text.startsWith('quais') ||
             text.startsWith('onde') ||
             text.startsWith('quanto');
    }).length;

    factors.headingStructure = Math.min(100, (questionHeaders / 3) * 100);

    // 5. Answer Format (Short paragraphs under headings)
    let conciseAnswers = 0;
    $('h2, h3').each((i, el) => {
      const nextP = $(el).next('p');
      if (nextP.length > 0) {
        const wordCount = nextP.text().trim().split(/\s+/).length;
        if (wordCount >= 25 && wordCount <= 65) {
          conciseAnswers++;
        }
      }
    });
    factors.answerFormat = Math.min(100, (conciseAnswers / 2) * 100);

    // 5. Semantic Density (HTML5 elements)
    const semanticElements = $('article, section, main, aside, nav').length;
    factors.semanticDensity = Math.min(100, (semanticElements / 4) * 100);

    // 6. Live robots.txt Crawler block check
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const robotsRes = await fetch(`${origin}/robots.txt`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (robotsRes.ok) {
        const text = await robotsRes.text();
        factors.checkedRobots = true;
        const lowerText = text.toLowerCase();
        
        const bots = ['gptbot', 'claudebot', 'perplexitybot', 'google-extended', 'applebot-extended', 'cohere-ai'];
        for (const bot of bots) {
          if (lowerText.includes(bot)) {
            const regex = new RegExp(`user-agent:\\s*${bot}[\\s\\S]*?disallow:\\s*/`, 'i');
            if (regex.test(lowerText)) {
              factors.aiBotsBlocked = true;
              factors.blockedBots.push(bot.toUpperCase());
            }
          }
        }
      }
    } catch (e) {
      logger.warn(`Could not check robots.txt for AEO for ${url}: ${e.message}`);
    }

    // 7. Live llms.txt Check
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const llmsRes = await fetch(`${origin}/llms.txt`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (llmsRes.ok) {
        factors.hasLlmsTxt = true;
      } else {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 2000);
        const llmsRes2 = await fetch(`${origin}/.well-known/llms.txt`, { signal: controller2.signal });
        clearTimeout(timeoutId2);
        if (llmsRes2.ok) {
          factors.hasLlmsTxt = true;
        }
      }
    } catch (e) {
      logger.warn(`Could not check llms.txt for ${url}: ${e.message}`);
    }

    // 8. Live DuckDuckGo Search Visibility Test
    try {
      const leadType = leadData.type || 'serviço';
      const leadCity = leadData.city || 'Portugal';
      const searchQuery = `${leadType} em ${leadCity}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const searchRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (searchRes.ok) {
        const searchText = await searchRes.text();
        const search$ = cheerio.load(searchText);
        const links = [];
        
        search$('a.result__url').each((i, el) => {
          const href = search$(el).attr('href') || '';
          if (href) links.push(href.toLowerCase());
        });

        const cleanUrl = url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        const rankIndex = links.findIndex(lnk => lnk.includes(cleanUrl));

        if (rankIndex >= 0) {
          if (rankIndex < 3) {
            factors.aiSearchVisibility = 100;
            factors.searchRank = `Top 3 (#${rankIndex + 1})`;
          } else if (rankIndex < 10) {
            factors.aiSearchVisibility = 75;
            factors.searchRank = `Top 10 (#${rankIndex + 1})`;
          } else {
            factors.aiSearchVisibility = 40;
            factors.searchRank = `Top 30 (#${rankIndex + 1})`;
          }
        } else {
          factors.aiSearchVisibility = 0;
          factors.searchRank = 'Não listado nos primeiros resultados';
        }
      }
    } catch (e) {
      logger.warn(`Search visibility check failed for ${url}: ${e.message}`);
    }

    // Calculate Final AEO Score
    const schemaScore = factors.hasSchema ? 100 : 0;
    const faqScore = factors.hasFAQ ? 100 : 0;
    const llmsScore = factors.hasLlmsTxt ? 100 : 0;
    
    let baseScore = Math.round(
      (schemaScore * 0.25) + 
      (faqScore * 0.10) + 
      (llmsScore * 0.15) +
      (factors.headingStructure * 0.15) + 
      (factors.answerFormat * 0.15) + 
      (factors.semanticDensity * 0.10) +
      (factors.aiSearchVisibility * 0.10)
    );

    // Impose massive penalty if AI Bots are actively blocked from crawls
    if (factors.aiBotsBlocked) {
      baseScore = Math.max(0, baseScore - 30);
    }

    return {
      score: baseScore,
      factors,
      status: baseScore >= 80 ? 'AEO Otimizado' : baseScore >= 50 ? 'AEO Intermédio' : 'AEO Fraco',
      recommendations: [
        factors.aiBotsBlocked && `🚨 CRÍTICO: O seu site está a bloquear os crawlers de IA (${factors.blockedBots.join(', ')}) no robots.txt! Isto impede que seja citado no ChatGPT ou Perplexity.`,
        !factors.hasLlmsTxt && `💡 GEO: Ficheiro llms.txt em falta. Adicionar um ficheiro /llms.txt para facilitar a indexação por assistentes de inteligência artificial.`,
        factors.aiSearchVisibility === 0 && `🔍 Visibilidade: O seu negócio não aparece no topo das pesquisas locais para "${leadData.type || 'serviço'} em ${leadData.city || 'sua cidade'}"`,
        !factors.titleAEOReady && factors.suggestedAEOTitle && `💡 AEO Sugestão de Título: Altere o título da página para um formato conversacional. Sugestão: "${factors.suggestedAEOTitle}"`,
        !factors.hasSchema && 'Implementar Schema.org (JSON-LD) para Organization e LocalBusiness',
        !factors.hasFAQ && 'Adicionar uma secção de Perguntas Frequentes (FAQ) com marcação Schema',
        factors.headingStructure < 50 && 'Utilizar perguntas diretas nos títulos (H2/H3)',
        factors.answerFormat < 50 && 'Criar respostas concisas (30-60 palavras) logo após os títulos'
      ].filter(Boolean)
    };

  } catch (error) {
    logger.error('Erro na análise AEO:', error);
    return { score: 0, error: error.message };
  }
}
