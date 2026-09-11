// 🎯 Q Score Híbrido - Sistema Inteligente de Pontuação

// Benchmarks reais do mercado português (baseado em estudos 2024)
const BENCHMARKS_PT = {
  performance: 45,
  seo: 60,
  security: 55,
  accessibility: 50,
  tracking: 2, // número de ferramentas
  conversion: 55
};

// Pesos ajustados (o que realmente impacta negócio)
const WEIGHTS = {
  performance: 0.20,  // 20% - Crítico para conversão
  seo: 0.18,          // 18% - Tráfego orgânico
  security: 0.12,     // 12% - Confiança
  accessibility: 0.08, // 8% - Inclusão
  tracking: 0.15,     // 15% - Medição de ROI
  conversion: 0.12,   // 12% - CTAs e conversão
  googleRanking: 0.15 // 15% - Visibilidade no Google
};

export function calculateQScore(analysis) {
  // 1. Extrair scores
  const scores = {
    performance: analysis.performanceMobile || 0,
    seo: analysis.seo?.score || 0,
    security: analysis.security?.score || 0,
    accessibility: analysis.accessibility?.score || 0,
    tracking: (analysis.pixelDetails?.totalTracking || 0) * 14.28, // 0-7 → 0-100
    conversion: analysis.conversion?.score || 0,
    googleRanking: calculateGoogleRankingScore(analysis.googleRanking) // 🆕 Melhorado
  };
  
  // 🆕 PENALIZAÇÕES baseadas em Lighthouse Audits
  let penalties = 0;
  const audits = analysis.lighthouseAudits || {};
  
  // Penalizar erros JavaScript no console
  if (audits.jsErrors === 0) penalties += 5;
  
  // Penalizar bibliotecas vulneráveis
  if (audits.noVulnerableLibraries === 0) penalties += 10;
  
  // Penalizar sites muito pesados (>5MB)
  if (audits.totalByteWeight > 5000000) penalties += 5;
  
  // Penalizar DOM muito grande (>1500 nodes)
  if (audits.domSize > 1500) penalties += 3;
  
  // Penalizar muitos third-party scripts
  if (audits.thirdPartySize > 1000000) penalties += 5;
  
  // 🆕 BÔNUS baseados em Lighthouse Audits
  let bonuses = 0;
  
  // Bonificar structured data (SEO avançado)
  if (audits.structuredData === 1) bonuses += 5;
  
  // Bonificar HTTPS
  if (audits.httpsUsage === 1) bonuses += 3;
  
  // Bonificar viewport otimizado
  if (audits.viewport === 1) bonuses += 2;
  
  // Bonificar tap targets adequados (mobile)
  if (audits.tapTargets === 1) bonuses += 3;
  
  // Bonificar sem deprecated APIs
  if (audits.deprecatedAPIs === 1) bonuses += 2;

  // 2. Score Técnico (ponderado) + Penalizações/Bônus
  const technicalScore = Math.round(
    scores.performance * WEIGHTS.performance +
    scores.seo * WEIGHTS.seo +
    scores.security * WEIGHTS.security +
    scores.accessibility * WEIGHTS.accessibility +
    scores.tracking * WEIGHTS.tracking +
    scores.conversion * WEIGHTS.conversion +
    scores.googleRanking * WEIGHTS.googleRanking // 🆕 Novo
  );
  
  // Aplicar penalizações e bônus
  const finalScore = Math.max(0, Math.min(100, technicalScore - penalties + bonuses));

  // 3. Score vs Benchmark (performance relativa)
  const benchmarkComparison = {
    performance: Math.round((scores.performance / BENCHMARKS_PT.performance) * 100),
    seo: Math.round((scores.seo / BENCHMARKS_PT.seo) * 100),
    security: Math.round((scores.security / BENCHMARKS_PT.security) * 100),
    accessibility: Math.round((scores.accessibility / BENCHMARKS_PT.accessibility) * 100),
    tracking: Math.round(((analysis.pixelDetails?.totalTracking || 0) / BENCHMARKS_PT.tracking) * 100),
    conversion: Math.round((scores.conversion / BENCHMARKS_PT.conversion) * 100),
    googleRanking: Math.round((scores.googleRanking / 50) * 100) // 🆕 Benchmark: 50 = média
  };

  const marketPosition = Math.round(
    Object.values(benchmarkComparison).reduce((a, b) => a + b, 0) / 7 // 🆕 Agora são 7 métricas
  );

  // 4. Score de Oportunidade (quanto pode melhorar × impacto) + Lighthouse Savings
  const gaps = {
    performance: Math.max(0, 90 - scores.performance),
    seo: Math.max(0, 85 - scores.seo),
    security: Math.max(0, 85 - scores.security),
    accessibility: Math.max(0, 80 - scores.accessibility),
    tracking: Math.max(0, 100 - scores.tracking),
    conversion: Math.max(0, 85 - scores.conversion),
    googleRanking: Math.max(0, 90 - scores.googleRanking) // 🆕 Novo
  };
  
  // 🆕 Adicionar oportunidades do Lighthouse (economia de KB)
  const lighthouseSavings = analysis.totalSavingsKB || 0;
  const lighthouseOpportunity = Math.min(30, Math.round(lighthouseSavings / 100)); // 100KB = 1 ponto, máx 30

  const opportunityScore = Math.round(
    gaps.performance * WEIGHTS.performance +
    gaps.seo * WEIGHTS.seo +
    gaps.security * WEIGHTS.security +
    gaps.accessibility * WEIGHTS.accessibility +
    gaps.tracking * WEIGHTS.tracking +
    gaps.conversion * WEIGHTS.conversion +
    gaps.googleRanking * WEIGHTS.googleRanking + // 🆕 Novo
    lighthouseOpportunity // 🆕 Oportunidades do Lighthouse
  );

  // 5. Grade (escala realista)
  const grade = calculateGrade(technicalScore);

  // 6. Potencial de ROI
  const roiPotential = calculateROIPotential(opportunityScore, gaps, scores);

  // 7. Top 3 Oportunidades (ordenadas por impacto × gap)
  const opportunities = calculateTopOpportunities(gaps, scores, WEIGHTS);

  // 8. Pitch Personalizado
  const pitch = generatePitch(technicalScore, opportunityScore, marketPosition, opportunities);

  return {
    // Scores principais
    technical: finalScore, // Usar finalScore com penalizações/bônus
    score: finalScore,     // Alias para facilidade de uso em automações
    opportunity: opportunityScore,
    market: marketPosition,
    
    // Grade e classificação
    grade: grade.letter,
    gradeLabel: grade.label,
    maturity: grade.maturity,
    
    // Detalhes
    scores,
    benchmarkComparison,
    gaps,
    penalties, // 🆕 Novo
    bonuses, // 🆕 Novo
    lighthouseSavings, // 🆕 Novo: KB que podem ser economizados
    
    // Oportunidades
    topOpportunities: opportunities,
    roiPotential,
    
    // Pitch de venda
    pitch,
    
    // Metadata
    calculatedAt: new Date().toISOString()
  };
}

function calculateGrade(score) {
  if (score >= 80) return { letter: 'A', label: 'Excelente', maturity: 'Líder Digital' };
  if (score >= 65) return { letter: 'B', label: 'Bom', maturity: 'Competitivo' };
  if (score >= 50) return { letter: 'C', label: 'Básico', maturity: 'Funcional' };
  if (score >= 35) return { letter: 'D', label: 'Defasado', maturity: 'Precisa Atenção' };
  return { letter: 'F', label: 'Crítico', maturity: 'Emergência' };
}

function calculateROIPotential(opportunityScore, gaps, scores) {
  // Calcular impacto financeiro estimado
  let monthlyImpact = 0;
  
  // Performance: cada 10 pontos = +5% conversão
  if (gaps.performance > 20) {
    monthlyImpact += Math.round((gaps.performance / 10) * 5 * 50); // €50 por % de conversão
  }
  
  // SEO: cada 10 pontos = +10% tráfego orgânico
  if (gaps.seo > 15) {
    monthlyImpact += Math.round((gaps.seo / 10) * 10 * 30); // €30 por % de tráfego
  }
  
  // Tracking: sem dados = perda de 30% do budget
  if (scores.tracking < 30) {
    monthlyImpact += 500; // €500/mês em budget desperdiçado
  }
  
  return {
    score: opportunityScore,
    potential: opportunityScore > 60 ? 'ALTO' : opportunityScore > 35 ? 'MÉDIO' : 'BAIXO',
    estimatedMonthlyGain: monthlyImpact,
    estimatedYearlyGain: monthlyImpact * 12,
    paybackMonths: monthlyImpact > 0 ? Math.ceil(2000 / monthlyImpact) : 0 // Assumindo €2000 de investimento
  };
}

function calculateTopOpportunities(gaps, scores, weights) {
  const opportunities = [
    {
      area: 'Performance',
      gap: gaps.performance,
      impact: weights.performance,
      score: gaps.performance * weights.performance,
      action: 'Otimizar velocidade de carregamento',
      benefit: 'Reduzir bounce rate e aumentar conversões'
    },
    {
      area: 'SEO',
      gap: gaps.seo,
      impact: weights.seo,
      score: gaps.seo * weights.seo,
      action: 'Melhorar otimização para motores de busca',
      benefit: 'Aumentar tráfego orgânico qualificado'
    },
    {
      area: 'Google Ranking',
      gap: gaps.googleRanking,
      impact: weights.googleRanking,
      score: gaps.googleRanking * weights.googleRanking,
      action: 'Melhorar posição no Google',
      benefit: 'Aumentar visibilidade e tráfego local'
    },
    {
      area: 'Tracking',
      gap: gaps.tracking,
      impact: weights.tracking,
      score: gaps.tracking * weights.tracking,
      action: 'Implementar ferramentas de análise',
      benefit: 'Medir ROI e otimizar campanhas'
    },
    {
      area: 'Security',
      gap: gaps.security,
      impact: weights.security,
      score: gaps.security * weights.security,
      action: 'Reforçar segurança e conformidade',
      benefit: 'Aumentar confiança e evitar multas RGPD'
    },
    {
      area: 'Conversion',
      gap: gaps.conversion,
      impact: weights.conversion,
      score: gaps.conversion * weights.conversion,
      action: 'Otimizar CTAs e jornada do utilizador',
      benefit: 'Converter mais visitantes em clientes'
    },
    {
      area: 'Accessibility',
      gap: gaps.accessibility,
      impact: weights.accessibility,
      score: gaps.accessibility * weights.accessibility,
      action: 'Melhorar acessibilidade',
      benefit: 'Alcançar 15% mais mercado e conformidade legal'
    }
  ];

  return opportunities
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((opp, index) => ({
      rank: index + 1,
      area: opp.area,
      priority: index === 0 ? 'CRÍTICA' : index === 1 ? 'ALTA' : 'MÉDIA',
      action: opp.action,
      benefit: opp.benefit,
      impactScore: Math.round(opp.score)
    }));
}

function generatePitch(technical, opportunity, market, opportunities) {
  const grade = calculateGrade(technical);
  const topIssue = opportunities[0];
  
  let pitch = '';
  
  // Contexto de mercado
  if (market < 80) {
    pitch += `O vosso site está ${market < 100 ? 'abaixo' : 'acima'} da média do mercado português (${market}%). `;
  } else {
    pitch += `O vosso site está acima da média do mercado (${market}%). `;
  }
  
  // Situação atual
  pitch += `Atualmente tem uma classificação ${grade.label} (${grade.letter}), `;
  
  // Oportunidade
  if (opportunity > 60) {
    pitch += `mas identificámos ${opportunity} pontos de potencial de melhoria. `;
  } else if (opportunity > 35) {
    pitch += `com ${opportunity} pontos de oportunidade de otimização. `;
  } else {
    pitch += `e está bem otimizado. `;
  }
  
  // Ação prioritária
  if (topIssue) {
    pitch += `A prioridade crítica é ${topIssue.action.toLowerCase()} para ${topIssue.benefit.toLowerCase()}.`;
  }
  
  return pitch;
}

// 🆕 Calcular score de Google Ranking com penalizações
function calculateGoogleRankingScore(googleRanking) {
  if (!googleRanking || !googleRanking.stats) {
    return 0; // Sem dados = 0 pontos
  }
  
  const { bestPosition, foundKeywords, totalKeywords } = googleRanking.stats;
  
  // Se não encontrou em nenhuma keyword
  if (foundKeywords === 0 || !bestPosition) {
    return 0; // 🚨 PENALIZAÇÃO MÁXIMA: Não aparece no TOP 10
  }
  
  // Score baseado na posição
  let positionScore = 0;
  if (bestPosition === 1) positionScore = 100;
  else if (bestPosition === 2) positionScore = 90;
  else if (bestPosition === 3) positionScore = 80;
  else if (bestPosition <= 5) positionScore = 70;
  else if (bestPosition <= 7) positionScore = 60;
  else if (bestPosition <= 10) positionScore = 50;
  else positionScore = 20; // Fora do TOP 10
  
  // Ajustar pelo número de keywords encontradas
  const visibilityMultiplier = foundKeywords / totalKeywords;
  
  return Math.round(positionScore * visibilityMultiplier);
}

// Função simplificada para Google Sheets
export function calculateQScoreSimple(analysis) {
  const qScore = calculateQScore(analysis);
  return {
    score: qScore.technical,
    grade: qScore.grade,
    opportunity: qScore.opportunity,
    potential: qScore.roiPotential.potential
  };
}
