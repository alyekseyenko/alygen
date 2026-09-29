import axios from 'axios';
import * as cheerio from 'cheerio';
import groqKeyManager from '../groq-key-manager.js';
import { assertPublicHttpUrl } from '../../utils/ssrf.js';
import { invokeGroqChat, invokeLlmJson, parseJsonFromLlm } from '../llm-client.js';

const CTA_SYSTEM = 'Especialista em CRO. Analise CTAs e responda apenas em JSON válido em PT-PT.';

/**
 * AI-powered CTA analysis (Quality, Persuasion, Clarity)
 */
export async function analyzeCTA(url, html = null) {
  try {
    await assertPublicHttpUrl(url);
    let pageHtml = html;
    if (!pageHtml) {
      const { data } = await axios.get(url, { timeout: 20000 });
      pageHtml = data;
    }
    const $ = cheerio.load(pageHtml);

    const ctas = [];
    $('button, a.btn, a.button, input[type="submit"], [class*="cta"], [class*="btn"]').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');

      if (text.length > 0 && text.length < 100) {
        ctas.push({ text, href: href || 'N/A' });
      }
    });

    if (ctas.length === 0) {
      return { hasCTA: false, quality: 0, suggestions: ['Adicionar CTAs claros'] };
    }

    const ctaText = ctas.map((c, i) => `${i + 1}. "${c.text}"`).join('\n');
    const userPrompt = `Analise estes CTAs:\n\n${ctaText}\n\nResponda em JSON:\n{\n  "quality": 1-10,\n  "hasCTA": true,\n  "persuasion": 1-10,\n  "clarity": 1-10,\n  "urgency": 1-10,\n  "bestCTA": "texto",\n  "worstCTA": "texto",\n  "suggestions": ["sugestão 1", "sugestão 2"]\n}`;

    let analysis = null;
    try {
      analysis = await invokeLlmJson({
        system: CTA_SYSTEM,
        user: userPrompt,
        purpose: 'reasoning',
        agentName: 'cta_analyzer',
        leadWebsite: url,
        timeoutMs: 35_000,
      });
    } catch (gatewayErr) {
      const groqApiKey = groqKeyManager.getCurrentKey();
      if (!groqApiKey) {
        console.warn('⚠️ CTA: gateway e Groq indisponíveis');
        return { hasCTA: true, quality: 5, suggestions: [], totalCTAs: ctas.length, ctas: ctas.slice(0, 5) };
      }
      try {
        const { text } = await invokeGroqChat({
          groqApiKey,
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: CTA_SYSTEM },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.5,
          maxTokens: 400,
        });
        analysis = parseJsonFromLlm(text);
      } catch (groqErr) {
        const errorMsg = groqErr.response?.data?.error?.message || groqErr.message;
        if (errorMsg.includes('rate_limit_exceeded')) {
          groqKeyManager.markAsFailed(groqKeyManager.getCurrentKey());
          groqKeyManager.rotateKey();
        }
      }
    }

    if (analysis) {
      return { ...analysis, totalCTAs: ctas.length, ctas: ctas.slice(0, 5) };
    }

    return { hasCTA: true, quality: 5, suggestions: [], totalCTAs: ctas.length, ctas: ctas.slice(0, 5) };
  } catch (error) {
    return { hasCTA: false, quality: 0, suggestions: [] };
  }
}
