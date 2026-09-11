import { describe, it, expect } from 'vitest';
import { api, apiQuick, apiHeavy, API_HOST } from '../../src/utils/api';

describe('Frontend API Client Suite', () => {
  it('configures default api instance with correct baseURL and headers', () => {
    expect(api.defaults.baseURL).toBe(`${API_HOST}/api`);
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
    expect(api.defaults.timeout).toBe(180000);
  });

  it('configures apiQuick instance with 10s low-latency timeout', () => {
    expect(apiQuick.defaults.baseURL).toBe(`${API_HOST}/api`);
    expect(apiQuick.defaults.timeout).toBe(10000);
    expect(apiQuick.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('exposes apiHeavy instance for deep audits and crawlers', () => {
    expect(apiHeavy.defaults.timeout).toBe(180000);
  });
});
