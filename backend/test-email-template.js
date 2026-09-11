import { generateEmailHtml } from './services/email-template.js';

async function testTemplate() {
    const mockAnalysis = {
        category: 'Restauração',
        performanceMobile: 45,
        seo: { score: 60, aiDeepAudit: { success: true, userIntent: 'Comprar jantar', semanticKeywords: ['jantar'], contentGap: 'Sem menu' } },
        security: { hasSSL: true },
        pixelDetails: { totalTracking: 1 },
        qScore: { score: 55, grade: 'C' },
        strategicInsights: { strategic_recommendation: 'Melhorar SEO' },
        extractedEmails: ['teste@teste.pt'],
        coreWebVitals: { lcpVal: 3.5, fidVal: 200, clsVal: 0.1 }
    };
    
    const mockLead = {
        name: 'Restaurante O Teste',
        website: 'https://teste.pt',
        agent_intel: 'Os vossos principais concorrentes têm menus digitais com reservas imediatas, aumentando as taxas de conversão.'
    };

    try {
        console.log('Testing Email Template Generation...');
        const result = await generateEmailHtml(mockAnalysis, mockLead, []);
        console.log('✅ Template Generates Successfully!');
        console.log('HTML Length:', result.html.length);
        console.log('Subject:', result.subject);
        // Print just a snippet of HTML to be sure
        console.log('Snippet of Intel block included:');
        console.log(result.html.substring(1000, 1500));
    } catch (e) {
        console.error('❌ Template Generation Error:\n', e);
    }
}

testTemplate();
