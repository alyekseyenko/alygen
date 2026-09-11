import { generateEmailTemplate } from './services/email-template.js';
import fs from 'fs';
const mockAnalysis = {
  performanceMobile: 42, performanceScore: 78, overallScore: 48,
  qScore: { score: 48, grade: 'D', category: 'Fraco' },
  seo: { score: 55, title: { optimal: false, value: 'Página Inicial' }, description: { optimal: false }, h1Count: 1, imagesWithoutAlt: 14 },
  security: { score: 60, hasSSL: true },
  accessibility: { score: 30 },
  pixelDetails: { totalTracking: 1, facebook: false, ga4: true, gtm: false, googleAds: false, tiktok: false, linkedin: false, hotjar: false },
  coreWebVitals: { lcp: 3.2, fid: 120, cls: 0.003 },
  conversion: { ctas: [{ text: 'Saber Mais', effectiveness: 'low' }, { text: 'Contacte-nos', effectiveness: 'medium' }] },
};
const result = await generateEmailTemplate(mockAnalysis, { name: 'Empresa Teste', website: 'https://exemplo.pt' });
fs.writeFileSync('email-preview.html', result.html);
console.log('OK - ' + result.html.length + ' chars');
