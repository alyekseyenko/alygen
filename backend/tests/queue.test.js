import { describe, test, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import analysisQueue from '../analysis-queue.js';

describe('Analysis Queue Engine', () => {
  beforeEach(() => {
    vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    analysisQueue.queue = [];
    analysisQueue.lastProcessedAt = null;
    analysisQueue.processing = false;
  });

  test('Deve adicionar um lead à fila e retornar a posição e tempo de espera = 0 se for o primeiro', () => {
    const leadData = { name: 'Test Lead', website: 'https://test.com' };
    const result = analysisQueue.add(leadData);

    expect(result.position).toBe(1);
    expect(result.estimatedWaitTime).toBe(0);
    expect(analysisQueue.queue.length).toBe(1);
    expect(analysisQueue.queue[0].status).toBe('pending');
  });

  test('Deve calcular o tempo de espera corretamente para multiplos elementos', () => {
    analysisQueue.lastProcessedAt = new Date();
    analysisQueue.add({ name: 'Lead 1' });
    const result2 = analysisQueue.add({ name: 'Lead 2' });

    expect(result2.position).toBe(2);
    // Rate limit nativo do CRM é de 20 segundos
    expect(result2.estimatedWaitTime).toBeGreaterThanOrEqual(20000);
  });

  test('A fila deve limpar corretamente requests arquivados', () => {
    analysisQueue.queue = [
      { id: 1, status: 'completed' },
      { id: 2, status: 'pending' }
    ];
    analysisQueue.clearCompleted();
    expect(analysisQueue.queue.length).toBe(1);
    expect(analysisQueue.queue[0].id).toBe(2);
  });
});
