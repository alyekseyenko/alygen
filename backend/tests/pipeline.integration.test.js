import { describe, it, expect } from 'vitest';
import analysisQueue from '../analysis-queue.js';
import { calculateQScore } from '../services/analyzers/qscore-calculator.js';

describe('Analysis Pipeline Integration Suite', () => {
  it('enqueues lead analysis job and returns correct contract status', () => {
    const mockLead = {
      name: 'Clínica Sorriso Saudável',
      website: 'https://clinica-sorriso-saudavel.pt',
      city: 'Braga',
      sector: 'Saúde'
    };

    const job = analysisQueue.add(mockLead, true, { phase: 1 });

    expect(job).toHaveProperty('id');
    expect(job).toHaveProperty('position');
    expect(job).toHaveProperty('estimatedWaitTime');
    expect(typeof job.id).toBe('number');

    const status = analysisQueue.getStatus(job.id);
    expect(status).not.toBeNull();
    expect(status.id).toBe(job.id);
    expect(['pending', 'processing', 'completed']).toContain(status.status);
    expect(status).toHaveProperty('addedAt');
  });

  it('aggregates multi-analyzer telemetry into final Q-Score contract', () => {
    const mockAuditPayload = {
      performanceScore: 45,
      seoScore: 62,
      securityScore: 80,
      accessibilityScore: 55,
      trackingCount: 2,
      googleRanking: { rankingScale: 60 },
      aeoScore: 70
    };

    const qscoreResult = calculateQScore(mockAuditPayload, { type: 'Dentista' });

    expect(qscoreResult).toHaveProperty('score');
    expect(qscoreResult).toHaveProperty('grade');
    expect(qscoreResult).toHaveProperty('status');
    expect(typeof qscoreResult.score).toBe('number');
    expect(qscoreResult.score).toBeGreaterThanOrEqual(0);
    expect(qscoreResult.score).toBeLessThanOrEqual(100);
    expect(['A+', 'A', 'B', 'C', 'D', 'E', 'F']).toContain(qscoreResult.grade);
  });

  it('manages queue statistics and clearing completed entries properly', () => {
    const initialStats = analysisQueue.getQueueStats();
    expect(initialStats).toHaveProperty('total');
    expect(initialStats).toHaveProperty('pending');
    expect(initialStats).toHaveProperty('completed');
    expect(initialStats).toHaveProperty('failed');

    analysisQueue.clearCompleted();
    const updatedStats = analysisQueue.getQueueStats();
    expect(updatedStats.completed).toBe(0);
  });
});
