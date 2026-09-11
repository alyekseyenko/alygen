// Simulador de Preços - Mercado Português

export function calculateProjectPrice(analysis, qScore) {
  if (!analysis || !qScore) {
    return { 
      total: 0, 
      breakdown: [], 
      timeline: 0,
      totalHours: 0,
      hourlyRate: 25,
      marketComparison: { percentageSaved: 0, marketAverage: 0, savings: 0 }
    };
  }

  const breakdown = [];
  let totalHours = 0;
  let totalPrice = 0;

  const hourlyRate = 25; // €25/hora (taxa padrão)

  // 1. PERFORMANCE
  if (analysis.performanceMobile < 70) {
    const hours = calculatePerformanceHours(analysis);
    const price = hours * hourlyRate;
    totalHours += hours;
    totalPrice += price;
    
    breakdown.push({
      category: 'Performance',
      tasks: [
        'Otimização de imagens (WebP/AVIF)',
        'Minificação CSS/JS',
        'Lazy loading',
        'CDN setup (Cloudflare)',
        'Cache optimization',
        ...(analysis.multiPage && analysis.multiPage.otherPagesCount > 0 ? [
          `Otimizar ${analysis.multiPage.otherPagesCount} páginas adicionais`
        ] : [])
      ],
      hours,
      price,
      priority: 'ALTA'
    });
  }

  // 2. SEO
  if (analysis.seo?.score < 70) {
    const hours = calculateSEOHours(analysis);
    const price = hours * hourlyRate;
    totalHours += hours;
    totalPrice += price;
    
    breakdown.push({
      category: 'SEO',
      tasks: [
        'Meta tags optimization',
        'Schema markup',
        'Sitemap.xml',
        'Robots.txt',
        'Mobile SEO',
        'Internal linking'
      ],
      hours,
      price,
      priority: 'ALTA'
    });
  }

  // 3. SEGURANÇA
  if (analysis.security?.score < 70) {
    const hours = calculateSecurityHours(analysis);
    const price = hours * hourlyRate;
    totalHours += hours;
    totalPrice += price;
    
    breakdown.push({
      category: 'Segurança',
      tasks: [
        'SSL certificate',
        'Security headers',
        'GDPR compliance',
        'Cookie consent',
        'Firewall setup'
      ],
      hours,
      price,
      priority: 'CRÍTICA'
    });
  }

  // 4. ACESSIBILIDADE
  if (analysis.accessibility?.score < 60) {
    const hours = calculateAccessibilityHours(analysis);
    const price = hours * hourlyRate;
    totalHours += hours;
    totalPrice += price;
    
    breakdown.push({
      category: 'Acessibilidade',
      tasks: [
        'Alt text em imagens',
        'ARIA labels',
        'Contraste de cores',
        'Navegação por teclado',
        'Screen reader compatibility'
      ],
      hours,
      price,
      priority: 'MÉDIA'
    });
  }

  // 5. TRACKING
  if ((analysis.pixelDetails?.totalTracking || 0) < 2) {
    const hours = 4;
    const price = hours * hourlyRate;
    totalHours += hours;
    totalPrice += price;
    
    breakdown.push({
      category: 'Tracking & Analytics',
      tasks: [
        'Google Analytics 4',
        'Meta Pixel',
        'Google Tag Manager',
        'Conversions tracking',
        'Dashboard setup'
      ],
      hours,
      price,
      priority: 'ALTA'
    });
  }

  // 6. CONVERSÃO
  if (analysis.conversion?.score < 70) {
    const hours = calculateConversionHours(analysis);
    const price = hours * hourlyRate;
    totalHours += hours;
    totalPrice += price;
    
    breakdown.push({
      category: 'Otimização de Conversão',
      tasks: [
        'CTAs optimization',
        'Formulários simplificados',
        'WhatsApp integration',
        'Live chat setup',
        'Prova social'
      ],
      hours,
      price,
      priority: 'ALTA'
    });
  }

  // 7. CONTEÚDO
  if (analysis.contentAnalysis?.score < 60) {
    const hours = calculateContentHours(analysis);
    const price = hours * hourlyRate;
    totalHours += hours;
    totalPrice += price;
    
    breakdown.push({
      category: 'Conteúdo',
      tasks: [
        'Copywriting',
        'Estrutura AIDA/PAS',
        'Keywords optimization',
        'Prova social',
        'Call-to-actions'
      ],
      hours,
      price,
      priority: 'MÉDIA'
    });
  }

  // 8. REDES SOCIAIS
  if ((analysis.socialMedia?.totalPlatforms || 0) < 3) {
    const hours = 3;
    const price = hours * hourlyRate;
    totalHours += hours;
    totalPrice += price;
    
    breakdown.push({
      category: 'Redes Sociais',
      tasks: [
        'Links para Instagram/Facebook',
        'Social share buttons',
        'Open Graph tags',
        'Feed integration'
      ],
      hours,
      price,
      priority: 'BAIXA'
    });
  }

  // 9. TECNOLOGIAS
  if (analysis.technologies?.cms?.outdated) {
    const hours = 8;
    const price = hours * hourlyRate;
    totalHours += hours;
    totalPrice += price;
    
    breakdown.push({
      category: 'Atualização Tecnológica',
      tasks: [
        'Update CMS',
        'Update plugins',
        'Security patches',
        'Backup setup',
        'Testing'
      ],
      hours,
      price,
      priority: 'CRÍTICA'
    });
  }

  // Calcular descontos por volume
  const discount = calculateDiscount(totalPrice);
  const finalPrice = totalPrice - discount;

  // Timeline (semanas)
  const timeline = Math.ceil(totalHours / 20); // 20h/semana

  // Comparação com mercado
  const marketComparison = compareWithMarket(finalPrice, breakdown.length);

  return {
    total: Math.round(finalPrice),
    originalPrice: Math.round(totalPrice),
    discount,
    breakdown,
    totalHours,
    timeline,
    hourlyRate,
    marketComparison,
    paymentOptions: generatePaymentOptions(finalPrice),
    guarantee: '30 dias de garantia + 3 meses de suporte'
  };
}

function calculatePerformanceHours(analysis) {
  let hours = 8; // Base
  
  const opportunities = analysis.performance?.opportunities || [];
  hours += opportunities.length * 2;
  
  const perfMobile = Number(analysis.performanceMobile) || 0;
  if (perfMobile < 50) hours += 8;
  
  const resourceSize = Number(analysis.performance?.resources?.total?.size) || 0;
  if (resourceSize > 3000) hours += 4;
  
  // 🆕 Adicionar horas para outras páginas
  if (analysis.multiPage && analysis.multiPage.otherPagesCount > 0) {
    // +2h por página adicional (máximo +10h)
    const extraHours = Math.min(Number(analysis.multiPage.otherPagesCount) * 2, 10);
    hours += extraHours;
    
    // Se outras páginas estão muito piores, adicionar mais tempo
    const avgOther = Number(analysis.multiPage.avgOtherPerformance) || 0;
    if (avgOther < perfMobile - 20) {
      hours += 5;
    }
  }
  
  return Math.min(hours, 40);
}

function calculateSEOHours(analysis) {
  let hours = 6; // Base
  
  if (!analysis.seo?.hasSitemap) hours += 2;
  if (!analysis.seo?.hasSchema) hours += 3;
  
  const imagesWithoutAlt = Number(analysis.seo?.images?.withoutAlt) || 0;
  if (imagesWithoutAlt > 10) hours += 4;
  
  if (!analysis.seo?.mobileSEO?.hasViewport) hours += 2;
  
  return Math.min(hours, 20);
}

function calculateSecurityHours(analysis) {
  let hours = 4; // Base
  
  if (!analysis.security?.hasSSL) hours += 3;
  const headersCount = Object.values(analysis.security?.headers || {}).filter(Boolean).length;
  hours += (6 - headersCount) * 0.5;
  
  return Math.min(hours, 12);
}

function calculateAccessibilityHours(analysis) {
  let hours = 6; // Base
  
  const errors = Number(analysis.accessibility?.errors) || 0;
  hours += Math.min(errors * 0.2, 10);
  
  return Math.min(hours, 16);
}

function calculateConversionHours(analysis) {
  let hours = 8; // Base
  
  const totalCtas = Number(analysis.conversion?.ctas?.total) || 0;
  if (totalCtas === 0) hours += 4;
  
  if (!analysis.conversion?.contact?.whatsapp) hours += 2;
  if (!analysis.conversion?.socialProof?.hasSocialProof) hours += 3;
  
  return Math.min(hours, 18);
}

function calculateContentHours(analysis) {
  let hours = 8; // Base
  
  const wordCount = Number(analysis.contentAnalysis?.wordCount) || 0;
  if (wordCount < 300) hours += 6;
  
  if (!analysis.contentAnalysis?.salesStructure?.hasStructure) hours += 4;
  
  return Math.min(hours, 18);
}

function calculateDiscount(totalPrice) {
  if (totalPrice > 3000) return totalPrice * 0.15; // 15%
  if (totalPrice > 2000) return totalPrice * 0.10; // 10%
  if (totalPrice > 1000) return totalPrice * 0.05; // 5%
  return 0;
}

function compareWithMarket(price, itemsCount) {
  const marketAverage = itemsCount * 400; // €400 por categoria (média PT)
  const difference = marketAverage - price;
  const percentageSaved = marketAverage > 0 ? Math.round((difference / marketAverage) * 100) : 0;

  return {
    marketAverage: Math.round(marketAverage),
    yourPrice: Math.round(price),
    savings: Math.round(difference),
    percentageSaved: isNaN(percentageSaved) ? 0 : percentageSaved,
    message: difference > 0 
      ? `${percentageSaved}% abaixo da média portuguesa`
      : `Preço competitivo`
  };
}

function generatePaymentOptions(totalPrice) {
  return [
    {
      name: 'À Vista',
      discount: 10,
      total: Math.round(totalPrice * 0.9),
      description: '10% desconto'
    },
    {
      name: '2x sem juros',
      discount: 0,
      installment: Math.round(totalPrice / 2),
      total: Math.round(totalPrice),
      description: '2 parcelas'
    },
    {
      name: '3x sem juros',
      discount: 0,
      installment: Math.round(totalPrice / 3),
      total: Math.round(totalPrice),
      description: '3 parcelas'
    }
  ];
}
