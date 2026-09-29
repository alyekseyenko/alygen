// Q-Score UI helper — server `analysis.qScore` is authoritative; local calc matches backend core.
import { calculateQScoreFromAnalysis } from './qscore-core.js';

const EMPTY = {
  score: 0,
  grade: 'F',
  category: 'Não Analisado',
  detailedScores: {},
  categoryScores: {},
};

export function calculateQScore(analysis, leadMeta = {}) {
  if (!analysis) return { ...EMPTY };

  if (analysis.qScoreAdvanced) {
    const score = Number(analysis.qScoreAdvanced.score) || 0;
    return {
      score: Number.isNaN(score) ? 0 : score,
      technicalScore: Number(analysis.qScoreAdvanced.technicalScore) || 0,
      grade: analysis.qScoreAdvanced.grade || 'F',
      category: analysis.qScoreAdvanced.category || 'Não Analisado',
      sector: analysis.qScoreAdvanced.sector,
      sectorName: analysis.qScoreAdvanced.sectorName,
      region: analysis.qScoreAdvanced.region,
      scores: analysis.qScoreAdvanced.scores || {},
      penalties: analysis.qScoreAdvanced.penalties || {},
      bonuses: analysis.qScoreAdvanced.bonuses || {},
      totalPenalty: Number(analysis.qScoreAdvanced.totalPenalty) || 0,
      totalBonus: Number(analysis.qScoreAdvanced.totalBonus) || 0,
      urgencies: analysis.qScoreAdvanced.urgencies || [],
      competitiveness: analysis.qScoreAdvanced.competitiveness || {},
      benchmarkComparison: analysis.qScoreAdvanced.benchmarkComparison || {},
      roi: analysis.qScoreAdvanced.roi || {},
      recommendation: analysis.qScoreAdvanced.recommendation || '',
      priority: analysis.qScoreAdvanced.priority || 'MÉDIA',
      benchmark: {
        message: analysis.qScoreAdvanced.benchmarkComparison?.region || 'Benchmark regional',
        percentile: calculatePercentile(score),
      },
      detailedScores: analysis.qScoreAdvanced.detailedScores || {},
      categoryScores: analysis.qScoreAdvanced.categoryScores || {},
    };
  }

  if (analysis.qScore && (analysis.qScore.score != null || analysis.qScore.grade)) {
    const score = Number(analysis.qScore.score ?? analysis.qScore.technical) || 0;
    return {
      score: Number.isNaN(score) ? 0 : score,
      grade: analysis.qScore.grade || 'F',
      category: analysis.qScore.maturity || analysis.qScore.status || 'Funcional',
      priority: analysis.qScore.priority,
      benchmark: {
        message: 'Pontuação da auditoria (servidor)',
        percentile: calculatePercentile(score),
      },
      detailedScores: analysis.qScore.breakdown || {},
      categoryScores: {},
    };
  }

  const core = calculateQScoreFromAnalysis(analysis, leadMeta);
  const confidence = analysis.dataQuality
    ? Math.round(
        Object.values(analysis.dataQuality).filter((v) => v === 'measured').length /
          Math.max(1, Object.keys(analysis.dataQuality).length) *
          100
      )
    : core.confidence;
  return {
    ...core,
    confidence: core.confidence ?? confidence,
    category: core.status,
    benchmark: {
      message: 'Cálculo alinhado ao motor Alygen',
      percentile: calculatePercentile(core.score),
    },
    detailedScores: core.breakdown || {},
    categoryScores: {},
  };
}

function calculatePercentile(score) {
  if (score >= 80) return 95;
  if (score >= 70) return 80;
  if (score >= 60) return 60;
  if (score >= 50) return 40;
  if (score >= 40) return 20;
  return 10;
}
