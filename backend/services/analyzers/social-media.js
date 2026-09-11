import puppeteer from 'puppeteer';

/**
 * 🆕 DETECTAR SE URL É REDE SOCIAL
 */
export function detectSocialMediaUrl(url) {
  const urlLower = url.toLowerCase();
  
  const platforms = {
    'facebook.com': { 
      platform: 'Facebook', 
      icon: '📘',
      message: 'Este negócio usa apenas Facebook. Sem website próprio, perde 70% das pesquisas do Google e não tem controle sobre a presença digital.',
      canExtractEmail: true
    },
    'instagram.com': { 
      platform: 'Instagram', 
      icon: '📸',
      message: 'Este negócio usa apenas Instagram. Sem website próprio, perde credibilidade e não aparece no Google.',
      canExtractEmail: false
    },
    'linkedin.com': { 
      platform: 'LinkedIn', 
      icon: '💼',
      message: 'Este negócio usa apenas LinkedIn. Sem website próprio, limita o alcance e não aparece em pesquisas do Google.',
      canExtractEmail: true
    },
    'twitter.com': { 
      platform: 'Twitter/X', 
      icon: '🐦',
      message: 'Este negócio usa apenas Twitter/X. Sem website próprio, perde oportunidades de conversão.',
      canExtractEmail: false
    },
    'x.com': { 
      platform: 'Twitter/X', 
      icon: '🐦',
      message: 'Este negócio usa apenas Twitter/X. Sem website próprio, perde oportunidades de conversão.',
      canExtractEmail: false
    },
    'tiktok.com': { 
      platform: 'TikTok', 
      icon: '🎵',
      message: 'Este negócio usa apenas TikTok. Sem website próprio, não consegue converter visualizações em vendas.',
      canExtractEmail: false
    },
    'youtube.com': { 
      platform: 'YouTube', 
      icon: '🎥',
      message: 'Este negócio usa apenas YouTube. Sem website próprio, perde oportunidades de captar leads.',
      canExtractEmail: false
    }
  };
  
  for (const [domain, info] of Object.entries(platforms)) {
    if (urlLower.includes(domain)) {
      return {
        isSocialMedia: true,
        ...info,
        profileUrl: url
      };
    }
  }
  
  return { isSocialMedia: false };
}

/**
 * Extract phone from platform page using Puppeteer
 */
export async function extractPhoneFromSocialMedia(url, platform) {
  let browser = null;
  try {
    if (platform === 'Facebook') {
      browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      const aboutUrl = url.includes('/about') ? url : `${url}/about`;
      await page.goto(aboutUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const html = await page.content();
      const matches = html.match(/\+351\s?9\d{2}\s?\d{3}\s?\d{3}/g) || [];
      return matches[0] || null;
    }
    return null;
  } catch (error) {
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Extract email from platform page using Puppeteer
 */
export async function extractEmailFromSocialMedia(url, platform) {
  let browser = null;
  try {
    if (platform === 'Facebook' || platform === 'LinkedIn') {
      browser = await puppeteer.launch({ headless: 'new' });
      const page = await browser.newPage();
      const aboutUrl = url.includes('/about') ? url : `${url}/about`;
      await page.goto(aboutUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const html = await page.content();
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const matches = html.match(emailRegex) || [];
      return matches[0] || null;
    }
    return null;
  } catch (error) {
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}


/**
 * 🆕 GERAR PROPOSTA DE WEBSITE PARA QUEM NÃO TEM
 */
export function generateWebsiteProposal(leadData, socialMediaInfo) {
  const businessType = leadData.type || 'default';
  
  const pricing = {
    'real_estate_agency': { base: 699, recommended: 3500, features: 8, timeline: '4-6 semanas' },
    'restaurant': { base: 699, recommended: 1800, features: 6, timeline: '3-4 semanas' },
    'clinic': { base: 699, recommended: 2500, features: 7, timeline: '3-4 semanas' },
    'lawyer': { base: 699, recommended: 2800, features: 7, timeline: '4-5 semanas' },
    'default': { base: 699, recommended: 1950, features: 5, timeline: '2-4 semanas' }
  };

  const plan = pricing[businessType] || pricing['default'];

  return {
    platform: socialMediaInfo.platform,
    problem: socialMediaInfo.message,
    proposal: {
      type: 'Website Profissional Alygen Core™',
      price: plan.recommended,
      features: plan.features,
      timeline: plan.timeline,
      roi: 'Aumento esperado de 30-50% em leads qualificados no primeiro trimestre.'
    }
  };
}
