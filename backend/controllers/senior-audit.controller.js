import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../services/local-db-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const runSeniorAudit = async (req, res) => {
  const { category } = req.params;
  const start = Date.now();

  try {
    switch (category) {
      case 'stability': {
        const logPath = path.join(__dirname, '../logs/combined.log');
        if (!fs.existsSync(logPath)) throw new Error('Logs not available');
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.trim().split('\n').slice(-100);
        const errorCount = lines.filter((l) => l.includes('"level":"error"')).length;
        const stabilityScore = 100 - errorCount;
        res.json({
          success: true,
          name: 'System Stability (100 Logs)',
          status: stabilityScore > 95 ? 'pass' : stabilityScore > 80 ? 'warn' : 'fail',
          details: `Estabilidade de ${stabilityScore}% | ${errorCount} erros no buffer recente.`,
          latency: Date.now() - start,
        });
        break;
      }
      case 'resource': {
        const memory = process.memoryUsage();
        const heapMB = Math.round(memory.heapUsed / 1024 / 1024);
        res.json({
          success: true,
          name: 'Memory Footprint',
          status: heapMB < 400 ? 'pass' : 'warn',
          details: `Heap: ${heapMB}MB`,
          latency: Date.now() - start,
        });
        break;
      }
      case 'security': {
        const keyDefined = !!(process.env.ALYGEN_API_KEY || process.env.JWT_SECRET);
        res.json({
          success: true,
          name: 'Security Shield (API/JWT)',
          status: keyDefined ? 'pass' : 'warn',
          details: keyDefined ? 'Autenticação configurada' : 'Defina ALYGEN_API_KEY ou JWT_SECRET em produção',
          latency: Date.now() - start,
        });
        break;
      }
      case 'data': {
        const orphan = await db.query('SELECT COUNT(*) AS c FROM lead_analyses WHERE qscore IS NULL OR qscore = 0');
        const orphanCount = parseInt(orphan.rows?.[0]?.c || orphan.rows?.[0]?.count || '0', 10);
        res.json({
          success: true,
          name: 'Data Integrity (Orphan Check)',
          status: orphanCount < 50 ? 'pass' : 'warn',
          details: `${orphanCount} leads com Q-Score em falta ou zero`,
          latency: Date.now() - start,
        });
        break;
      }
      default:
        res.status(400).json({ success: false, error: 'Categoria Senior inválida' });
    }
  } catch (e) {
    res.json({ success: false, name: category, status: 'fail', details: e.message, latency: 0 });
  }
};
