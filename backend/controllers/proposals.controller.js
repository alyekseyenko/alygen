import { generatePDFReport } from '../services/pdf-generator-advanced.js';
import { generateProposalPDF } from '../services/proposal-generator.js';

export const createReportPDF = async (req, res) => {
  try {
    const { analysis, leadData } = req.body;
    
    if (!analysis || !leadData) {
      return res.status(400).json({ success: false, error: 'Análise e dados do lead são obrigatórios' });
    }
    
    console.log(`📄 Gerando PDF para: ${leadData.name}`);
    const pdfBuffer = await generatePDFReport(analysis, leadData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Relatorio-${leadData.name.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: 'Erro ao gerar relatório PDF'
    });
  }
};

export const createProposalPDF = async (req, res) => {
  try {
    const dealData = req.body;
    if (!dealData || !dealData.website) {
      return res.status(400).json({ success: false, error: 'Dados do deal ausentes' });
    }

    console.log(`📄 Gerando Proposta Alygen para: ${dealData.website}`);
    const pdfBuffer = await generateProposalPDF(dealData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Proposta_Alygen_${dealData.name?.replace(/\s+/g, '_') || 'Deal'}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('❌ Erro ao gerar proposta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
