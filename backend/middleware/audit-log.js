import crypto from 'crypto';
import db from '../services/local-db-service.js';

const AUDITED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function auditLogMiddleware(req, res, next) {
  if (!AUDITED_METHODS.has(req.method)) return next();

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400) {
      db.query(
        `INSERT INTO audit_log (id, user_id, action, resource, ip, payload)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          crypto.randomUUID(),
          req.user?.id || null,
          `${req.method} ${req.path}`,
          req.originalUrl || req.url,
          req.ip,
          JSON.stringify({ bodyKeys: Object.keys(req.body || {}) }),
        ]
      ).catch(() => {});
    }
    return originalJson(body);
  };
  next();
}

export default auditLogMiddleware;
