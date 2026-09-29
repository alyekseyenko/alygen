import dotenv from 'dotenv';
import groqKeyManager from './groq-key-manager.js';
import { invokeGroqChat, invokePythonLlm } from './llm-client.js';

dotenv.config();

const MODEL = process.env.OPENAI_MODEL || 'llama-3.1-8b-instant';

/**
 * Gera um pitch de vendas personalizado usando IA com rotação automática de chaves
 */
export async function generateAIPitch(analysis, leadData, customPrompt = '') {
  const qScore = analysis.qScore?.score || analysis.overallScore || 0;
  const website = leadData.website || analysis.url;

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

  try {
    const { text } = await invokePythonLlm({
      system: systemPrompt,
      user: userPrompt,
      purpose: 'copy',
      timeoutMs: 30_000,
    });
    if (text?.trim()) {
      const { logAiGeneration } = await import('./ai-generations.js');
      await logAiGeneration({
        agentName: 'automation_pitch',
        promptVersion: '1.0.0',
        leadWebsite: website,
        outputText: text.slice(0, 4000),
        model: 'llm_gateway',
      });
      return text.trim();
    }
  } catch (gatewayErr) {
    console.warn('⚠️ LLM gateway pitch falhou:', gatewayErr.message);
  }

  const apiKey = groqKeyManager.getCurrentKey() || process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Nenhuma chave Groq configurada ou disponível. IA Personalizer desativado.');
    return 'IA não configurada. Por favor, adicione a chave GROQ_API_KEY ao ficheiro .env.';
  }

  try {
    const { text } = await invokeGroqChat({
      groqApiKey: apiKey,
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 500,
    });
    return (text || '').trim();
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
