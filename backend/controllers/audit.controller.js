import { generatePDFReport } from '../services/pdf-generator-advanced.js';
import { generateWebsiteImprovementEmail } from '../services/email-templates.js';
import analysisQueue from '../analysis-queue.js';
import { getAutomationWorkerStatus } from '../services/automation-worker.js';

/**
 * Controller for Functional Business Flow Simulations
 * Ensures that core features like PDF generation and Email rendering are working.
 */
export const runFunctionalSimulations = async (req, res) => {
  const { flow } = req.params;
  const results = [];

  const mockLead = {
    id: 'test-lead-123',
    name: 'Loja Exemplo 2026',
    website: 'https://exemplo.pt',
    email: 'teste@exemplo.pt'
  };

  const mockAnalysis = {
    overallScore: 78,
    performanceMobile: 82,
    seo: { score: 75 },
    pixelDetails: { totalTracking: 4 },
    security: { score: 90, hasSSL: true }
  };

  const mockQScore = {
    score: 78,
    grade: 'B+',
    category: 'E-commerce'
  };

  const mockPricing = {
    total: 1200,
    timeline: '3 semanas'
  };

  try {
    switch (flow) {
      case 'pdf_generation': {
        const start = Date.now();
        const buffer = await generatePDFReport(mockAnalysis, mockLead);
        if (buffer && buffer.length > 50000) { // Should be at least 50KB
          res.json({
            success: true,
            name: 'Report Synthesis',
            status: 'pass',
            details: `PDF gerado com sucesso (${(buffer.length / 1024).toFixed(0)}KB)`,
            latency: Date.now() - start
          });
        } else {
          throw new Error('Buffer de PDF inválido ou muito pequeno');
        }
        break;
      }

      case 'email_rendering': {
        const start = Date.now();
        const html = generateWebsiteImprovementEmail(mockLead, mockAnalysis, mockQScore, mockPricing);
        if (html && html.includes('Loja Exemplo 2026') && html.includes('B+')) {
          res.json({
            success: true,
            name: 'Email Logic',
            status: 'pass',
            details: 'Templates renderizados corretamente com variáveis dinâmicas',
            latency: Date.now() - start
          });
        } else {
          throw new Error('Falha na interpolação de variáveis no template de email');
        }
        break;
      }

      case 'worker_heartbeats': {
        const start = Date.now();
        const autoStatus = getAutomationWorkerStatus();
        const scraperBeat = analysisQueue.lastHeartbeat;
        
        const details = [];
        if (scraperBeat) details.push(`Autopilot: Online (${Math.round((Date.now() - scraperBeat.getTime())/1000)}s atrás)`);
        else details.push('Autopilot: Standby');
        
        if (autoStatus.active) details.push(`Automation: Online (${Math.round((Date.now() - autoStatus.lastHeartbeat.getTime())/1000)}s atrás)`);
        else details.push('Automation: Standby');

        res.json({
          success: true,
          name: 'Worker Health',
          status: (scraperBeat || autoStatus.active) ? 'pass' : 'warn',
          details: details.join(' | '),
          latency: Date.now() - start
        });
        break;
      }

      default:
        res.status(400).json({ success: false, error: 'Simulação desconhecida' });
    }
  } catch (e) {
    res.json({
      success: false,
      name: flow,
      status: 'fail',
      details: e.message,
      latency: 0
    });
  }
};
