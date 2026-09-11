import axios from 'axios';
import * as cheerio from 'cheerio';

export async function analyzeContent(url, html = null, groqApiKey = null) {
  try {
    if (!html) {
      const { data } = await axios.get(url, { timeout: 30000 });
      html = data;
    }
    
    const $ = cheerio.load(html);
    
    // Extrair conteúdo textual
    const content = extractContent($);
    
    // Análise básica (sem IA)
    const basicAnalysis = analyzeBasicContent(content, $);
    
    // Análise com IA (se disponível)
    let aiAnalysis = null;
    if (groqApiKey && content.mainText.length > 100) {
      aiAnalysis = await analyzeContentWithAI(content, groqApiKey);
    }
    
    const score = calculateContentScore(basicAnalysis, aiAnalysis);
    
    return {
      ...basicAnalysis,
      aiAnalysis,
      score,
      recommendations: generateContentRecommendations(basicAnalysis, aiAnalysis)
    };
  } catch (error) {
    console.error('Content Analysis Error:', error.message);
    return { score: 0, error: error.message };
  }
}

function extractContent($) {
  // Remover scripts, styles, nav, footer
  $('script, style, nav, footer, header').remove();
  
  const mainText = $('main, article, [role="main"], .content, #content, body').first().text();
  const headings = {
    h1: $('h1').map((i, el) => $(el).text().trim()).get(),
    h2: $('h2').map((i, el) => $(el).text().trim()).get(),
    h3: $('h3').map((i, el) => $(el).text().trim()).get()
  };
  
  const paragraphs = $('p').map((i, el) => $(el).text().trim()).get().filter(p => p.length > 20);
  
  return {
    mainText: mainText.trim().substring(0, 5000), // Limitar para IA
    headings,
    paragraphs: paragraphs.slice(0, 10),
    wordCount: mainText.split(/\s+/).length
  };
}

function analyzeBasicContent(content, $) {
  const text = content.mainText.toLowerCase();
  
  // Análise de legibilidade (Flesch Reading Ease simplificado)
  const sentences = content.mainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.mainText.split(/\s+/);
  const avgWordsPerSentence = words.length / sentences.length;
  
  const readability = avgWordsPerSentence < 15 ? 'Fácil' :
                      avgWordsPerSentence < 20 ? 'Média' : 'Difícil';
  
  // Densidade de palavras-chave (SEO)
  const keywords = extractKeywords(text);
  
  // Estrutura de vendas (AIDA, PAS)
  const salesStructure = detectSalesStructure(text, content.headings);
  
  // Prova social
  const socialProofMentions = countSocialProofMentions(text);
  
  // Gramática básica (erros comuns)
  const grammarIssues = detectBasicGrammarIssues(content.mainText);
  
  return {
    wordCount: content.wordCount,
    readability,
    avgWordsPerSentence: Math.round(avgWordsPerSentence),
    keywords,
    salesStructure,
    socialProofMentions,
    grammarIssues,
    hasEnoughContent: content.wordCount >= 300
  };
}

function extractKeywords(text) {
  // Palavras comuns a ignorar
  const stopWords = ['o', 'a', 'de', 'para', 'com', 'em', 'por', 'que', 'um', 'uma', 'os', 'as', 'do', 'da', 'dos', 'das', 'ao', 'à', 'aos', 'às', 'no', 'na', 'nos', 'nas', 'pelo', 'pela', 'pelos', 'pelas', 'e', 'ou', 'mas', 'se', 'como', 'mais', 'muito', 'já', 'também', 'só', 'quando', 'onde', 'quem'];
  
  const words = text.toLowerCase()
    .replace(/[^\w\sáàâãéèêíïóôõöúçñ]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w));
  
  // Contar frequência
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  // Top 10 palavras
  const topKeywords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
  
  return topKeywords;
}

function detectSalesStructure(text, headings) {
  const structure = {
    hasAttention: false,
    hasInterest: false,
    hasDesire: false,
    hasAction: false,
    hasProblem: false,
    hasAgitation: false,
    hasSolution: false
  };
  
  // AIDA - Attention
  const attentionKeywords = ['descubra', 'imagine', 'sabia que', 'atenção', 'novo', 'exclusivo'];
  structure.hasAttention = attentionKeywords.some(kw => text.includes(kw));
  
  // AIDA - Interest
  const interestKeywords = ['benefícios', 'vantagens', 'porque', 'como funciona'];
  structure.hasInterest = interestKeywords.some(kw => text.includes(kw));
  
  // AIDA - Desire
  const desireKeywords = ['resultados', 'transformar', 'alcançar', 'conquistar', 'sucesso'];
  structure.hasDesire = desireKeywords.some(kw => text.includes(kw));
  
  // AIDA - Action
  const actionKeywords = ['contacte', 'solicite', 'comece', 'experimente', 'agende'];
  structure.hasAction = actionKeywords.some(kw => text.includes(kw));
  
  // PAS - Problem
  const problemKeywords = ['problema', 'dificuldade', 'desafio', 'frustração'];
  structure.hasProblem = problemKeywords.some(kw => text.includes(kw));
  
  // PAS - Agitation
  const agitationKeywords = ['pior', 'perder', 'custar', 'risco', 'consequência'];
  structure.hasAgitation = agitationKeywords.some(kw => text.includes(kw));
  
  // PAS - Solution
  const solutionKeywords = ['solução', 'resolver', 'eliminar', 'garantir'];
  structure.hasSolution = solutionKeywords.some(kw => text.includes(kw));
  
  const aidaScore = [structure.hasAttention, structure.hasInterest, structure.hasDesire, structure.hasAction].filter(Boolean).length;
  const pasScore = [structure.hasProblem, structure.hasAgitation, structure.hasSolution].filter(Boolean).length;
  
  return {
    ...structure,
    aidaScore,
    pasScore,
    hasStructure: aidaScore >= 3 || pasScore >= 2
  };
}

function countSocialProofMentions(text) {
  let count = 0;
  
  const socialProofKeywords = [
    'clientes satisfeitos', 'anos de experiência', 'projetos realizados',
    'empresas confiam', 'certificado', 'prémio', 'reconhecido',
    'avaliações', 'testemunhos', 'depoimentos'
  ];
  
  socialProofKeywords.forEach(keyword => {
    if (text.includes(keyword)) count++;
  });
  
  return count;
}

function detectBasicGrammarIssues(text) {
  const issues = [];
  
  // Espaços duplos
  if (text.includes('  ')) {
    issues.push('Espaços duplos detectados');
  }
  
  // Pontuação sem espaço
  if (text.match(/[a-z][.!?,;:][A-Z]/)) {
    issues.push('Falta espaço após pontuação');
  }
  
  // CAPS LOCK excessivo
  const capsWords = text.match(/\b[A-Z]{4,}\b/g);
  if (capsWords && capsWords.length > 3) {
    issues.push('Uso excessivo de MAIÚSCULAS');
  }
  
  return issues;
}

async function analyzeContentWithAI(content, groqApiKey) {
  try {
    const prompt = `Analise este conteúdo:

TEXTO: ${content.mainText.substring(0, 1500)}

Responda APENAS com JSON válido:
{
  "writingQuality": 8,
  "persuasion": 7,
  "clarity": 9,
  "tone": "profissional",
  "problems": ["problema1", "problema2"],
  "suggestions": ["sugestao1", "sugestao2"]
}`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Você é especialista em copywriting. Responda APENAS com JSON válido.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    const aiResponse = response.data.choices[0].message.content;
    
    try {
      return JSON.parse(aiResponse);
    } catch (parseError) {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cleaned = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        return JSON.parse(cleaned);
      }
      throw parseError;
    }
    
  } catch (error) {
    console.error('AI Content Analysis Error:', error.response?.data?.error?.message || error.message);
    return null;
  }
}

function calculateContentScore(basic, ai) {
  let score = 50; // Base
  
  // Conteúdo suficiente (mais flexível)
  if (basic.wordCount >= 300) {
    score += 15;
  } else if (basic.wordCount >= 150) {
    score += 10; // Sites visuais (clínicas, restaurantes) têm menos texto
  } else if (basic.wordCount >= 100) {
    score += 5;
  }
  
  // Legibilidade
  if (basic.readability === 'Fácil') score += 15;
  else if (basic.readability === 'Média') score += 10;
  
  // Estrutura de vendas
  if (basic.salesStructure.hasStructure) score += 15;
  
  // Prova social
  score += Math.min(basic.socialProofMentions * 5, 10);
  
  // IA (se disponível)
  if (ai) {
    score += (ai.writingQuality * 2);
    score += (ai.persuasion * 2);
  }
  
  return Math.min(Math.max(score, 0), 100);
}

function generateContentRecommendations(basic, ai) {
  const recommendations = [];
  
  if (basic.wordCount < 150) {
    recommendations.push('Adicionar mais conteúdo textual (mínimo 150-300 palavras para SEO)');
  } else if (basic.wordCount < 300) {
    recommendations.push('Considerar expandir conteúdo para melhorar SEO (300+ palavras ideal)');
  }
  
  if (basic.readability === 'Difícil') {
    recommendations.push('Simplificar frases (média de 15 palavras por frase)');
  }
  
  if (!basic.salesStructure.hasStructure) {
    recommendations.push('Implementar estrutura de vendas (AIDA ou PAS)');
  }
  
  if (basic.socialProofMentions === 0) {
    recommendations.push('Adicionar prova social (depoimentos, números, certificações)');
  }
  
  if (basic.grammarIssues.length > 0) {
    recommendations.push(`Corrigir: ${basic.grammarIssues.join(', ')}`);
  }
  
  // Adicionar sugestões da IA
  if (ai && ai.suggestions) {
    recommendations.push(...ai.suggestions.slice(0, 2));
  }
  
  return recommendations.slice(0, 5);
}
