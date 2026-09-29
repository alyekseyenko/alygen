import { describe, it, expect } from 'vitest';
import { calculateQScore } from '../services/q-score-calculator.js';
import { calculateQScoreFromAnalysis } from '../services/analyzers/qscore-calculator.js';

describe('Q-Score Calculation Engine', () => {
  it('deve calcular pontuação alta para métricas fortes', () => {
    const highPerfLead = {
      performanceMobile: 90,
      seo: { score: 95 },
      security: { score: 90, hasSSL: true },
      pixelDetails: { totalTracking: 4 },
      conversion: { score: 85 },
      hasCTA: true,
      googleRanking: { score: 80 },
    };

    const result = calculateQScore(highPerfLead);

    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(['A', 'A+', 'B']).toContain(result.grade);
    expect(result.benchmarkComparison).toBeDefined();
  });

  it('deve atribuir nota baixa para métricas zeradas', () => {
    const zeroLead = {
      performanceMobile: 0,
      seo: { score: 0 },
      security: { score: 0, hasSSL: false },
      pixelDetails: { totalTracking: 0 },
      conversion: { score: 0 },
    };

    const result = calculateQScoreFromAnalysis(zeroLead);

    expect(result.score).toBeLessThanOrEqual(30);
    expect(result.grade).toBe('F');
  });

  it('deve penalizar ausência de SSL', () => {
    const base = {
      performanceMobile: 70,
      seo: { score: 70 },
      security: { score: 70, hasSSL: true },
      pixelDetails: { totalTracking: 2 },
      hasCTA: true,
    };
    const noSsl = {
      ...base,
      security: { score: 70, hasSSL: false },
    };

    const clean = calculateQScoreFromAnalysis(base);
    const penalized = calculateQScoreFromAnalysis(noSsl);

    expect(penalized.score).toBeLessThan(clean.score);
  });
});
