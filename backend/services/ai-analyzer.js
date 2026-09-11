import axios from 'axios';
import groqKeyManager from './groq-key-manager.js';

export async function analyzeWithAI(analysisData) {
  const prompt = buildAnalysisPrompt(analysisData);
  
  try {
    const groqApiKey = groqKeyManager.getCurrentKey();
    
    if (!groqApiKey) {
      console.warn('⚠️ Nenhuma chave Groq disponível - tentando Ollama Local...');
      const localResult = await analyzeWithOllama(prompt);
      if (localResult) {
        return parseAIResponse(localResult, analysisData);
      }
      return generateBasicInsights(analysisData);
    }
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em marketing digital. Analise dados técnicos e gere insights práticos em JSON.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
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
    return parseAIResponse(aiResponse, analysisData);
    
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    
    // Se for rate limit, rotacionar chave e tentar novamente
    if (errorMsg.includes('rate_limit_exceeded') || errorMsg.includes('Rate limit')) {
      console.log('⚠️ AI Analysis: Rate limit, rotacionando chave...');
      groqKeyManager.markAsFailed(groqKeyManager.getCurrentKey());
      const newKey = groqKeyManager.rotateKey();
      
      if (newKey) {
        console.log('🔄 Tentando novamente com nova chave...');
        return analyzeWithAI(analysisData); // Retry com nova chave
      } else {
        console.log('⚠️ Todas as chaves Groq esgotadas - tentando Ollama Local...');
        const localResult = await analyzeWithOllama(prompt);
        if (localResult) {
          return parseAIResponse(localResult, analysisData);
        }
        return generateBasicInsights(analysisData);
      }
    }
    
    console.error('AI Analysis Error, tentando Ollama Fallback:', error.response?.data || error.message);
    const localResult = await analyzeWithOllama(prompt);
    if (localResult) {
      return parseAIResponse(localResult, analysisData);
    }
    return generateBasicInsights(analysisData);
  }
}

function buildAnalysisPrompt(data) {
  const { lead, performance, seo, security, accessibility, tracking, content, aeo } = data;
  
  return `Analise este website de ${lead.type || 'negócio'} localizado em ${lead.address || 'Portugal'}:

**DADOS TÉCNICOS:**
- Performance: ${performance.mobile}/100 (Mobile), LCP: ${performance.lcp}s, CLS: ${performance.cls}
- SEO Score: ${seo.score}/100 (Title: ${seo.title?.optimal ? '✓' : '✗'}, Meta: ${seo.description?.optimal ? '✓' : '✗'}, Sitemap: ${seo.hasSitemap ? '✓' : '✗'})
- Segurança: ${security.score}/100 (SSL: ${security.hasSSL ? '✓' : '✗'}, Headers: ${Object.values(security.headers || {}).filter(Boolean).length}/6)
- Acessibilidade: ${accessibility.score}/100 (${accessibility.errors} erros, ${accessibility.warnings} avisos)
- Tracking: ${tracking.totalTracking} ferramentas (Meta: ${tracking.facebook ? '✓' : '✗'}, GA4: ${tracking.ga4 ? '✓' : '✗'}, GTM: ${tracking.gtm ? '✓' : '✗'})
- AEO (IA Search): ${aeo?.score || 0}/100 (Schema: ${aeo?.factors?.hasSchema ? '✓' : '✗'}, FAQ: ${aeo?.factors?.hasFAQ ? '✓' : '✗'})

**CONCORRÊNCIA:**
Rating: ${lead.rating}⭐ (${lead.reviews} avaliações)

**CONTEÚDO DO SITE:**
${content.substring(0, 500)}...

**TAREFA:**
Gere uma análise em formato JSON com:
1. leadScore (0-100): Pontuação de prioridade
2. priority: "ALTA", "MÉDIA" ou "BAIXA"
3. tone: Tom do site (ex: "profissional-moderno", "conservador", "jovem-descontraído")
4. mainIssues: Array com 3-5 problemas principais (linguagem de negócio)
5. opportunities: Array com 3-5 oportunidades (com impacto estimado)
6. estimatedImpact: Objeto com impacto estimado em performance, tracking, accessibility
7. personalizedPitch: Parágrafo de 2-3 linhas para email (personalizado, direto ao ponto)

Responda APENAS com o JSON, sem markdown.`;
}

function parseAIResponse(aiResponse, analysisData) {
  try {
    // Tentar extrair JSON da resposta
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in AI response');
  } catch (error) {
    console.error('Failed to parse AI response:', error.message);
    return generateBasicInsights(analysisData);
  }
}

function generateBasicInsights(data) {
  const { performance, seo, security, accessibility, tracking, aeo } = data;
  
  const issues = [];
  const opportunities = [];
  
  // Performance
  if (performance.mobile < 50) {
    issues.push('Performance crítica em mobile - perde clientes no carregamento');
    opportunities.push('Otimizar imagens e código pode aumentar conversões em 40%');
  }
  
  // SEO
  if (seo.score < 70) {
    issues.push('SEO técnico deficiente - invisível no Google');
    opportunities.push('Corrigir meta tags e sitemap pode triplicar tráfego orgânico');
  }
  
  // Security
  if (security.score < 70) {
    issues.push('Falhas de segurança - risco de multas RGPD');
    opportunities.push('Implementar SSL e headers de segurança (conformidade legal)');
  }
  
  // Accessibility
  if (accessibility.score < 60) {
    issues.push('Não acessível - exclui 15% do mercado');
    opportunities.push('Corrigir acessibilidade abre mercado de pessoas com deficiência');
  }
  
  // Tracking
  if (tracking.totalTracking < 2) {
    issues.push('Sem tracking adequado - investe às cegas');
    opportunities.push('Implementar Meta Pixel e GA4 para medir ROI real');
  }
  
  // AEO
  if (aeo?.score < 50) {
    issues.push('AEO Inexistente - invisível para Gemini/ChatGPT/Perplexity');
    opportunities.push('Implementar dados estruturados Schema.org para capturar tráfego de IA');
  }
  
  const leadScore = Math.round(
    (100 - performance.mobile) * 0.3 +
    (100 - seo.score) * 0.25 +
    (100 - security.score) * 0.2 +
    (100 - accessibility.score) * 0.15 +
    (tracking.totalTracking < 2 ? 20 : 0)
  );
  
  return {
    leadScore: Math.min(leadScore, 100),
    priority: leadScore > 60 ? 'ALTA' : leadScore > 30 ? 'MÉDIA' : 'BAIXA',
    tone: 'profissional',
    mainIssues: issues.slice(0, 5),
    opportunities: opportunities.slice(0, 5),
    estimatedImpact: {
      performance: performance.mobile < 50 ? '+40% conversões' : '+15% conversões',
      tracking: tracking.totalTracking < 2 ? '+200% dados marketing' : 'Otimização',
      accessibility: accessibility.score < 60 ? 'Conformidade legal' : 'Melhorias'
    },
    personalizedPitch: `Analisei o vosso site e identifiquei ${issues.length} oportunidades críticas de melhoria. ${issues[0]}. Posso ajudar a resolver isto e aumentar os vossos resultados.`
  };
}

/**
 * Communicates with the local Ollama API instance to perform deep audits
 * whenever external Groq API pools are exhausted or rate-limited.
 */
async function analyzeWithOllama(prompt) {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/chat';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
    
    console.log(`🦙 [Ollama Fallback] Calling local Ollama model: "${ollamaModel}" at ${ollamaUrl}...`);
    
    const response = await axios.post(ollamaUrl, {
      model: ollamaModel,
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em marketing digital e prospecção de vendas B2B. Analise dados técnicos e gere insights práticos em JSON de forma estritamente factual.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false,
      options: {
        temperature: 0.6
      }
    }, { timeout: 15000 }); // Fail fast if local Ollama is offline or slow

    const aiResponse = response.data?.message?.content;
    if (aiResponse) {
      console.log(`✅ [Ollama Fallback] Local Ollama successfully completed the analysis!`);
      return aiResponse;
    }
    return null;
  } catch (err) {
    console.warn('⚠️ [Ollama Fallback] Local Ollama is unreachable or errored:', err.message);
    return null;
  }
}
