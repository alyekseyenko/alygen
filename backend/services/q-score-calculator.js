/**
 * @deprecated Import from ./analyzers/qscore-calculator.js — thin compatibility layer.
 */
import { calculateQScoreFromAnalysis } from './analyzers/qscore-calculator.js';

export { calculateQScoreFromAnalysis, analysisToScoringPayload } from './analyzers/qscore-calculator.js';

export function calculateQScore(analysis) {
  const result = calculateQScoreFromAnalysis(analysis, analysis);
  return {
    ...result,
    technical: result.score,
    opportunity: Math.max(0, 100 - result.score),
    benchmarkComparison: { region: result.sector || 'default' },
    topOpportunities: [],
    roiPotential: { potential: result.score < 50 ? 'high' : 'medium' },
  };
}

export function calculateQScoreSimple(analysis) {
  const q = calculateQScore(analysis);
  return {
    score: q.score,
    grade: q.grade,
    opportunity: q.opportunity,
    potential: q.roiPotential.potential,
  };
}

export default { calculateQScore, calculateQScoreSimple, calculateQScoreFromAnalysis };
