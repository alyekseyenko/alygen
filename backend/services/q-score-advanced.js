// 🎯 Q SCORE AVANÇADO - Sistema de Pontuação Inteligente
// Implementa: Pesos Dinâmicos, Benchmarks Regionais, Penalizações, Bônus, Urgência, Competitividade

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1️⃣ PESOS DINÂMICOS POR SETOR
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SECTOR_WEIGHTS = {
  'ecommerce': {
    performance: 0.30,  // Crítico para vendas
    conversion: 0.25,   // Crítico para conversão
    tracking: 0.20,     // Essencial para ROI
    seo: 0.15,
    security: 0.10
  },
  'b2b': {
    seo: 0.30,          // Geração de leads
    security: 0.25,     // Confiança empresarial
    tracking: 0.20,
    performance: 0.15,
    conversion: 0.10
  },
  'servicos': {
    conversion: 0.30,   // Agendamentos/contatos
    seo: 0.25,          // Visibilidade local
    performance: 0.20,
    tracking: 0.15,
    security: 0.10
  },
  'restaurante': {
    performance: 0.25,  // Mobile-first
    conversion: 0.30,   // Reservas/pedidos
    seo: 0.20,          // Google Maps
    tracking: 0.15,
    security: 0.10
  },
  'saude': {
    security: 0.30,     // RGPD/dados sensíveis
    conversion: 0.25,   // Agendamentos
    seo: 0.20,
    performance: 0.15,
    tracking: 0.10
  },
  'default': {
    performance: 0.25,
    seo: 0.20,
    security: 0.15,
    conversion: 0.15,
    tracking: 0.15,
    accessibility: 0.10
  }
};

// Detectar setor automaticamente
function detectSector(leadData, analysis) {
  const type = (leadData?.type || '').toLowerCase();
  const website = (leadData?.website || '').toLowerCase();
  const content = (analysis?.contentAnalysis?.text || '').toLowerCase();
  
  // E-commerce
  if (type.includes('loja') || type.includes('shop') || 
      website.includes('shop') || website.includes('store') ||
      analysis?.technologies?.ecommerce) {
    return 'ecommerce';
  }
  
  // Restaurante/Café
  if (type.includes('restaurante') || type.includes('café') || 
      type.includes('bar') || type.includes('pastelaria')) {
    return 'restaurante';
  }
  
  // Saúde
  if (type.includes('clínica') || type.includes('médico') || 
      type.includes('dentista') || type.includes('fisioterapia') ||
      type.includes('saúde')) {
    return 'saude';
  }
  
  // B2B (empresas, consultoria, agências)
  if (type.includes('consultoria') || type.includes('agência') ||
      type.includes('empresa') || type.includes('software') ||
      content.includes('b2b') || content.includes('empresas')) {
    return 'b2b';
  }
  
  // Serviços (default para serviços locais)
  if (type.includes('serviço') || type.includes('service')) {
    return 'servicos';
  }
  
  return 'default';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2️⃣ BENCHMARKS POR REGIÃO (Código Postal)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const REGIONAL_BENCHMARKS = {
  'lisboa': { // 1000-1990
    performance: 55,
    seo: 65,
    security: 60,
    conversion: 60,
    tracking: 3,
    description: 'Lisboa (Alta Competitividade)'
  },
  'porto': { // 4000-4990
    performance: 52,
    seo: 62,
    security: 58,
    conversion: 58,
    tracking: 3,
    description: 'Porto (Alta Competitividade)'
  },
  'braga': { // 4700-4850
    performance: 48,
    seo: 58,
    security: 55,
    conversion: 55,
    tracking: 2,
    description: 'Braga (Média Competitividade)'
  },
  'coimbra': { // 3000-3090
    performance: 48,
    seo: 58,
    security: 55,
    conversion: 55,
    tracking: 2,
    description: 'Coimbra (Média Competitividade)'
  },
  'algarve': { // 8000-8990
    performance: 50,
    seo: 60,
    security: 56,
    conversion: 58,
    tracking: 2,
    description: 'Algarve (Turismo - Alta Competitividade)'
  },
  'interior': { // Resto
    performance: 42,
    seo: 52,
    security: 50,
    conversion: 50,
    tracking: 1,
    description: 'Interior (Baixa Competitividade)'
  }
};

function detectRegion(address) {
  if (!address) return 'interior';
  
  const postalMatch = address.match(/(\d{4})/);
  if (!postalMatch) return 'interior';
  
  const postal = parseInt(postalMatch[1]);
  
  if (postal >= 1000 && postal <= 1990) return 'lisboa';
  if (postal >= 4000 && postal <= 4990) return 'porto';
  if (postal >= 4700 && postal <= 4850) return 'braga';
  if (postal >= 3000 && postal <= 3090) return 'coimbra';
  if (postal >= 8000 && postal <= 8990) return 'algarve';
  
  return 'interior';
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3️⃣ PENALIZAÇÕES CRÍTICAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function calculatePenalties(analysis) {
  const penalties = [];
  let totalPenalty = 0;
  
  // 🚨 CRÍTICO: Sem SSL
  if (!analysis.security?.hasSSL) {
    penalties.push({
      type: 'CRÍTICO',
      issue: 'Sem certificado SSL',
      penalty: -20,
      impact: 'Site marcado como inseguro pelos browsers'
    });
    totalPenalty += 20;
  }
  
  // 🚨 CRÍTICO: CMS desatualizado
  if (analysis.technologies?.cms?.outdated) {
    penalties.push({
      type: 'CRÍTICO',
      issue: 'CMS desatualizado',
      penalty: -15,
      impact: 'Vulnerabilidades de segurança conhecidas'
    });
    totalPenalty += 15;
  }
  
  // ⚠️ ALTO: Performance muito baixa
  if (analysis.performanceMobile < 30) {
    penalties.push({
      type: 'ALTO',
      issue: 'Performance crítica (<30)',
      penalty: -10,
      impact: 'Taxa de rejeição >70%'
    });
    totalPenalty += 10;
  }
  
  // ⚠️ ALTO: Sem tracking
  if ((analysis.pixelDetails?.totalTracking || 0) === 0) {
    penalties.push({
      type: 'ALTO',
      issue: 'Zero tracking instalado',
      penalty: -10,
      impact: 'Impossível medir ROI'
    });
    totalPenalty += 10;
  }
  
  // ⚠️ MÉDIO: Sem sitemap
  if (!analysis.seo?.hasSitemap) {
    penalties.push({
      type: 'MÉDIO',
      issue: 'Sem sitemap.xml',
      penalty: -5,
      impact: 'Indexação prejudicada'
    });
    totalPenalty += 5;
  }
  
  // ⚠️ MÉDIO: Acessibilidade muito baixa
  if (analysis.accessibility?.score < 40) {
    penalties.push({
      type: 'MÉDIO',
      issue: 'Acessibilidade crítica',
      penalty: -5,
      impact: 'Exclui 15% do mercado'
    });
    totalPenalty += 5;
  }
  
  return { penalties, totalPenalty };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4️⃣ BÔNUS POR EXCELÊNCIA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function calculateBonuses(analysis) {
  const bonuses = [];
  let totalBonus = 0;
  
  // 🏆 Performance excepcional
  if (analysis.performanceMobile >= 95) {
    bonuses.push({
      type: 'EXCELÊNCIA',
      achievement: 'Performance 95+',
      bonus: 5,
      benefit: 'Top 5% dos sites portugueses'
    });
    totalBonus += 5;
  }
  
  // 🏆 Todas as métricas acima de 80
  const allMetrics = [
    analysis.performanceMobile,
    analysis.seo?.score || 0,
    analysis.security?.score || 0,
    analysis.accessibility?.score || 0,
    analysis.conversion?.score || 0
  ];
  
  if (allMetrics.every(m => m >= 80)) {
    bonuses.push({
      type: 'EXCELÊNCIA',
      achievement: 'Todas métricas >80',
      bonus: 10,
      benefit: 'Site de classe mundial'
    });
    totalBonus += 10;
  }
  
  // 🏆 Tracking completo (5+ ferramentas)
  if ((analysis.pixelDetails?.totalTracking || 0) >= 5) {
    bonuses.push({
      type: 'AVANÇADO',
      achievement: 'Tracking completo (5+)',
      bonus: 3,
      benefit: 'Análise de dados profissional'
    });
    totalBonus += 3;
  }
  
  // 🏆 SEO perfeito
  if (analysis.seo?.score >= 95) {
    bonuses.push({
      type: 'EXCELÊNCIA',
      achievement: 'SEO 95+',
      bonus: 5,
      benefit: 'Otimização profissional'
    });
    totalBonus += 5;
  }
  
  // 🏆 Segurança máxima
  if (analysis.security?.score >= 95) {
    bonuses.push({
      type: 'EXCELÊNCIA',
      achievement: 'Segurança 95+',
      bonus: 5,
      benefit: 'Proteção enterprise-grade'
    });
    totalBonus += 5;
  }
  
  return { bonuses, totalBonus };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5️⃣ SCORE DE URGÊNCIA (Impacto × Esforço)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function calculateUrgency(analysis, sector) {
  const urgencies = [];
  
  // Performance
  if (analysis.performanceMobile < 70) {
    const gap = 70 - analysis.performanceMobile;
    const impact = sector === 'ecommerce' ? 10 : sector === 'restaurante' ? 9 : 7;
    const effort = gap > 40 ? 8 : gap > 20 ? 5 : 3;
    const cost = effort * 25; // €25/hora
    const time = Math.ceil(effort / 4); // semanas
    
    urgencies.push({
      category: 'Performance',
      gap,
      impact,
      effort,
      cost,
      time,
      urgencyScore: Math.round((gap * impact) / (effort * 0.5)),
      priority: gap > 30 ? 'CRÍTICA' : gap > 15 ? 'ALTA' : 'MÉDIA'
    });
  }
  
  // SEO
  if ((analysis.seo?.score || 0) < 70) {
    const gap = 70 - (analysis.seo?.score || 0);
    const impact = sector === 'b2b' ? 10 : sector === 'servicos' ? 9 : 7;
    const effort = gap > 40 ? 6 : gap > 20 ? 4 : 2;
    const cost = effort * 25;
    const time = Math.ceil(effort / 4);
    
    urgencies.push({
      category: 'SEO',
      gap,
      impact,
      effort,
      cost,
      time,
      urgencyScore: Math.round((gap * impact) / (effort * 0.5)),
      priority: gap > 30 ? 'CRÍTICA' : gap > 15 ? 'ALTA' : 'MÉDIA'
    });
  }
  
  // Security
  if ((analysis.security?.score || 0) < 70) {
    const gap = 70 - (analysis.security?.score || 0);
    const impact = sector === 'saude' ? 10 : sector === 'b2b' ? 9 : 8;
    const effort = !analysis.security?.hasSSL ? 2 : gap > 30 ? 5 : 3;
    const cost = effort * 25;
    const time = Math.ceil(effort / 4);
    
    urgencies.push({
      category: 'Segurança',
      gap,
      impact,
      effort,
      cost,
      time,
      urgencyScore: Math.round((gap * impact) / (effort * 0.5)),
      priority: !analysis.security?.hasSSL ? 'CRÍTICA' : gap > 30 ? 'ALTA' : 'MÉDIA'
    });
  }
  
  // Conversion
  if ((analysis.conversion?.score || 0) < 70) {
    const gap = 70 - (analysis.conversion?.score || 0);
    const impact = sector === 'servicos' ? 10 : sector === 'restaurante' ? 9 : 7;
    const effort = gap > 40 ? 8 : gap > 20 ? 5 : 3;
    const cost = effort * 25;
    const time = Math.ceil(effort / 4);
    
    urgencies.push({
      category: 'Conversão',
      gap,
      impact,
      effort,
      cost,
      time,
      urgencyScore: Math.round((gap * impact) / (effort * 0.5)),
      priority: gap > 30 ? 'ALTA' : gap > 15 ? 'MÉDIA' : 'BAIXA'
    });
  }
  
  // Ordenar por urgência
  urgencies.sort((a, b) => b.urgencyScore - a.urgencyScore);
  
  return urgencies;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6️⃣ SCORE DE COMPETITIVIDADE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function calculateCompetitiveness(analysis, leadData, allLeads) {
  if (!allLeads || allLeads.length === 0) {
    return { position: 'N/A', message: 'Sem dados de concorrentes' };
  }
  
  // Filtrar concorrentes (mesmo tipo e região)
  const competitors = allLeads.filter(lead => 
    lead.id !== leadData?.id &&
    lead.type === leadData?.type &&
    lead.analysis &&
    isSameRegion(lead.address, leadData?.address)
  );
  
  if (competitors.length === 0) {
    return { 
      position: 'Único',
      message: 'Sem concorrentes diretos analisados na região',
      competitors: []
    };
  }
  
  // Calcular scores
  const myScore = analysis.qScore?.score || 0;
  const competitorScores = competitors.map(c => ({
    name: c.name,
    score: c.analysis.qScore?.score || 0,
    website: c.website
  }));
  
  const avgScore = Math.round(
    competitorScores.reduce((sum, c) => sum + c.score, 0) / competitorScores.length
  );
  
  const leader = competitorScores.reduce((max, c) => c.score > max.score ? c : max, competitorScores[0]);
  
  const position = competitorScores.filter(c => c.score > myScore).length + 1;
  const total = competitorScores.length + 1;
  
  let message = '';
  if (position === 1) {
    message = `🏆 Líder do mercado! ${myScore - avgScore} pontos acima da média`;
  } else if (position <= Math.ceil(total * 0.3)) {
    message = `🥈 Top ${Math.round((position/total)*100)}% - Acima da média (+${myScore - avgScore})`;
  } else if (myScore >= avgScore) {
    message = `✅ Acima da média (+${myScore - avgScore} pontos)`;
  } else {
    message = `⚠️ Abaixo da média (${avgScore - myScore} pontos de diferença)`;
  }
  
  return {
    position,
    total,
    myScore,
    avgScore,
    leader: leader.name,
    leaderScore: leader.score,
    gap: leader.score - myScore,
    message,
    competitors: competitorScores.slice(0, 5)
  };
}

function isSameRegion(addr1, addr2) {
  if (!addr1 || !addr2) return false;
  
  const postal1 = addr1.match(/(\d{4})/)?.[1];
  const postal2 = addr2.match(/(\d{4})/)?.[1];
  
  if (!postal1 || !postal2) return false;
  
  // Mesma região (primeiros 2 dígitos)
  return postal1.substring(0, 2) === postal2.substring(0, 2);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7️⃣ CÁLCULO PRINCIPAL DO Q SCORE AVANÇADO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function calculateAdvancedQScore(analysis, leadData, allLeads = []) {
  // 1. Detectar setor e região
  const sector = detectSector(leadData, analysis);
  const region = detectRegion(leadData?.address);
  const weights = SECTOR_WEIGHTS[sector];
  const benchmark = REGIONAL_BENCHMARKS[region];
  
  // 2. Calcular scores normalizados
  const scores = {
    performance: analysis.performanceMobile || 0,
    seo: analysis.seo?.score || 0,
    security: analysis.security?.score || 0,
    accessibility: analysis.accessibility?.score || 0,
    tracking: Math.min((analysis.pixelDetails?.totalTracking || 0) * 14.28, 100),
    conversion: analysis.conversion?.score || 0
  };
  
  // 3. Score técnico base (com pesos dinâmicos)
  let technicalScore = 0;
  Object.keys(weights).forEach(key => {
    if (scores[key] !== undefined) {
      technicalScore += scores[key] * weights[key];
    }
  });
  
  technicalScore = Math.round(technicalScore);
  
  // 4. Aplicar penalizações
  const { penalties, totalPenalty } = calculatePenalties(analysis);
  
  // 5. Aplicar bônus
  const { bonuses, totalBonus } = calculateBonuses(analysis);
  
  // 6. Score final
  let finalScore = Math.max(0, Math.min(100, technicalScore - totalPenalty + totalBonus));
  
  // 7. Grade e categoria
  const grade = getGrade(finalScore);
  
  // 8. Calcular urgências
  const urgencies = calculateUrgency(analysis, sector);
  
  // 9. Competitividade
  const competitiveness = calculateCompetitiveness(analysis, leadData, allLeads);
  
  // 10. Benchmark comparison
  const benchmarkComparison = {
    region: benchmark.description,
    performance: {
      yours: scores.performance,
      benchmark: benchmark.performance,
      diff: scores.performance - benchmark.performance
    },
    seo: {
      yours: scores.seo,
      benchmark: benchmark.seo,
      diff: scores.seo - benchmark.seo
    },
    security: {
      yours: scores.security,
      benchmark: benchmark.security,
      diff: scores.security - benchmark.security
    }
  };
  
  // 11. ROI Potencial
  const roi = calculateROI(finalScore, urgencies, sector);
  
  return {
    // Scores
    score: finalScore,
    technicalScore,
    grade: grade.letter,
    category: grade.maturity,
    
    // Contexto
    sector,
    sectorName: getSectorName(sector),
    region: benchmark.description,
    weights,
    
    // Detalhamento
    scores,
    penalties,
    bonuses,
    totalPenalty,
    totalBonus,
    
    // Análises avançadas
    urgencies,
    competitiveness,
    benchmarkComparison,
    roi,
    
    // Recomendação
    recommendation: generateRecommendation(finalScore, urgencies, competitiveness),
    priority: calculatePriority(finalScore, penalties, urgencies)
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FUNÇÕES AUXILIARES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function getGrade(score) {
  if (score >= 90) return { letter: 'A+', maturity: 'Líder Digital' };
  if (score >= 80) return { letter: 'A', maturity: 'Excelente' };
  if (score >= 70) return { letter: 'B', maturity: 'Competitivo' };
  if (score >= 60) return { letter: 'C', maturity: 'Funcional' };
  if (score >= 50) return { letter: 'D', maturity: 'Precisa Atenção' };
  if (score >= 40) return { letter: 'E', maturity: 'Crítico' };
  return { letter: 'F', maturity: 'Emergência' };
}

function getSectorName(sector) {
  const names = {
    'ecommerce': 'E-commerce',
    'b2b': 'B2B / Empresarial',
    'servicos': 'Serviços Locais',
    'restaurante': 'Restauração',
    'saude': 'Saúde',
    'default': 'Geral'
  };
  return names[sector] || 'Geral';
}

function calculateROI(score, urgencies, sector) {
  // Estimativa conservadora de ROI
  const totalInvestment = urgencies.reduce((sum, u) => sum + u.cost, 0);
  
  // ROI varia por setor
  const roiMultipliers = {
    'ecommerce': 5,      // €1 investido = €5 retorno
    'servicos': 4,
    'restaurante': 3.5,
    'b2b': 4.5,
    'saude': 4,
    'default': 3
  };
  
  const multiplier = roiMultipliers[sector] || 3;
  const monthlyROI = Math.round((totalInvestment * multiplier) / 12);
  const yearlyROI = monthlyROI * 12;
  const paybackMonths = Math.ceil(totalInvestment / monthlyROI);
  
  return {
    investment: totalInvestment,
    monthly: monthlyROI,
    yearly: yearlyROI,
    payback: paybackMonths,
    multiplier: `${multiplier}x`
  };
}

function generateRecommendation(score, urgencies, competitiveness) {
  if (score >= 80) {
    return `Excelente! Site no top ${Math.round((competitiveness.position / competitiveness.total) * 100)}% do mercado. Foco em manter vantagem competitiva.`;
  }
  
  if (score >= 60) {
    const topUrgency = urgencies[0];
    return `Bom site, mas há oportunidades. Priorize: ${topUrgency?.category} (ROI: €${topUrgency?.cost * 3}/ano).`;
  }
  
  if (score >= 40) {
    return `Atenção necessária! ${urgencies.filter(u => u.priority === 'CRÍTICA').length} problemas críticos. Investimento estimado: €${urgencies.reduce((s, u) => s + u.cost, 0)}.`;
  }
  
  return `🚨 URGENTE! Site prejudica negócio. Ação imediata necessária.`;
}

function calculatePriority(score, penalties, urgencies) {
  const criticalPenalties = penalties.filter(p => p.type === 'CRÍTICO').length;
  const criticalUrgencies = urgencies.filter(u => u.priority === 'CRÍTICA').length;
  
  if (criticalPenalties > 0 || criticalUrgencies > 0 || score < 40) {
    return 'CRÍTICA';
  }
  
  if (score < 60 || urgencies.filter(u => u.priority === 'ALTA').length > 0) {
    return 'ALTA';
  }
  
  if (score < 75) {
    return 'MÉDIA';
  }
  
  return 'BAIXA';
}
