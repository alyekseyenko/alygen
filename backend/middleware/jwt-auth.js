import { verifyAccessToken } from '../utils/auth-token.js';

/**
 * JWT opcional — se JWT_SECRET/ALYGEN_API_KEY definido e token válido, popula req.user.
 * Não bloqueia pedidos sem token (compatível com API key global).
 */
export function jwtOptionalMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token && token.includes('.')) {
    const payload = verifyAccessToken(token);
    if (payload) {
      req.user = { id: payload.sub, email: payload.email, role: payload.role };
    }
  }
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Sessão necessária', code: 'UNAUTHORIZED' });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Permissão insuficiente', code: 'FORBIDDEN' });
    }
    next();
  };
}

export default jwtOptionalMiddleware;
