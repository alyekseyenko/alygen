/**
 * Pure business logic for QScore calculation.
 * Encapsulates the formula for ranking leads.
 */
export function calculateQScore(data, leadData = {}) {
  const { 
    performanceScore, 
    seoScore, 
    securityScore, 
    accessibilityScore, 
    trackingCount,
    googleRanking,
    aeoScore = 0
  } = data;

  // Weights (Senior/Product config)
  const weights = {
    performance: 0.20, // Reduced from 0.25
    seo: 0.15,         // Reduced from 0.20
    security: 0.10,    // Reduced from 0.15
    accessibility: 0.10,
    tracking: 0.15,    // Reduced from 0.20
    marketPresence: 0.10,
    aeo: 0.20          // High priority for 2026
  };

  const calculated = (
    (performanceScore * weights.performance) +
    (seoScore * weights.seo) +
    (securityScore * weights.security) +
    (accessibilityScore * weights.accessibility) +
    (Math.min(100, trackingCount * 25) * weights.tracking) +
    ((googleRanking?.rankingScale || 0) * weights.marketPresence) +
    (aeoScore * weights.aeo)
  );

  const finalScore = Math.round(calculated);

  let grade = 'F';
  if (finalScore >= 90) grade = 'A+';
  else if (finalScore >= 80) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else if (finalScore >= 50) grade = 'D';
  else grade = 'E';

  let status = 'CRÍTICO';
  if (finalScore > 80) status = 'OTIMIZADO';
  else if (finalScore > 60) status = 'ESTÁVEL';
  else if (finalScore > 40) status = 'MELHORÁVEL';

  return {
    score: finalScore,
    grade,
    status,
    category: getIndustryCategory(leadData.type),
    lastCalculation: new Date().toISOString()
  };
}

function getIndustryCategory(type) {
  const categories = {
    'real_estate_agency': 'Imobiliário',
    'restaurant': 'Restauração',
    'clinic': 'Saúde',
    'lawyer': 'Jurídico',
    'doctor': 'Saúde',
    'default': 'Negócio Local'
  };
  return categories[type] || categories['default'];
}
