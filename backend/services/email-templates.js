// 📧 TEMPLATES DE EMAIL ANTI-SPAM

const SENDER_NAME = process.env.SENDER_NAME || 'Consultor Alygen';
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.SMTP_USER || 'contacto@alygen.com';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Alygen';
const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE || 'https://alygen.com';
const API_HOST = process.env.API_HOST || 'http://localhost:3001';

// Template para leads SEM SITE (informativo, não vendedor)
export function generateNoWebsiteEmail(leadData, socialMediaInfo, proposal, nearbyCompetitors) {
  const { platform } = socialMediaInfo;
  const { risks, proposal: proposalDetails } = proposal;
  
  return `Assunto: Análise Digital - ${leadData.name}

Bom dia,

O meu nome é ${SENDER_NAME} e trabalho com transformação digital e inteligência de mercado na ${COMPANY_NAME}.

Encontrei ${leadData.name} no Google Maps e reparei que atualmente utilizam ${platform} como principal canal digital.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ANÁLISE DA SITUAÇÃO ATUAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${nearbyCompetitors ? `
🎯 ANÁLISE DE MERCADO LOCAL (${nearbyCompetitors.region}):

• Total de negócios similares analisados: ${nearbyCompetitors.count}
• Com website próprio: ${nearbyCompetitors.withWebsite} (${nearbyCompetitors.percentageWithWebsite}%)
• Apenas redes sociais: ${nearbyCompetitors.withoutWebsite}

${nearbyCompetitors.withWebsite > 0 ? `⚠️ ALERTA: ${nearbyCompetitors.percentageWithWebsite}% dos seus concorrentes diretos já têm website profissional e estão a captar clientes que pesquisam no Google.

Exemplos na sua área:
${nearbyCompetitors.competitors.filter(c => c.hasWebsite).slice(0, 3).map((c, i) => `${i + 1}. ${c.name} - Website ativo`).join('\n')}` : `✅ OPORTUNIDADE: Nenhum concorrente próximo tem website!

Ser o primeiro a ter presença digital profissional na sua área é uma vantagem competitiva enorme.`}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 DADOS DO MERCADO PORTUGUÊS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Segundo estudos recentes:

• 81% dos consumidores pesquisam online antes de comprar
• 75% julgam a credibilidade pelo website
• 70% das pesquisas locais resultam em visita em 24h
• Negócios com website crescem 40% mais rápido

Fonte: Google Business, BrightLocal 2024

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 PRINCIPAIS LIMITAÇÕES ATUAIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${risks.slice(0, 3).map((risk, i) => `${i + 1}. ${risk.title}
   ${risk.description}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PROPOSTA DE SOLUÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${proposalDetails.title}

O que inclui:

${proposalDetails.includes.slice(0, 8).map(item => item).join('\n')}

💰 Investimento: €${proposalDetails.investment.total}
⏱️ Prazo: ${proposalDetails.timeline}
🛡️ Garantia: ${proposalDetails.guarantee}

📊 Comparação:
• Média do mercado: €${proposalDetails.investment.comparison.marketAverage}
• Esta proposta: €${proposalDetails.investment.total}
• Poupança: €${proposalDetails.investment.comparison.savings}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 PRÓXIMO PASSO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se tiver interesse em saber mais, responda simplesmente "Sim, tenho interesse" e agendamos uma conversa de 20 minutos para:

1. Mostrar exemplos de websites similares
2. Explicar o processo em detalhe
3. Responder às suas questões
4. Ajustar a proposta às suas necessidades

Sem compromisso.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cumprimentos,

${SENDER_NAME}
${COMPANY_NAME} — Consultoria Digital & Estratégia Web

📧 ${SENDER_EMAIL}
🌐 ${COMPANY_WEBSITE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

P.S.: Esta análise foi realizada para fins de diagnóstico e contacto B2B legítimo nos termos do RGPD (UE 2016/679).
Caso pretenda cancelar comunicações futuras (opt-out), responda "Cancelar" ou aceda a: ${API_HOST}/api/unsubscribe?email=${encodeURIComponent(leadData.client_email || leadData.email || '')}`;
}

// Template para leads COM SITE (informativo com dados técnicos)
export function generateWebsiteImprovementEmail(leadData, analysis, qScore, pricing, nearbyCompetitors) {
  return `Assunto: Análise Técnica - ${leadData.name}

Bom dia,

O meu nome é ${SENDER_NAME} e trabalho com inteligência web e otimização na ${COMPANY_NAME}.

Realizei uma análise técnica de ${leadData.website} e identifiquei algumas oportunidades de melhoria.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ANÁLISE TÉCNICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 Score Global: ${qScore.score}/100 (${qScore.grade})
Categoria: ${qScore.category}

📈 Métricas Principais:

• Performance Mobile: ${analysis.performanceMobile || 0}/100
• SEO: ${analysis.seo?.score || 0}/100
• Segurança: ${analysis.security?.score || 0}/100
• Tracking: ${analysis.pixelDetails?.totalTracking || 0}/7 pixels

${nearbyCompetitors && nearbyCompetitors.withWebsite > 0 ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ANÁLISE COMPETITIVA (${nearbyCompetitors.region})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analisei ${nearbyCompetitors.withWebsite} concorrentes próximos com website:

${nearbyCompetitors.competitors.filter(c => c.hasWebsite && c.qScore > 0).slice(0, 3).map((c, i) => `${i + 1}. ${c.name}: ${c.qScore}/100`).join('\n')}

${qScore.score > 0 ? `Seu score: ${qScore.score}/100` : ''}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 PRINCIPAIS OPORTUNIDADES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${analysis.performanceMobile < 70 ? `1. Performance Mobile (${analysis.performanceMobile}/100)
   Sites lentos perdem 53% dos visitantes
   
` : ''}${!analysis.pixelDetails?.facebook || !analysis.pixelDetails?.ga4 ? `2. Tracking & Analytics
   Sem dados precisos, decisões são baseadas em intuição
   
` : ''}${analysis.seo?.score < 70 ? `3. SEO (${analysis.seo.score}/100)
   Melhor posicionamento = mais tráfego orgânico gratuito
   
` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 PROPOSTA DE OTIMIZAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pacote personalizado para ${leadData.name}:

${analysis.performanceMobile < 70 ? '✅ Otimização de Performance\n' : ''}${!analysis.pixelDetails?.facebook || !analysis.pixelDetails?.ga4 ? '✅ Instalação de Tracking Completo\n' : ''}${analysis.seo?.score < 70 ? '✅ Otimização SEO\n' : ''}${!analysis.security?.hasSSL ? '✅ Certificado SSL\n' : ''}
💰 Investimento estimado: €${pricing.total}
⏱️ Prazo: ${pricing.timeline} semanas
📊 ROI esperado: +150% em conversões

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 PRÓXIMO PASSO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se tiver interesse em saber mais detalhes, responda "Sim, tenho interesse" e agendamos uma conversa de 20 minutos.

Sem compromisso.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cumprimentos,

${SENDER_NAME}
${COMPANY_NAME} — Otimização Web & Marketing Digital

📧 ${SENDER_EMAIL}
🌐 ${COMPANY_WEBSITE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

P.S.: Esta análise foi realizada para fins de diagnóstico e contacto B2B legítimo nos termos do RGPD (UE 2016/679).
Caso pretenda cancelar comunicações futuras (opt-out), responda "Cancelar" ou aceda a: ${API_HOST}/api/unsubscribe?email=${encodeURIComponent(leadData.client_email || leadData.email || '')}`;
}
