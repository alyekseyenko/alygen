import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

// Servidores & Workers
import { startFollowupCron } from './cron.js';
import { startWorker } from './services/worker.js';
import { initWhatsApp } from './services/whatsapp.js';
import { initTelegramBot } from './services/telegram-service.js';
import { startAutomationWorker } from './services/automation-worker.js';
import logger from './utils/logger.js';

// Routers
import leadRoutes from './routes/leads.routes.js';
import analysesRoutes from './routes/analyses.routes.js';
import automationRoutes from './routes/automations.routes.js';
import systemRoutes from './routes/system.routes.js';
import commsRoutes from './routes/communication.routes.js';
import crmRoutes from './routes/crm.routes.js';
import proposalRoutes from './routes/proposals.routes.js';

// Services & Middlewares
import cacheService from './services/cache-service.js';
import requestIdMiddleware from './middleware/request-id.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Global Error Handling (Process Level)
process.on('unhandledRejection', (reason) => {
  logger.error('⚠️ unhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('⚠️ uncaughtException:', err);
  // Give logger time to write before exiting if fatal
  setTimeout(() => process.exit(1), 1000);
});

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Distributed Tracing (Correlation ID) ───────────────────────────────────
app.use(requestIdMiddleware);

// ─── CORS Policy ─────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:4000', 'http://localhost:5173', 'http://127.0.0.1:4000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Global: configurable via environment (default 10k/15min in dev, customizable for production)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_GLOBAL_MAX || '10000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
});

// Strict: heavy Puppeteer audit endpoint defense
const analysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_ANALYSIS_MAX || '200', 10),
  message: { success: false, error: 'Analysis rate limit reached.', code: 'ANALYSIS_RATE_LIMITED' },
});

app.use(globalLimiter);
app.use('/api/analyze-lead', analysisLimiter);

// ─── Request Logger Middleware (Observability) ───────────────────────────────
// High-frequency polling routes are logged at 'debug' level to reduce noise.
// They still appear in combined.log, just not in the console by default.
const SILENT_ROUTES = ['/api/sequences', '/api/analysis-status', '/api/contacts-log'];

app.use((req, res, next) => {
  const isSilent = SILENT_ROUTES.some(r => req.url.startsWith(r));
  const level = isSilent ? 'debug' : 'info';
  logger[level](`${req.method} ${req.url}`, { ip: req.ip });
  next();
});

// Static Assets
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

// ─── CRM Middleware (Cache Invalidation) ──────────────────────────────────────
app.use('/api', (req, res, next) => {
  if (req.method === 'POST' && req.url === '/crm/update') {
    cacheService.invalidateLeadsCache();
  }
  next();
}, crmRoutes);

// ─── Kubernetes & Ingress Probes (Root Aliases) ──────────────────────────────
app.get('/health', (req, res) => res.status(200).json({ status: 'UP', service: 'crm-backend', timestamp: new Date().toISOString() }));
app.get('/live', (req, res) => res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() }));
app.get('/ready', async (req, res) => {
  try {
    const { getPythonStatus } = await import('./services/python-bridge.js');
    const python = await getPythonStatus();
    res.status(200).json({
      status: 'READY',
      uptime: process.uptime(),
      pythonService: python.online ? 'UP' : 'FALLBACK',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(503).json({ status: 'NOT_READY', error: e.message });
  }
});

// ─── API Routes (Modularized) ──────────────────────────────────────────────────
app.use('/api', leadRoutes);
app.use('/api', analysesRoutes);
app.use('/api', automationRoutes);
app.use('/api', systemRoutes);
app.use('/api', commsRoutes);
app.use('/api', proposalRoutes);

// ─── RGPD Root Alias ─────────────────────────────────────────────────────────
app.all('/unsubscribe', (req, res) => {
  const queryStr = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(307, `/api/unsubscribe${queryStr}`);
});

// ─── Global Error Handler Middleware ─────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled Error [${req.method} ${req.url}]:`, err);

  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
});

// ─── Start Server & Background Services ───────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Alygen CRM Backend rodando em http://localhost:${PORT}`);

  // Background Services
  startFollowupCron();
  initWhatsApp();
  startWorker();
  initTelegramBot();
  startAutomationWorker();
});
