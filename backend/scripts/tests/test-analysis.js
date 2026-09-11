import { analyzeConversion } from './services/conversion-analyzer.js';
import { analyzeContent } from './services/content-analyzer.js';
import { analyzeTechnologies } from './services/technology-analyzer.js';
import { analyzeSocialMedia } from './services/social-media-analyzer.js';

const testUrl = 'https://kpi.pt/';

console.log('🧪 TESTE DE ANÁLISES - https://kpi.pt/\n');

async function runTests() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1️⃣ TESTE: Análise de Conversão');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const conversion = await analyzeConversion(testUrl);
    
    console.log('📊 Resultados:');
    console.log(`   Score: ${conversion.score}/100`);
    console.log(`   CTAs: ${conversion.ctas.total} (${conversion.ctas.quality})`);
    console.log(`   Formulários: ${conversion.forms.total}`);
    console.log(`   WhatsApp: ${conversion.contact.whatsapp ? '✅' : '❌'}`);
    console.log(`   Telefone Clicável: ${conversion.contact.clickablePhone ? '✅' : '❌'}`);
    console.log(`   Telefones encontrados: ${conversion.contact.phone.join(', ')}`);
    console.log(`   Live Chat: ${conversion.contact.livechat ? '✅' : '❌'}`);
    console.log(`   Prova Social: ${conversion.socialProof.hasSocialProof ? '✅' : '❌'}\n`);
    
    if (conversion.ctas.buttons.length > 0) {
      console.log('   CTAs detectados:');
      conversion.ctas.buttons.forEach((cta, i) => {
        console.log(`     ${i + 1}. "${cta.text}" (${cta.type})`);
      });
      console.log('');
    }
    
    console.log('   Recomendações:');
    conversion.recommendations.forEach((rec, i) => {
      console.log(`     ${i + 1}. ${rec}`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('2️⃣ TESTE: Análise de Conteúdo');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const content = await analyzeContent(testUrl, null, process.env.GROQ_API_KEY);
    
    console.log('📊 Resultados:');
    console.log(`   Score: ${content.score}/100`);
    console.log(`   Palavras: ${content.wordCount}`);
    console.log(`   Legibilidade: ${content.readability}`);
    console.log(`   Estrutura de Vendas: ${content.salesStructure.hasStructure ? '✅' : '❌'}`);
    console.log(`   Prova Social: ${content.socialProofMentions} menções\n`);
    
    if (content.aiAnalysis) {
      console.log('   Análise IA:');
      console.log(`     Qualidade: ${content.aiAnalysis.writingQuality}/10`);
      console.log(`     Persuasão: ${content.aiAnalysis.persuasion}/10`);
      console.log(`     Tom: ${content.aiAnalysis.tone}\n`);
    }
    
    console.log('   Top 5 Palavras-chave:');
    content.keywords.slice(0, 5).forEach((kw, i) => {
      console.log(`     ${i + 1}. "${kw.word}" (${kw.count}x)`);
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('3️⃣ TESTE: Análise de Tecnologias');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const tech = await analyzeTechnologies(testUrl);
    
    console.log('📊 Resultados:');
    console.log(`   Score: ${tech.score}/100`);
    console.log(`   CMS: ${tech.cms.name}${tech.cms.version ? ` v${tech.cms.version}` : ''}`);
    console.log(`   Desatualizado: ${tech.cms.outdated ? '⚠️ SIM' : '✅ NÃO'}`);
    console.log(`   Frameworks: ${tech.framework.join(', ')}`);
    console.log(`   CDN: ${tech.cdn.join(', ')}`);
    console.log(`   E-commerce: ${tech.ecommerce || 'Não detectado'}\n`);
    
    if (tech.vulnerabilities.length > 0) {
      console.log('   ⚠️ Vulnerabilidades:');
      tech.vulnerabilities.forEach((vuln, i) => {
        console.log(`     ${i + 1}. [${vuln.severity}] ${vuln.issue}`);
      });
      console.log('');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('4️⃣ TESTE: Análise de Redes Sociais');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const social = await analyzeSocialMedia(testUrl);
    
    console.log('📊 Resultados:');
    console.log(`   Score: ${social.score}/100`);
    console.log(`   Plataformas: ${social.totalPlatforms}/7\n`);
    
    Object.entries(social.platforms).forEach(([platform, data]) => {
      if (data.hasLink) {
        console.log(`   ✅ ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${data.url}`);
      }
    });
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TESTES CONCLUÍDOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Validação manual
    console.log('🔍 VALIDAÇÃO MANUAL (https://kpi.pt/):');
    console.log('   ✅ Tem CTAs? SIM ("MARCAR CONSULTA")');
    console.log(`   ${conversion.ctas.total > 0 ? '✅' : '❌'} Detectado: ${conversion.ctas.total} CTAs\n`);
    
    console.log('   ✅ Tem Formulário? SIM (página contactos)');
    console.log(`   ${conversion.forms.total > 0 ? '✅' : '❌'} Detectado: ${conversion.forms.total} formulários\n`);
    
    console.log('   ✅ Telefone Clicável? SIM (tel:+351213879090)');
    console.log(`   ${conversion.contact.clickablePhone ? '✅' : '❌'} Detectado: ${conversion.contact.clickablePhone}\n`);
    
    console.log('   ✅ WhatsApp? SIM');
    console.log(`   ${conversion.contact.whatsapp ? '✅' : '❌'} Detectado: ${conversion.contact.whatsapp}\n`);
    
    console.log('   ✅ Instagram? SIM');
    console.log(`   ${social.platforms.instagram.hasLink ? '✅' : '❌'} Detectado: ${social.platforms.instagram.hasLink}\n`);
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    console.error(error.stack);
  }
}

runTests();
