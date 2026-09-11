import { generateEmailTemplate } from './services/email-template.js';

const mockAnalysis = {
  performanceMobile: 42,
  performanceScore: 78,
  overallScore: 48,
  qScore: { score: 48, grade: 'D', category: 'Fraco' },
  seo: { score: 55, title: { optimal: false, value: 'Página Inicial' }, description: { optimal: false }, h1Count: 1, imagesWithoutAlt: 14, hasSitemap: false },
  security: { score: 60, hasSSL: true },
  accessibility: { score: 30 },
  pixelDetails: { totalTracking: 1, facebook: false, ga4: true, gtm: false, googleAds: false, tiktok: false, linkedin: false, hotjar: false },
  coreWebVitals: { lcp: 3.2, fid: 120, cls: 0.003 },
  conversion: { ctas: [{ text: 'Saber Mais', effectiveness: 'low' }, { text: 'Contacte-nos', effectiveness: 'medium' }] },
};

const mockLead = { name: '2 Por Cento Imobiliária', website: 'http://www.2porcento.pt/', city: 'Leiria' };

try {
  const result = await generateEmailTemplate(mockAnalysis, mockLead);
  console.log('✅ Subject:', result.subject);
  console.log('✅ HTML length:', result.html.length, 'chars');
  console.log('✅ Primeiros 300 chars:', result.html.substring(0, 300));
  console.log('✅ React Email funcionando!');
} catch (err) {
  console.error('❌ Erro:', err.message);
}
