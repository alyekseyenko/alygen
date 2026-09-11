import crypto from 'crypto';
import { asyncLocalStorage } from '../utils/async-context.js';

/**
 * Enterprise Correlation ID Middleware
 * Generates or propagates X-Request-Id across all async microservice hops.
 */
export function requestIdMiddleware(req, res, next) {
  const correlationId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = correlationId;
  res.setHeader('X-Request-Id', correlationId);

  asyncLocalStorage.run({ requestId: correlationId }, () => {
    next();
  });
}

export default requestIdMiddleware;
