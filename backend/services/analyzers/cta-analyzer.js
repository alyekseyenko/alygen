import axios from 'axios';
import * as cheerio from 'cheerio';
import groqKeyManager from '../groq-key-manager.js';

/**
 * AI-powered CTA analysis (Quality, Persuasion, Clarity)
 */
export async function analyzeCTA(url) {
  const groqApiKey = groqKeyManager.getCurrentKey();
  
  if (!groqApiKey) {
    console.warn('⚠️ No Groq key - disabling CTA analysis');
    return { hasCTA: false, quality: 0, suggestions: [] };
  }
  
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    
    // Extract visible CTAs
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
    
    // AI analysis
    const ctaText = ctas.map((c, i) => `${i + 1}. "${c.text}"`).join('\n');
    
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-specdec',
        messages: [
          { role: 'system', content: 'Você é especialista em CRO. Analise CTAs e responda em JSON.' },
          { role: 'user', content: `Analise estes CTAs:\n\n${ctaText}\n\nResponda em JSON:\n{\n  "quality": 1-10,\n  "hasCTA": true,\n  "persuasion": 1-10,\n  "clarity": 1-10,\n  "urgency": 1-10,\n  "bestCTA": "texto",\n  "worstCTA": "texto",\n  "suggestions": ["sugestão 1", "sugestão 2"]\n}` }
        ],
        temperature: 0.5,
        max_tokens: 400
      },
      {
        headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );
    
    const aiResponse = response.data.choices[0].message.content;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      return { ...analysis, totalCTAs: ctas.length, ctas: ctas.slice(0, 5) };
    }
    
    return { hasCTA: true, quality: 5, suggestions: [] };
    
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    if (errorMsg.includes('rate_limit_exceeded')) {
      groqKeyManager.markAsFailed(groqKeyManager.getCurrentKey());
      groqKeyManager.rotateKey();
    }
    return { hasCTA: false, quality: 0, suggestions: [] };
  }
}
