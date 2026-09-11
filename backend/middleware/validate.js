/**
 * 🛡️ Request Validation Middleware (Zod)
 * Alygen CRM - Enterprise Staff Engineering Grade
 */

export function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const issuesList = err.issues || err.errors || [];
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          code: 'INVALID_PAYLOAD',
          issues: issuesList.map(e => ({
            path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
            message: e.message
          }))
        });
      }
      next(err);
    }
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err.name === 'ZodError') {
        const issuesList = err.issues || err.errors || [];
        return res.status(400).json({
          success: false,
          error: 'Invalid Query Parameters',
          code: 'INVALID_QUERY',
          issues: issuesList.map(e => ({
            path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
            message: e.message
          }))
        });
      }
      next(err);
    }
  };
}
