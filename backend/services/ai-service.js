import axios from 'axios';
import dotenv from 'dotenv';
import groqKeyManager from './groq-key-manager.js';

dotenv.config();

const API_URL = process.env.OPENAI_BASE_URL || 'https://api.groq.com/openai/v1';
const MODEL = process.env.OPENAI_MODEL || 'llama-3.1-8b-instant';

/**
 * Gera um pitch de vendas personalizado usando IA com rotação automática de chaves
 */
export async function generateAIPitch(analysis, leadData, customPrompt = '') {
  const apiKey = groqKeyManager.getCurrentKey() || process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Nenhuma chave Groq configurada ou disponível. IA Personalizer desativado.');
    return 'IA não configurada. Por favor, adicione a chave GROQ_API_KEY ao ficheiro .env.';
  }

  try {
    const qScore = analysis.qScore?.score || analysis.overallScore || 0;
    const website = leadData.website || analysis.url;
    
    // Construir contexto para a IA
    const context = `
      Empresa: ${leadData.name || 'Cliente'}
      Website: ${website}
      QScore: ${qScore}/100
      Problemas Detetados:
      - Performance Mobile: ${analysis.performanceMobile || 'N/A'}%
      - Tem SSL: ${analysis.security?.hasSSL ? 'Sim' : 'Não'}
      - Meta Pixel: ${analysis.pixelDetails?.facebook ? 'Sim' : 'Não'}
      - Google Ads: ${analysis.pixelDetails?.googleAds ? 'Sim' : 'Não'}
      - Social Media Only: ${analysis.isSocialMediaOnly ? 'Sim' : 'Não'}
      - Erros Críticos: ${analysis.qScoreAdvanced?.errors || 0}
    `;

    const systemPrompt = `És um consultor de marketing digital especialista em vendas B2B. 
    O teu objetivo é escrever um parágrafo curto, persuasivo e profissional (máximo 3-4 frases) 
    para convencer este cliente a marcar uma reunião para melhorar o seu site/presença online.
    Usa os dados reais da análise para mostrar autoridade.
    Sê direto, empático e foca-te em mostrar como eles estão a perder dinheiro ou clientes.
    Fala em Português de Portugal.`;

    const userPrompt = customPrompt 
      ? `Usa este modelo de prompt: ${customPrompt}\n\nDados do cliente:\n${context}`
      : `Escreve um pitch personalizado para este cliente:\n${context}`;

    const response = await axios.post(`${API_URL}/chat/completions`, {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const result = response.data.choices[0]?.message?.content || '';
    return result.trim();

  } catch (error) {
    if (error.response?.status === 429) {
      console.warn('⚠️ Groq 429 Rate Limit atingido no ai-service. Rotacionando chave...');
      groqKeyManager.rotateKey();
    }
    console.error('❌ Erro ao gerar pitch com IA:', error.response?.data || error.message);
    return `Erro ao gerar pitch: ${error.message}`;
  }
}

export default { generateAIPitch };
