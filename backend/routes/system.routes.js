import express from 'express';
import { 
  getScreenshots, 
  getMultipleScreenshots, 
  clearScreenshots,
  createCertificate,
  getCertificateByWebsite,
  handleCalendly
} from '../controllers/system.controller.js';
import { fullSystemHealthCheck } from '../controllers/health.controller.js';
import { getPythonStatus } from '../services/python-bridge.js';
import { runFunctionalSimulations } from '../controllers/audit.controller.js';
import { runSeniorAudit } from '../controllers/senior-audit.controller.js';
import { runUltimateAudit } from '../controllers/supreme-audit.controller.js';
import { runLifecycleSimulation } from '../controllers/lifecycle-audit.controller.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'crm-backend', timestamp: new Date().toISOString() });
});

// 🩺 Kubernetes Probes (Liveness & Readiness)
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

router.get('/health/ready', async (req, res) => {
  try {
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

router.get('/health/full', fullSystemHealthCheck);
// Alias for browsers with cached api.js
router.get('/system/health/full', fullSystemHealthCheck);

// 🔍 Functional Audits (E2E Simulations)
router.get('/system/audit/simulate/:flow', runFunctionalSimulations);

// 💎 Senior-Tier Resilience & Observability
router.get('/system/audit/senior/:category', runSeniorAudit);

// 🏛️ Enterprise Ecosystem (Supreme)
router.get('/system/audit/ultimate/:category', runUltimateAudit);

// ♻️ Master Lead Lifecycle (0-100 Simulation)
router.get('/system/audit/lifecycle/:step', runLifecycleSimulation);

// 🐍 Python Microservices Status
router.get('/python/status', async (req, res) => {
  const status = await getPythonStatus();
  res.json(status);
});

router.post('/capture-screenshot', getScreenshots);
router.post('/capture-screenshots', getMultipleScreenshots);
router.post('/cleanup-screenshots', clearScreenshots);

router.post('/generate-certificate', createCertificate);
router.get('/certificate/:website', getCertificateByWebsite);

router.post('/webhooks/calendly', handleCalendly);

export default router;
