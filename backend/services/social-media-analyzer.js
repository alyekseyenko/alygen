import axios from 'axios';
import * as cheerio from 'cheerio';

export async function analyzeSocialMedia(url, html = null) {
  try {
    if (!html) {
      const { data } = await axios.get(url, { timeout: 30000 });
      html = data;
    }
    
    const $ = cheerio.load(html);
    
    const platforms = {
      facebook: extractFacebook($, html),
      instagram: extractInstagram($, html),
      linkedin: extractLinkedIn($, html),
      twitter: extractTwitter($, html),
      youtube: extractYouTube($, html),
      tiktok: extractTikTok($, html),
      pinterest: extractPinterest($, html)
    };
    
    const totalPlatforms = Object.values(platforms).filter(p => p.hasLink).length;
    const score = calculateSocialScore(platforms, totalPlatforms);
    
    return {
      platforms,
      totalPlatforms,
      score,
      recommendations: generateSocialRecommendations(platforms, totalPlatforms)
    };
  } catch (error) {
    console.error('Social Media Analysis Error:', error.message);
    return { score: 0, totalPlatforms: 0, error: error.message };
  }
}

function extractFacebook($, html) {
  const links = $('a[href*="facebook.com"]');
  
  if (links.length === 0) {
    return { hasLink: false, url: null };
  }
  
  const url = links.first().attr('href');
  const cleanUrl = cleanSocialUrl(url, 'facebook.com');
  
  return {
    hasLink: true,
    url: cleanUrl,
    linkText: links.first().text().trim() || 'Facebook',
    linksCount: links.length
  };
}

function extractInstagram($, html) {
  const links = $('a[href*="instagram.com"]');
  
  if (links.length === 0) {
    return { hasLink: false, url: null };
  }
  
  const url = links.first().attr('href');
  const cleanUrl = cleanSocialUrl(url, 'instagram.com');
  
  // Tentar extrair username
  const usernameMatch = cleanUrl.match(/instagram\.com\/([^\/\?]+)/);
  const username = usernameMatch ? usernameMatch[1] : null;
  
  return {
    hasLink: true,
    url: cleanUrl,
    username,
    linkText: links.first().text().trim() || 'Instagram',
    linksCount: links.length
  };
}

function extractLinkedIn($, html) {
  const links = $('a[href*="linkedin.com"]');
  
  if (links.length === 0) {
    return { hasLink: false, url: null };
  }
  
  const url = links.first().attr('href');
  const cleanUrl = cleanSocialUrl(url, 'linkedin.com');
  
  // Detectar se é company ou personal
  const isCompany = cleanUrl.includes('/company/');
  
  return {
    hasLink: true,
    url: cleanUrl,
    type: isCompany ? 'company' : 'personal',
    linkText: links.first().text().trim() || 'LinkedIn',
    linksCount: links.length
  };
}

function extractTwitter($, html) {
  const links = $('a[href*="twitter.com"], a[href*="x.com"]');
  
  if (links.length === 0) {
    return { hasLink: false, url: null };
  }
  
  const url = links.first().attr('href');
  const cleanUrl = cleanSocialUrl(url, 'twitter.com');
  
  return {
    hasLink: true,
    url: cleanUrl,
    linkText: links.first().text().trim() || 'Twitter/X',
    linksCount: links.length
  };
}

function extractYouTube($, html) {
  const links = $('a[href*="youtube.com"], a[href*="youtu.be"]');
  
  if (links.length === 0) {
    return { hasLink: false, url: null };
  }
  
  const url = links.first().attr('href');
  const cleanUrl = cleanSocialUrl(url, 'youtube.com');
  
  return {
    hasLink: true,
    url: cleanUrl,
    linkText: links.first().text().trim() || 'YouTube',
    linksCount: links.length
  };
}

function extractTikTok($, html) {
  const links = $('a[href*="tiktok.com"]');
  
  if (links.length === 0) {
    return { hasLink: false, url: null };
  }
  
  const url = links.first().attr('href');
  const cleanUrl = cleanSocialUrl(url, 'tiktok.com');
  
  return {
    hasLink: true,
    url: cleanUrl,
    linkText: links.first().text().trim() || 'TikTok',
    linksCount: links.length
  };
}

function extractPinterest($, html) {
  const links = $('a[href*="pinterest.com"]');
  
  if (links.length === 0) {
    return { hasLink: false, url: null };
  }
  
  const url = links.first().attr('href');
  const cleanUrl = cleanSocialUrl(url, 'pinterest.com');
  
  return {
    hasLink: true,
    url: cleanUrl,
    linkText: links.first().text().trim() || 'Pinterest',
    linksCount: links.length
  };
}

function cleanSocialUrl(url, platform) {
  if (!url) return null;
  
  // Remover parâmetros de tracking
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `${urlObj.origin}${urlObj.pathname}`.replace(/\/$/, '');
  } catch {
    return url;
  }
}

function calculateSocialScore(platforms, totalPlatforms) {
  let score = 0;
  
  // Plataformas essenciais
  if (platforms.facebook.hasLink) score += 20;
  if (platforms.instagram.hasLink) score += 25;
  if (platforms.linkedin.hasLink) score += 20;
  
  // Plataformas complementares
  if (platforms.youtube.hasLink) score += 15;
  if (platforms.twitter.hasLink) score += 10;
  if (platforms.tiktok.hasLink) score += 5;
  if (platforms.pinterest.hasLink) score += 5;
  
  return Math.min(score, 100);
}

function generateSocialRecommendations(platforms, totalPlatforms) {
  const recommendations = [];
  
  if (totalPlatforms === 0) {
    recommendations.push('CRÍTICO: Adicionar links para redes sociais (mínimo Instagram e Facebook)');
    return recommendations;
  }
  
  if (!platforms.instagram.hasLink) {
    recommendations.push('Adicionar Instagram (essencial para engagement visual)');
  }
  
  if (!platforms.facebook.hasLink) {
    recommendations.push('Adicionar Facebook (maior alcance em Portugal)');
  }
  
  if (!platforms.linkedin.hasLink) {
    recommendations.push('Adicionar LinkedIn (credibilidade B2B)');
  }
  
  if (totalPlatforms < 3) {
    recommendations.push('Expandir presença digital (mínimo 3 plataformas recomendado)');
  }
  
  if (!platforms.youtube.hasLink) {
    recommendations.push('Considerar YouTube para conteúdo em vídeo (SEO++)');
  }
  
  return recommendations.slice(0, 3);
}
