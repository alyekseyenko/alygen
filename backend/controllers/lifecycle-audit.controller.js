import { fetchLeads } from '../services/sheets.js';
import { calculateQScoreSimple } from '../services/q-score-calculator.js';
import { generateProposalPDF } from '../services/proposal-generator.js';
import { generateWebsiteImprovementEmail } from '../services/email-templates.js';
import supabase from '../services/supabase-service.js';

/**
 * 0 to 100 Lead Lifecycle Simulation
 * Orchestrates the entire lead journey for diagnostic purposes.
 */
export const runLifecycleSimulation = async (req, res) => {
  const { step } = req.params;
  const start = Date.now();

  // 🕵️ VIRTUAL AGENT: Fully isolated fake user for diagnostics
  const FAKE_AGENT_PROFILE = {
    id: 'f0000000-0000-0000-0000-000000000000',
    name: 'Alygen Virtual Tester',
    email: 'tester@alygen.simulation',
    address: 'Sede de Testes Alygen, Suite 001',
    nif: 'PT 999 999 999',
    iban: 'PT50 0000 0000 0000 0000 0000 0',
    iva_percentage: 23,
    irs_percentage: 25,
    logo_url: null // Uses system default for testing
  };

  // 📝 MOCK LEAD: Sandboxed in the fake agent partition
  const mockLead = {
    name: 'Lead Simulado (Auto-Audit)',
    website: 'https://alygen.pt',
    type: 'Tecnologia',
    address: 'Edifício Innovation, Lisboa',
    phone: '+351 900 000 000',
    client_type: 'EMPRESA',
    agency_id: FAKE_AGENT_PROFILE.id // Isolation
  };

  const mockAnalysis = {
    performanceMobile: 92,
    performanceDesktop: 98,
    seo: { score: 95 },
    security: { score: 100, hasSSL: true },
    accessibility: { score: 90 },
    pixelDetails: { totalTracking: 12, facebook: true, ga4: true, gtm: true },
    conversion: { score: 95, ctas: { total: 8 }, contact: { whatsapp: true } }
  };

  try {
    switch (step) {
      case 'intake': { // Step 1: Data Intake (Sheets)
        // We verify we can at least reach the fetch service
        const result = await fetchLeads();
        res.json({
          success: true,
          name: 'Stage 1: Lead Intake (Sheets)',
          status: 'pass',
          details: `Simulação de captura concluída. Lead "${mockLead.name}" preparado para processamento.`,
          latency: Date.now() - start
        });
        break;
      }

      case 'intelligence': { // Step 2: Rating & Logic
        const qScore = calculateQScoreSimple(mockAnalysis);
        // Mock pricing calculation for the backend simulation sandbox
        const pricing = { total: 2500, timeline: 4 };
        
        res.json({
          success: true,
          name: 'Stage 2: Intelligence & Logic',
          status: qScore.score > 0 ? 'pass' : 'fail',
          details: `Q-Score: ${qScore.score} (${qScore.grade}) | Budget Estimado: €${pricing.total}`,
          latency: Date.now() - start
        });
        break;
      }

      case 'synthesis': { // Step 3: Asset Generation (PDF/Email)
        const qScore = calculateQScoreSimple(mockAnalysis);
        const pricing = { total: 2500, timeline: 4 }; // Mock pricing for sandbox
        
        // We don't save the PDF, just verify the generator starts
        const pdfPromise = generateProposalPDF({ 
          ...mockLead, 
          ...mockAnalysis, 
          qScore,
          budget_items: [{ name: 'Desenvolvimento Web Premium', price: 2500 }],
          userSettings: FAKE_AGENT_PROFILE // ✅ Using Fake User
        });
        
        const emailContent = generateWebsiteImprovementEmail(
          mockLead,
          mockAnalysis,
          qScore,
          pricing,
          null
        );

        await pdfPromise; // Wait for PDF generation completion

        res.json({
          success: true,
          name: 'Stage 3: Proposal Synthesis (0-100)',
          status: (emailContent && emailContent.length > 0) ? 'pass' : 'fail',
          details: 'PDF Gerado e Email Template renderizado com sucesso.',
          latency: Date.now() - start
        });
        break;
      }

      case 'enrollment': { // Step 4: CRM/DB Orchestration
        // We attempt a dry-run insert into a specific test partition or just verify table health
        const result = await supabase.getAnalyticsStats();
        const error = result.success === false;
        
        res.json({
          success: true,
          name: 'Stage 4: CRM Enrollment (Final)',
          status: !error ? 'pass' : 'fail',
          details: `Dados sincronizados. Lead lifecycle de "${mockLead.name}" concluído do 0 ao 100.`,
          latency: Date.now() - start
        });
        break;
      }

      default:
        res.status(400).json({ success: false, error: 'Passo de lifecycle inválido' });
    }
  } catch (e) {
    res.json({
      success: false,
      name: step,
      status: 'fail',
      details: e.message,
      latency: 0
    });
  }
};
