import { describe, it, expect, vi } from 'vitest';
import requestIdMiddleware from '../middleware/request-id.js';
import { getRequestId } from '../utils/async-context.js';

describe('Distributed Tracing & Request ID Middleware', () => {
  it('deve gerar novo UUID v4 quando o cabeçalho X-Request-Id não existir', () => {
    const req = { headers: {} };
    const res = {
      setHeader: vi.fn()
    };
    const next = vi.fn(() => {
      // Dentro do contexto assíncrono, getRequestId() deve retornar o mesmo id
      expect(getRequestId()).toBe(req.id);
    });

    requestIdMiddleware(req, res, next);

    expect(req.id).toBeDefined();
    expect(typeof req.id).toBe('string');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.id);
    expect(next).toHaveBeenCalled();
  });

  it('deve preservar e propagar o X-Request-Id existente vindo do cliente ou gateway', () => {
    const customId = 'trace-enterprise-test-12345';
    const req = { headers: { 'x-request-id': customId } };
    const res = {
      setHeader: vi.fn()
    };
    const next = vi.fn(() => {
      expect(getRequestId()).toBe(customId);
    });

    requestIdMiddleware(req, res, next);

    expect(req.id).toBe(customId);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', customId);
    expect(next).toHaveBeenCalled();
  });
});
