// Q Score Calculator - Frontend Version
// Sincronizado com backend/services/q-score-calculator.js

const BENCHMARKS_PT = {
  performance: 45,
  seo: 60,
  security: 55,
  accessibility: 50,
  tracking: 2,
  conversion: 55
};

const WEIGHTS = {
  performance: 0.25,
  seo: 0.20,
  security: 0.15,
  accessibility: 0.10,
  tracking: 0.20,
  conversion: 0.10
};

export function calculateQScore(analysis) {
  if (!analysis) return { score: 0, grade: 'F', category: 'Não Analisado' };

  // Usar Q Score do backend se disponível
  if (analysis.qScore) {
    return {
      score: analysis.qScore.technical,
      grade: analysis.qScore.grade,
      category: analysis.qScore.maturity,
      opportunity: analysis.qScore.opportunity,
      market: analysis.qScore.market,
      potential: analysis.qScore.roiPotential?.potential,
      pitch: analysis.qScore.pitch
    };
  }

  // Fallback: calcular localmente
  const scores = {
    performance: analysis.performanceMobile || 0,
    seo: analysis.seo?.score || 0,
    security: analysis.security?.score || 0,
    accessibility: analysis.accessibility?.score || 0,
    tracking: (analysis.pixelDetails?.totalTracking || 0) * 14.28,
    conversion: analysis.conversion?.score || 0
  };

  const technicalScore = Math.round(
    scores.performance * WEIGHTS.performance +
    scores.seo * WEIGHTS.seo +
    scores.security * WEIGHTS.security +
    scores.accessibility * WEIGHTS.accessibility +
    scores.tracking * WEIGHTS.tracking +
    scores.conversion * WEIGHTS.conversion
  );

  const grade = getGrade(technicalScore);

  return {
    score: technicalScore,
    grade: grade.letter,
    category: grade.maturity
  };
}

function getGrade(score) {
  if (score >= 80) return { letter: 'A', maturity: 'Líder Digital' };
  if (score >= 65) return { letter: 'B', maturity: 'Competitivo' };
  if (score >= 50) return { letter: 'C', maturity: 'Funcional' };
  if (score >= 35) return { letter: 'D', maturity: 'Precisa Atenção' };
  return { letter: 'F', maturity: 'Emergência' };
}
