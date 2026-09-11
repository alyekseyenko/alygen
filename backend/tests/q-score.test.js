import { describe, it, expect } from 'vitest';
import { calculateQScore } from '../services/q-score-calculator.js';

describe('Q-Score Calculation Engine', () => {
  it('deve calcular pontuação para lead com métricas altas e retornar nota A/B', () => {
    const highPerfLead = {
      performanceMobile: 90,
      seo: { score: 95 },
      security: { score: 90, hasSSL: true },
      accessibility: { score: 88 },
      pixelDetails: { totalTracking: 4 },
      conversion: { score: 85 },
      googleRanking: { rank: 3 }
    };

    const result = calculateQScore(highPerfLead);

    expect(result).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(['A', 'B']).toContain(result.grade);
    expect(result.benchmarkComparison).toBeDefined();
    expect(result.topOpportunities).toBeInstanceOf(Array);
  });

  it('deve atribuir nota F para lead sem presença digital e métricas zeradas', () => {
    const zeroLead = {
      performanceMobile: 0,
      seo: { score: 0 },
      security: { score: 0, hasSSL: false },
      accessibility: { score: 0 },
      pixelDetails: { totalTracking: 0 },
      conversion: { score: 0 }
    };

    const result = calculateQScore(zeroLead);

    expect(result).toBeDefined();
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.grade).toBe('F');
    expect(result.opportunity).toBeGreaterThan(0);
  });

  it('deve aplicar penalizações quando detetar erros críticos de Lighthouse', () => {
    const baseLead = {
      performanceMobile: 70,
      seo: { score: 70 },
      security: { score: 70 },
      accessibility: { score: 70 },
      conversion: { score: 70 }
    };

    const leadWithPenalties = {
      ...baseLead,
      lighthouseAudits: {
        jsErrors: 0,
        noVulnerableLibraries: 0,
        totalByteWeight: 6000000
      }
    };

    const cleanResult = calculateQScore(baseLead);
    const penaltyResult = calculateQScore(leadWithPenalties);

    expect(penaltyResult.score).toBeLessThan(cleanResult.score);
  });
});
