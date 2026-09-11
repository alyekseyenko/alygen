// Q Score Avançado - Frontend Version
// Sincronizado com backend/services/q-score-advanced.js

export function calculateQScore(analysis) {
  if (!analysis) return { 
    score: 0, 
    grade: 'F', 
    category: 'Não Analisado',
    detailedScores: {},
    categoryScores: {}
  };

  // Usar Q Score Avançado do backend se disponível
  if (analysis.qScoreAdvanced) {
    const score = Number(analysis.qScoreAdvanced.score) || 0;
    return {
      score: isNaN(score) ? 0 : score,
      technicalScore: Number(analysis.qScoreAdvanced.technicalScore) || 0,
      grade: analysis.qScoreAdvanced.grade || 'F',
      category: analysis.qScoreAdvanced.category || 'Não Analisado',
      
      // Contexto
      sector: analysis.qScoreAdvanced.sector,
      sectorName: analysis.qScoreAdvanced.sectorName,
      region: analysis.qScoreAdvanced.region,
      
      // Detalhamento
      scores: analysis.qScoreAdvanced.scores || {},
      penalties: analysis.qScoreAdvanced.penalties || {},
      bonuses: analysis.qScoreAdvanced.bonuses || {},
      totalPenalty: Number(analysis.qScoreAdvanced.totalPenalty) || 0,
      totalBonus: Number(analysis.qScoreAdvanced.totalBonus) || 0,
      
      // Análises avançadas
      urgencies: analysis.qScoreAdvanced.urgencies || [],
      competitiveness: analysis.qScoreAdvanced.competitiveness || {},
      benchmarkComparison: analysis.qScoreAdvanced.benchmarkComparison || {},
      roi: analysis.qScoreAdvanced.roi || {},
      
      // Recomendação
      recommendation: analysis.qScoreAdvanced.recommendation || '',
      priority: analysis.qScoreAdvanced.priority || 'MÉDIA',
      
      // Benchmark
      benchmark: {
        message: analysis.qScoreAdvanced.benchmarkComparison?.region || 'Benchmark regional',
        percentile: calculatePercentile(score)
      },
      
      // Para compatibilidade com QScoreDetailed
      detailedScores: analysis.qScoreAdvanced.detailedScores || {},
      categoryScores: analysis.qScoreAdvanced.categoryScores || {}
    };
  }

  // Fallback: usar Q Score básico
  if (analysis.qScore) {
    const score = Number(analysis.qScore.technical || analysis.qScore.score) || 0;
    return {
      score: isNaN(score) ? 0 : score,
      grade: analysis.qScore.grade || 'F',
      category: analysis.qScore.maturity || 'Funcional',
      benchmark: {
        message: 'Análise básica',
        percentile: calculatePercentile(score)
      },
      detailedScores: {},
      categoryScores: {}
    };
  }

  // Fallback: calcular localmente (versão simplificada)
  const scores = {
    performance: Number(analysis.performanceMobile) || 0,
    seo: Number(analysis.seo?.score) || 0,
    security: Number(analysis.security?.score) || 0,
    accessibility: Number(analysis.accessibility?.score) || 0,
    tracking: (Number(analysis.pixelDetails?.totalTracking) || 0) * 14.28,
    conversion: Number(analysis.conversion?.score) || 0
  };

  const technicalScore = Math.round(
    scores.performance * 0.25 +
    scores.seo * 0.20 +
    scores.security * 0.15 +
    scores.accessibility * 0.10 +
    scores.tracking * 0.15 +
    scores.conversion * 0.15
  );

  const finalScore = isNaN(technicalScore) ? 0 : technicalScore;
  const grade = getGrade(finalScore);

  return {
    score: finalScore,
    grade: grade.letter,
    category: grade.maturity,
    scores,
    benchmark: {
      message: 'Análise simplificada',
      percentile: calculatePercentile(finalScore)
    },
    detailedScores: {},
    categoryScores: {}
  };
}

function getGrade(score) {
  if (score >= 90) return { letter: 'A+', maturity: 'Líder Digital' };
  if (score >= 80) return { letter: 'A', maturity: 'Excelente' };
  if (score >= 70) return { letter: 'B', maturity: 'Competitivo' };
  if (score >= 60) return { letter: 'C', maturity: 'Funcional' };
  if (score >= 50) return { letter: 'D', maturity: 'Precisa Atenção' };
  if (score >= 40) return { letter: 'E', maturity: 'Crítico' };
  return { letter: 'F', maturity: 'Emergência' };
}

function calculatePercentile(score) {
  // Baseado em benchmarks portugueses
  if (score >= 80) return 95;
  if (score >= 70) return 80;
  if (score >= 60) return 60;
  if (score >= 50) return 40;
  if (score >= 40) return 20;
  return 10;
}
