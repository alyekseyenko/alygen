import axios from 'axios';
import * as cheerio from 'cheerio';

export async function analyzeTechnologies(url, html = null) {
  try {
    if (!html) {
      const { data } = await axios.get(url, { timeout: 30000 });
      html = data;
    }
    
    const $ = cheerio.load(html);
    const htmlLower = html.toLowerCase();
    
    const technologies = {
      cms: detectCMS(htmlLower, $),
      framework: detectFramework(htmlLower, $),
      server: detectServer(htmlLower),
      cdn: detectCDN(htmlLower),
      analytics: detectAnalytics(htmlLower),
      ecommerce: detectEcommerce(htmlLower, $),
      hosting: detectHosting(htmlLower),
      plugins: detectPlugins(htmlLower, $)
    };
    
    // Score baseado em tecnologias modernas
    const score = calculateTechScore(technologies);
    
    // Identificar vulnerabilidades
    const vulnerabilities = identifyVulnerabilities(technologies, htmlLower);
    
    return {
      ...technologies,
      score,
      vulnerabilities,
      recommendations: generateTechRecommendations(technologies, vulnerabilities),
      costAnalysis: estimateStackCost(technologies)
    };
  } catch (error) {
    console.error('Technology Analysis Error:', error.message);
    return { score: 0, error: error.message };
  }
}

function detectCMS(html, $) {
  // WordPress
  if (html.includes('wp-content') || html.includes('wp-includes') || $('meta[name="generator"]').attr('content')?.includes('WordPress')) {
    const version = $('meta[name="generator"]').attr('content')?.match(/wordpress\s+([\d.]+)/i)?.[1];
    return { name: 'WordPress', version: version || 'Desconhecida', outdated: version && parseFloat(version) < 6.4 };
  }
  
  // Wix
  if (html.includes('wix.com') || html.includes('_wix')) {
    return { name: 'Wix', version: 'Cloud', outdated: false };
  }
  
  // Shopify
  if (html.includes('cdn.shopify.com') || html.includes('shopify')) {
    return { name: 'Shopify', version: 'Cloud', outdated: false };
  }
  
  // Webflow
  if (html.includes('webflow.com') || html.includes('webflow.js')) {
    return { name: 'Webflow', version: 'Cloud', outdated: false };
  }
  
  // Joomla
  if (html.includes('joomla') || $('meta[name="generator"]').attr('content')?.includes('Joomla')) {
    return { name: 'Joomla', version: 'Desconhecida', outdated: true };
  }
  
  // Drupal
  if (html.includes('drupal') || $('meta[name="generator"]').attr('content')?.includes('Drupal')) {
    return { name: 'Drupal', version: 'Desconhecida', outdated: false };
  }
  
  // Custom/Desconhecido
  return { name: 'Custom/Desconhecido', version: null, outdated: false };
}

function detectFramework(html, $) {
  const frameworks = [];
  
  // React
  if (html.includes('react') || html.includes('_react') || $('script[src*="react"]').length > 0) {
    frameworks.push('React');
  }
  
  // Vue.js
  if (html.includes('vue.js') || html.includes('__vue') || $('script[src*="vue"]').length > 0) {
    frameworks.push('Vue.js');
  }
  
  // Angular
  if (html.includes('angular') || html.includes('ng-') || $('[ng-app]').length > 0) {
    frameworks.push('Angular');
  }
  
  // Next.js
  if (html.includes('__next') || html.includes('_next/static')) {
    frameworks.push('Next.js');
  }
  
  // jQuery
  if (html.includes('jquery') || $('script[src*="jquery"]').length > 0) {
    frameworks.push('jQuery');
  }
  
  // Bootstrap
  if (html.includes('bootstrap') || $('link[href*="bootstrap"]').length > 0) {
    frameworks.push('Bootstrap');
  }
  
  // Tailwind CSS
  if (html.includes('tailwind') || $('script[src*="tailwind"]').length > 0) {
    frameworks.push('Tailwind CSS');
  }
  
  return frameworks.length > 0 ? frameworks : ['Nenhum detectado'];
}

function detectServer(html) {
  // Nginx
  if (html.includes('nginx')) return 'Nginx';
  
  // Apache
  if (html.includes('apache')) return 'Apache';
  
  // IIS
  if (html.includes('iis') || html.includes('microsoft-iis')) return 'Microsoft IIS';
  
  return 'Desconhecido';
}

function detectCDN(html) {
  const cdns = [];
  
  if (html.includes('cloudflare')) cdns.push('Cloudflare');
  if (html.includes('cloudfront')) cdns.push('AWS CloudFront');
  if (html.includes('akamai')) cdns.push('Akamai');
  if (html.includes('fastly')) cdns.push('Fastly');
  if (html.includes('cdn77')) cdns.push('CDN77');
  
  return cdns.length > 0 ? cdns : ['Nenhum detectado'];
}

function detectAnalytics(html) {
  const analytics = [];
  
  if (html.includes('google-analytics') || html.includes('gtag')) analytics.push('Google Analytics');
  if (html.includes('facebook.net/en_us/fbevents.js')) analytics.push('Meta Pixel');
  if (html.includes('hotjar')) analytics.push('Hotjar');
  if (html.includes('clarity.ms')) analytics.push('Microsoft Clarity');
  if (html.includes('mixpanel')) analytics.push('Mixpanel');
  
  return analytics;
}

function detectEcommerce(html, $) {
  if (html.includes('woocommerce') || $('body').hasClass('woocommerce')) return 'WooCommerce';
  if (html.includes('shopify')) return 'Shopify';
  if (html.includes('magento')) return 'Magento';
  if (html.includes('prestashop')) return 'PrestaShop';
  
  return null;
}

function detectHosting(html) {
  if (html.includes('hostgator')) return 'HostGator';
  if (html.includes('godaddy')) return 'GoDaddy';
  if (html.includes('bluehost')) return 'Bluehost';
  if (html.includes('siteground')) return 'SiteGround';
  if (html.includes('aws')) return 'AWS';
  if (html.includes('digitalocean')) return 'DigitalOcean';
  
  return 'Desconhecido';
}

function detectPlugins(html, $) {
  const plugins = [];
  
  // WordPress Plugins
  if (html.includes('wp-content/plugins/')) {
    const pluginMatches = html.match(/wp-content\/plugins\/([^\/'"]+)/g) || [];
    pluginMatches.forEach(match => {
      const pluginName = match.split('/')[2];
      if (!plugins.includes(pluginName)) plugins.push(pluginName);
    });
  }
  
  // Contact Form 7
  if (html.includes('contact-form-7')) plugins.push('Contact Form 7');
  
  // Yoast SEO
  if (html.includes('yoast')) plugins.push('Yoast SEO');
  
  // Elementor
  if (html.includes('elementor')) plugins.push('Elementor');
  
  return plugins.slice(0, 10); // Máximo 10 plugins
}

function calculateTechScore(tech) {
  let score = 50; // Base
  
  // CMS moderno
  if (['Shopify', 'Webflow', 'WordPress'].includes(tech.cms.name)) score += 15;
  if (tech.cms.outdated) score -= 20;
  
  // Framework moderno
  if (tech.framework.includes('React') || tech.framework.includes('Vue.js') || tech.framework.includes('Next.js')) score += 15;
  
  // CDN
  if (tech.cdn[0] !== 'Nenhum detectado') score += 10;
  
  // Analytics
  if (tech.analytics.length >= 2) score += 10;
  
  return Math.min(Math.max(score, 0), 100);
}

function identifyVulnerabilities(tech, html) {
  const vulnerabilities = [];
  
  // WordPress desatualizado
  if (tech.cms.name === 'WordPress' && tech.cms.outdated) {
    vulnerabilities.push({
      severity: 'CRÍTICO',
      issue: `WordPress ${tech.cms.version} desatualizado`,
      impact: 'Vulnerabilidades de segurança conhecidas',
      fix: 'Atualizar para WordPress 6.4+'
    });
  }
  
  // jQuery antigo
  const jqueryVersion = html.match(/jquery[/-]([\d.]+)/i)?.[1];
  if (jqueryVersion && parseFloat(jqueryVersion) < 3.0) {
    vulnerabilities.push({
      severity: 'MÉDIO',
      issue: `jQuery ${jqueryVersion} desatualizado`,
      impact: 'Vulnerabilidades XSS conhecidas',
      fix: 'Atualizar para jQuery 3.7+'
    });
  }
  
  // Sem CDN
  if (tech.cdn[0] === 'Nenhum detectado') {
    vulnerabilities.push({
      severity: 'BAIXO',
      issue: 'Sem CDN configurado',
      impact: 'Performance global reduzida',
      fix: 'Implementar Cloudflare ou AWS CloudFront'
    });
  }
  
  // Plugins excessivos
  if (tech.plugins.length > 15) {
    vulnerabilities.push({
      severity: 'MÉDIO',
      issue: `${tech.plugins.length} plugins instalados`,
      impact: 'Performance degradada e superfície de ataque aumentada',
      fix: 'Remover plugins não utilizados'
    });
  }
  
  return vulnerabilities;
}

function generateTechRecommendations(tech, vulnerabilities) {
  const recommendations = [];
  
  if (tech.cms.outdated) {
    recommendations.push('Atualizar CMS para versão mais recente (segurança crítica)');
  }
  
  if (tech.cdn[0] === 'Nenhum detectado') {
    recommendations.push('Implementar CDN para melhorar performance global');
  }
  
  if (tech.framework.includes('jQuery') && !tech.framework.includes('React')) {
    recommendations.push('Considerar migração para framework moderno (React/Vue)');
  }
  
  if (!tech.ecommerce && tech.cms.name === 'WordPress') {
    recommendations.push('Adicionar WooCommerce se planeia vender online');
  }
  
  return recommendations;
}

function estimateStackCost(tech) {
  let monthlyCost = 0;
  const breakdown = [];
  
  if (tech.hosting === 'AWS') {
    monthlyCost += 50;
    breakdown.push({ item: 'AWS Hosting', cost: 50 });
  } else if (tech.hosting === 'DigitalOcean') {
    monthlyCost += 20;
    breakdown.push({ item: 'DigitalOcean', cost: 20 });
  } else if (['HostGator', 'GoDaddy', 'Bluehost'].includes(tech.hosting)) {
    monthlyCost += 10;
    breakdown.push({ item: `${tech.hosting} Shared`, cost: 10 });
  } else if (tech.hosting === 'SiteGround') {
    monthlyCost += 15;
    breakdown.push({ item: 'SiteGround', cost: 15 });
  } else {
    monthlyCost += 15;
    breakdown.push({ item: 'Hosting Genérico', cost: 15 });
  }
  
  if (tech.cms.name === 'Shopify') {
    monthlyCost += 29;
    breakdown.push({ item: 'Shopify Basic', cost: 29 });
  } else if (tech.cms.name === 'Wix') {
    monthlyCost += 16;
    breakdown.push({ item: 'Wix Premium', cost: 16 });
  } else if (tech.cms.name === 'Webflow') {
    monthlyCost += 23;
    breakdown.push({ item: 'Webflow CMS', cost: 23 });
  }
  
  if (tech.cdn.includes('AWS CloudFront')) {
    monthlyCost += 10;
    breakdown.push({ item: 'AWS CloudFront', cost: 10 });
  }
  
  if (tech.cms.name === 'WordPress' && tech.plugins.length > 0) {
    const premiumPlugins = ['elementor', 'wpml', 'acf-pro', 'yoast-premium'];
    const hasPremium = tech.plugins.some(p => premiumPlugins.some(pp => p.includes(pp)));
    
    if (hasPremium) {
      monthlyCost += 20;
      breakdown.push({ item: 'Plugins Premium', cost: 20 });
    }
  }
  
  if (tech.ecommerce === 'WooCommerce') {
    monthlyCost += 10;
    breakdown.push({ item: 'WooCommerce Extensions', cost: 10 });
  }
  
  if (tech.analytics.includes('Hotjar')) {
    monthlyCost += 39;
    breakdown.push({ item: 'Hotjar Plus', cost: 39 });
  }
  
  const yearlyCost = monthlyCost * 12;
  const savings = [];
  
  if (tech.cdn[0] === 'Nenhum detectado') {
    savings.push({
      opportunity: 'Implementar Cloudflare Free',
      savings: 0,
      benefit: 'Performance +30%, Segurança +50%'
    });
  }
  
  if (tech.cms.name === 'Wix' || tech.cms.name === 'Shopify') {
    savings.push({
      opportunity: 'Migrar para WordPress + WooCommerce',
      savings: Math.round(monthlyCost * 0.4),
      benefit: 'Mais controle, sem taxas de transação'
    });
  }
  
  if (tech.plugins.length > 15) {
    savings.push({
      opportunity: 'Remover plugins não utilizados',
      savings: 10,
      benefit: 'Performance +20%, Segurança +30%'
    });
  }
  
  return {
    monthly: monthlyCost,
    yearly: yearlyCost,
    breakdown,
    savings,
    totalSavings: savings.reduce((acc, s) => acc + s.savings, 0),
    recommendation: monthlyCost > 100 ? 'Stack cara - revisar custos' :
                    monthlyCost > 50 ? 'Custo moderado' :
                    'Stack econômica'
  };
}
