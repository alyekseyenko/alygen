import { describe, it, expect } from 'vitest';
import { calculateQScore } from '../services/analyzers/qscore-calculator.js';

describe('Q-Score JS fallback (aligned with Python default sector)', () => {
  it('scores high metrics with grade A or B', () => {
    const result = calculateQScore(
      {
        performanceScore: 90,
        seoScore: 95,
        securityScore: 90,
        trackingCount: 4,
        hasCTA: true,
        hasSSL: true,
      },
      { type: 'servicos' }
    );
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(['A+', 'A', 'B']).toContain(result.grade);
    expect(result.priority).toBeDefined();
  });

  it('scores poorly with grade F and penalties', () => {
    const result = calculateQScore(
      {
        performanceScore: 0,
        seoScore: 0,
        securityScore: 0,
        trackingCount: 0,
        hasCTA: false,
        hasSSL: false,
      },
      {}
    );
    expect(result.score).toBeLessThanOrEqual(30);
    expect(result.grade).toBe('F');
  });
});
