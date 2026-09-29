/**
 * Proteção opcional da API via ALYGEN_API_KEY.
 * Se a variável não estiver definida, o middleware não bloqueia (dev local).
 */
import { verifyAccessToken } from '../utils/auth-token.js';

export function apiAuthMiddleware(req, res, next) {
  const apiKey = process.env.ALYGEN_API_KEY;
  if (!apiKey) {
    return next();
  }

  const publicPaths = [
    '/health',
    '/live',
    '/ready',
    '/unsubscribe',
    '/api/unsubscribe',
    '/api/track-open/',
    '/api/health',
    '/api/health/live',
    '/api/health/ready',
    '/api/auth/login',
    '/api/auth/register',
    '/api/openapi.json',
    '/api/webhooks/calendly',
  ];

  const path = req.path || req.url.split('?')[0];
  if (publicPaths.some((p) => path === p || path.startsWith(p))) {
    return next();
  }

  const headerKey = req.headers['x-api-key'];
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;

  if (bearer && bearer.includes('.') && verifyAccessToken(bearer)) {
    return next();
  }

  const provided = headerKey || bearer;

  if (provided && provided === apiKey) {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Não autorizado',
    code: 'UNAUTHORIZED',
  });
}

export default apiAuthMiddleware;
