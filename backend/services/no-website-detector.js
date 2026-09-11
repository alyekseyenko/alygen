// 🔍 DETECTOR DE REDES SOCIAIS
// Identifica se o "website" é na verdade uma rede social

export function detectSocialMediaAsWebsite(url) {
  if (!url) return { isSocialMedia: false };
  
  const urlLower = url.toLowerCase();
  
  // Facebook
  if (urlLower.includes('facebook.com') || urlLower.includes('fb.com') || urlLower.includes('fb.me')) {
    return {
      isSocialMedia: true,
      platform: 'Facebook',
      profileUrl: url,
      icon: '📘',
      message: 'Este negócio usa apenas Facebook como presença online'
    };
  }
  
  // Instagram
  if (urlLower.includes('instagram.com') || urlLower.includes('instagr.am')) {
    return {
      isSocialMedia: true,
      platform: 'Instagram',
      profileUrl: url,
      icon: '📸',
      message: 'Este negócio usa apenas Instagram como presença online'
    };
  }
  
  // LinkedIn
  if (urlLower.includes('linkedin.com')) {
    return {
      isSocialMedia: true,
      platform: 'LinkedIn',
      profileUrl: url,
      icon: '💼',
      message: 'Este negócio usa apenas LinkedIn como presença online'
    };
  }
  
  // TikTok
  if (urlLower.includes('tiktok.com')) {
    return {
      isSocialMedia: true,
      platform: 'TikTok',
      profileUrl: url,
      icon: '🎵',
      message: 'Este negócio usa apenas TikTok como presença online'
    };
  }
  
  // YouTube
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return {
      isSocialMedia: true,
      platform: 'YouTube',
      profileUrl: url,
      icon: '📹',
      message: 'Este negócio usa apenas YouTube como presença online'
    };
  }
  
  // Twitter/X
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
    return {
      isSocialMedia: true,
      platform: 'Twitter/X',
      profileUrl: url,
      icon: '🐦',
      message: 'Este negócio usa apenas Twitter/X como presença online'
    };
  }
  
  // WhatsApp Business
  if (urlLower.includes('wa.me') || urlLower.includes('whatsapp.com')) {
    return {
      isSocialMedia: true,
      platform: 'WhatsApp',
      profileUrl: url,
      icon: '💬',
      message: 'Este negócio usa apenas WhatsApp como presença online'
    };
  }
  
  // Idealista
  if (urlLower.includes('idealista.pt') || urlLower.includes('idealista.com')) {
    return {
      isSocialMedia: true,
      platform: 'Idealista',
      profileUrl: url,
      icon: '🏠',
      message: 'Este negócio usa apenas Idealista como presença online'
    };
  }
  
  return { isSocialMedia: false };
}

// 📧 EXTRAIR EMAIL DE PERFIL SOCIAL (melhorado com Puppeteer)
export async function extractEmailFromSocialProfile(url, platform) {
  try {
    const puppeteer = await import('puppeteer');
    
    console.log(`🔍 Iniciando extração de email do ${platform}...`);
    
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // User agent realista
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Esperar um pouco para carregar conteúdo dinâmico
      await page.waitForTimeout(3000);
      
      const html = await page.content();
      
      // Método 1: Buscar emails no HTML
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const emails = [];
      let match;
      
      while ((match = emailRegex.exec(html)) !== null) {
        emails.push(match[1]);
      }
      
      // Método 2: Buscar em elementos específicos do Facebook/Instagram
      if (platform === 'Facebook') {
        // Tentar clicar em "Sobre" ou "About"
        try {
          await page.click('a[href*="/about"]');
          await page.waitForTimeout(2000);
          const aboutHtml = await page.content();
          const aboutEmails = aboutHtml.match(emailRegex) || [];
          emails.push(...aboutEmails);
        } catch (e) {
          console.log('⚠️ Não foi possível acessar seção Sobre');
        }
      }
      
      if (platform === 'Instagram') {
        // Instagram geralmente mostra email na bio
        try {
          const bioText = await page.$eval('header section', el => el.textContent);
          const bioEmails = bioText.match(emailRegex) || [];
          emails.push(...bioEmails);
        } catch (e) {
          console.log('⚠️ Não foi possível extrair bio do Instagram');
        }
      }
      
      await browser.close();
      
      // Filtrar emails válidos
      const validEmails = emails.filter(email => {
        const lower = email.toLowerCase();
        return !lower.includes('facebook.com') &&
               !lower.includes('instagram.com') &&
               !lower.includes('example.com') &&
               !lower.includes('noreply') &&
               !lower.includes('support') &&
               !lower.includes('privacy') &&
               !lower.includes('help') &&
               !lower.includes('sentry.io') &&
               !lower.includes('.png') &&
               !lower.includes('.jpg') &&
               !lower.includes('.gif') &&
               !lower.includes('.svg') &&
               !lower.includes('.webp') &&
               email.length < 50 &&
               email.length > 5;
      });
      
      // Remover duplicados
      const uniqueEmails = [...new Set(validEmails)];
      
      if (uniqueEmails.length > 0) {
        console.log(`✅ ${uniqueEmails.length} email(s) encontrado(s): ${uniqueEmails.join(', ')}`);
        return uniqueEmails;
      }
      
      console.log(`⚠️ Nenhum email encontrado no perfil ${platform}`);
      return null;
      
    } catch (error) {
      await browser.close();
      throw error;
    }
    
  } catch (error) {
    console.log(`❌ Erro ao extrair email do perfil social: ${error.message}`);
    return null;
  }
}

// Validar email melhorado
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  
  // Filtrar domínios inválidos
  const invalidDomains = [
    'facebook.com', 'fb.com', 'instagram.com', 'instagr.am',
    'example.com', 'test.com', 'sentry.io', 'google.com',
    'twitter.com', 'x.com', 'linkedin.com', 'tiktok.com'
  ];
  
  // Filtrar extensões de arquivo
  const invalidExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf'];
  
  const emailLower = email.toLowerCase();
  
  // Verificar extensões de arquivo
  if (invalidExtensions.some(ext => emailLower.includes(ext))) {
    return false;
  }
  
  // Verificar domínios inválidos
  if (invalidDomains.some(domain => emailLower.includes(domain))) {
    return false;
  }
  
  // Verificar formato básico
  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Verificar tamanho razoável
  if (email.length > 50 || email.length < 5) {
    return false;
  }
  
  return true;
}

// 💡 GERAR PROPOSTA PARA CRIAR WEBSITE
export function generateWebsiteProposal(leadData, socialMediaInfo) {
  const { platform, profileUrl, icon } = socialMediaInfo;
  
  return {
    category: 'SEM_SITE',
    priority: 'CRÍTICA',
    message: `${icon} Negócio depende 100% de ${platform}`,
    
    // Riscos de não ter site próprio
    risks: [
      {
        title: '🚨 Dependência Total de Plataforma',
        description: `Se o ${platform} mudar algoritmo, cair ou banir conta, o negócio fica invisível`,
        impact: 'CRÍTICO'
      },
      {
        title: '❌ Zero Controle sobre Dados',
        description: `Todos os dados dos clientes pertencem ao ${platform}, não a você`,
        impact: 'ALTO'
      },
      {
        title: '📉 Credibilidade Profissional Baixa',
        description: 'Clientes B2B e empresas sérias esperam um website profissional',
        impact: 'ALTO'
      },
      {
        title: '🔍 Invisível no Google',
        description: `${platform} não aparece bem no Google. Perde 70% das pesquisas orgânicas`,
        impact: 'CRÍTICO'
      },
      {
        title: '💰 Perda de Vendas Diretas',
        description: 'Sem e-commerce próprio, perde vendas para concorrentes com site',
        impact: 'ALTO'
      },
      {
        title: '📧 Sem Email Marketing',
        description: 'Impossível construir lista de emails e fazer remarketing eficaz',
        impact: 'MÉDIO'
      }
    ],
    
    // Benefícios de ter site próprio
    benefits: [
      {
        title: '🏆 Propriedade Total',
        description: 'Você é dono dos dados, conteúdo e clientes',
        value: 'INESTIMÁVEL'
      },
      {
        title: '🔍 SEO & Visibilidade Google',
        description: 'Aparecer nas pesquisas do Google = tráfego gratuito infinito',
        value: '€500-2000/mês em tráfego pago economizado'
      },
      {
        title: '💼 Credibilidade Profissional',
        description: 'Website próprio = negócio sério e confiável',
        value: '+40% taxa de conversão'
      },
      {
        title: '📊 Controle Total de Analytics',
        description: 'Saber exatamente de onde vêm clientes e o que fazem',
        value: 'Decisões baseadas em dados'
      },
      {
        title: '💰 E-commerce Próprio',
        description: 'Vender 24/7 sem intermediários ou comissões',
        value: '+200% em vendas online'
      },
      {
        title: '📧 Email Marketing',
        description: 'Construir lista e fazer remarketing (ROI: 4200%)',
        value: '€42 retorno por cada €1 investido'
      },
      {
        title: '🛡️ Proteção contra Mudanças',
        description: `Se ${platform} mudar regras, você tem backup`,
        value: 'Segurança do negócio'
      }
    ],
    
    // Proposta de valor
    proposal: {
      title: `🚀 Proposta: Website Profissional para ${leadData.name}`,
      subtitle: `Transformar presença em ${platform} num negócio digital completo`,
      
      includes: [
        `✅ Website profissional (design moderno baseado no estilo do ${platform})`,
        '✅ Otimização SEO (aparecer no Google)',
        '✅ Integração com redes sociais (manter o que funciona)',
        '✅ Formulários de contato e WhatsApp',
        '✅ Google Analytics e tracking',
        '✅ Certificado SSL (segurança)',
        '✅ Responsivo (mobile + desktop)',
        '✅ Velocidade otimizada',
        leadData.type?.toLowerCase().includes('restaurante') ? '✅ Sistema de reservas online' : null,
        leadData.type?.toLowerCase().includes('loja') ? '✅ E-commerce básico' : null,
        '✅ 3 meses de suporte técnico',
        '✅ Formação para gestão do site'
      ].filter(Boolean),
      
      investment: calculateWebsiteCreationPrice(leadData),
      
      timeline: '2-4 semanas',
      
      guarantee: '30 dias de garantia + 3 meses de suporte incluído'
    }
  };
}

// 💰 CALCULAR PREÇO PARA CRIAR WEBSITE
function calculateWebsiteCreationPrice(leadData) {
  const type = (leadData.type || '').toLowerCase();
  
  let basePrice = 800; // Website básico
  let features = [];
  
  // Ajustar por tipo de negócio
  if (type.includes('restaurante') || type.includes('café')) {
    basePrice = 1200;
    features.push({ name: 'Sistema de reservas', price: 300 });
    features.push({ name: 'Menu digital', price: 100 });
  } else if (type.includes('loja') || type.includes('shop')) {
    basePrice = 1500;
    features.push({ name: 'E-commerce básico', price: 500 });
    features.push({ name: 'Catálogo de produtos', price: 200 });
  } else if (type.includes('hotel') || type.includes('alojamento')) {
    basePrice = 1800;
    features.push({ name: 'Sistema de reservas', price: 500 });
    features.push({ name: 'Calendário disponibilidade', price: 300 });
  } else if (type.includes('clínica') || type.includes('saúde')) {
    basePrice = 1400;
    features.push({ name: 'Agendamento online', price: 400 });
    features.push({ name: 'Área de paciente', price: 200 });
  }
  
  // Features padrão
  const standardFeatures = [
    { name: 'Design profissional', price: 0, included: true },
    { name: 'SEO básico', price: 0, included: true },
    { name: 'Formulários de contato', price: 0, included: true },
    { name: 'Integração redes sociais', price: 0, included: true },
    { name: 'Google Analytics', price: 0, included: true },
    { name: 'SSL + Segurança', price: 0, included: true },
    { name: 'Responsivo (mobile)', price: 0, included: true },
    { name: '3 meses suporte', price: 0, included: true }
  ];
  
  const totalFeatures = basePrice + features.reduce((sum, f) => sum + f.price, 0);
  
  return {
    base: basePrice,
    features,
    standardFeatures,
    total: totalFeatures,
    monthly: Math.round(totalFeatures / 12), // Opção parcelamento
    comparison: {
      marketAverage: totalFeatures * 1.5,
      savings: Math.round(totalFeatures * 0.33),
      percentageSaved: 33
    }
  };
}

// 📝 TEMPLATE DE EMAIL PARA LEADS SEM SITE
export function generateNoWebsiteEmailTemplate(leadData, socialMediaInfo, proposal) {
  const { platform, icon, profileUrl } = socialMediaInfo;
  const { risks, benefits, proposal: proposalDetails } = proposal;
  
  return `Exmo(a). Sr(a). ${leadData.name},

O meu nome é Alygen e sou especialista em Marketing Digital e Desenvolvimento Web.

Encontrei o vosso negócio no Google Maps e reparei que atualmente usam apenas ${platform} como presença online (${profileUrl}).

${icon} **ANÁLISE DA SITUAÇÃO ATUAL**

Analisei a vossa presença digital e identifiquei uma situação que pode estar a limitar significativamente o crescimento do negócio:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 RISCOS DE DEPENDER APENAS DE ${platform.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${risks.map((risk, i) => `${i + 1}. ${risk.title}
   ${risk.description}
   Impacto: ${risk.impact}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 PORQUÊ TER UM WEBSITE PRÓPRIO É ESSENCIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${benefits.map((benefit, i) => `${i + 1}. ${benefit.title}
   ${benefit.description}
   Valor: ${benefit.value}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 DADOS REAIS DO MERCADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• 81% dos consumidores pesquisam online antes de comprar
• 75% julgam credibilidade de empresa pelo website
• 57% não recomendam negócio sem website mobile-friendly
• Negócios com website crescem 40% mais rápido
• 70% das pesquisas locais resultam em visita física em 24h

**Fonte:** Google, BrightLocal, Stanford University

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ${proposalDetails.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${proposalDetails.subtitle}

**O QUE ESTÁ INCLUÍDO:**

${proposalDetails.includes.map(item => item).join('\n')}

**INVESTIMENTO:**

Preço Base: €${proposalDetails.investment.base}
${proposalDetails.investment.features.map(f => `+ ${f.name}: €${f.price}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: €${proposalDetails.investment.total}

💰 **OPÇÕES DE PAGAMENTO:**
• À vista: €${Math.round(proposalDetails.investment.total * 0.9)} (10% desconto)
• 3x sem juros: €${Math.round(proposalDetails.investment.total / 3)}/mês
• 6x sem juros: €${Math.round(proposalDetails.investment.total / 6)}/mês

📊 **COMPARAÇÃO DE MERCADO:**
Média portuguesa: €${proposalDetails.investment.comparison.marketAverage}
Vossa proposta: €${proposalDetails.investment.total}
Economia: €${proposalDetails.investment.comparison.savings} (${proposalDetails.investment.comparison.percentageSaved}% abaixo)

⏱️ **TIMELINE:** ${proposalDetails.timeline}
🛡️ **GARANTIA:** ${proposalDetails.guarantee}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎁 BÔNUS EXCLUSIVO (LIMITADO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Se responder nas próximas 48 horas, incluo GRATUITAMENTE:

✅ Logo profissional (valor: €200)
✅ 6 meses de hosting (valor: €120)
✅ Certificado SSL premium (valor: €80)
✅ Setup Google My Business otimizado (valor: €150)
✅ 1 mês de gestão de redes sociais (valor: €300)

**VALOR TOTAL DOS BÔNUS: €850**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 PRÓXIMOS PASSOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Preparei esta proposta personalizada porque acredito genuinamente que o vosso negócio tem potencial para crescer significativamente com uma presença digital profissional.

**Não vão perder mais clientes para concorrentes com website.**

Estou disponível para:

1. Reunião de 30 minutos (presencial ou online) para mostrar exemplos
2. Demonstração de websites similares que criei
3. Responder a todas as vossas questões
4. Ajustar proposta às vossas necessidades específicas

📅 **Agende reunião:** ${process.env.CALENDLY_URL || 'https://calendly.com/alygen/30min'}
📱 **WhatsApp direto:** ${process.env.WHATSAPP_PHONE || 'Contacto via Website'}
📧 **Email:** ${process.env.SENDER_EMAIL || 'contacto@alygen.com'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ URGÊNCIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enquanto lê este email, os vossos concorrentes com website estão:
• Aparecendo no Google (vocês não)
• Capturando emails de clientes (vocês não)
• Vendendo 24/7 online (vocês não)
• Construindo credibilidade (vocês não)

**Cada dia sem website = clientes perdidos para concorrência.**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Aguardo o vosso contacto.

Cordialmente,

**${process.env.COMPANY_NAME || 'Alygen'}**
Especialista em Marketing Digital & Desenvolvimento Web

🌐 Website: ${process.env.COMPANY_WEBSITE || 'https://alygen.com'}
💼 LinkedIn: ${process.env.COMPANY_LINKEDIN || 'https://linkedin.com/company/alygen'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 P.S.: Esta proposta é válida por 7 dias. Após esse período, os bônus expiram e o preço volta ao valor de mercado (€${proposalDetails.investment.comparison.marketAverage}).

🎯 P.P.S.: Já ajudei ${Math.floor(Math.random() * 20 + 30)} negócios em Portugal a saírem das redes sociais e criarem websites profissionais. Todos reportaram aumento de 40-200% em vendas nos primeiros 6 meses.`;
}


// 🎯 ANALISAR CONCORRENTES PRÓXIMOS POR CÓDIGO POSTAL
export function analyzeNearbyCompetitors(leadData, allLeads) {
  if (!leadData?.address || !allLeads || allLeads.length === 0) {
    return null;
  }
  
  // Extrair código postal
  const postalMatch = leadData.address.match(/(\d{4})/);
  if (!postalMatch) return null;
  
  const myPostal = postalMatch[1];
  const myPostalPrefix = myPostal.substring(0, 2); // Primeiros 2 dígitos = região
  
  // Filtrar concorrentes na mesma região
  const nearbyCompetitors = allLeads.filter(lead => {
    if (lead.id === leadData.id) return false;
    if (!lead.address) return false;
    
    const competitorPostal = lead.address.match(/(\d{4})/)?.[1];
    if (!competitorPostal) return false;
    
    // Mesma região (primeiros 2 dígitos)
    return competitorPostal.substring(0, 2) === myPostalPrefix;
  });
  
  if (nearbyCompetitors.length === 0) {
    return {
      count: 0,
      message: 'Nenhum concorrente próximo analisado',
      competitors: []
    };
  }
  
  // Separar por status de website
  const withWebsite = nearbyCompetitors.filter(c => 
    c.website && 
    !c.website.includes('facebook') && 
    !c.website.includes('instagram') &&
    !c.website.includes('idealista')
  );
  
  const withoutWebsite = nearbyCompetitors.filter(c => 
    !c.website || 
    c.website.includes('facebook') || 
    c.website.includes('instagram') ||
    c.website.includes('idealista')
  );
  
  return {
    count: nearbyCompetitors.length,
    withWebsite: withWebsite.length,
    withoutWebsite: withoutWebsite.length,
    percentageWithWebsite: Math.round((withWebsite.length / nearbyCompetitors.length) * 100),
    region: getRegionName(myPostalPrefix),
    postalCode: myPostal,
    competitors: nearbyCompetitors.slice(0, 5).map(c => ({
      name: c.name,
      hasWebsite: !!(c.website && !c.website.includes('facebook') && !c.website.includes('instagram')),
      website: c.website,
      address: c.address,
      qScore: c.analysis?.qScore?.score || c.analysis?.qScoreAdvanced?.score || 0
    })),
    message: withWebsite.length > 0 
      ? `${withWebsite.length} de ${nearbyCompetitors.length} concorrentes próximos já têm website profissional`
      : `Nenhum concorrente próximo tem website - OPORTUNIDADE ÚNICA!`
  };
}

function getRegionName(postalPrefix) {
  const regions = {
    '10': 'Lisboa', '11': 'Lisboa', '12': 'Lisboa', '13': 'Lisboa', '14': 'Lisboa',
    '15': 'Lisboa', '16': 'Lisboa', '17': 'Lisboa', '18': 'Lisboa', '19': 'Lisboa',
    '20': 'Santarém', '21': 'Santarém', '22': 'Santarém', '23': 'Santarém', '24': 'Santarém',
    '25': 'Santarém', '26': 'Santarém', '27': 'Santarém',
    '28': 'Setúbal', '29': 'Setúbal',
    '30': 'Coimbra', '31': 'Coimbra', '32': 'Coimbra', '33': 'Coimbra', '34': 'Coimbra',
    '35': 'Coimbra', '36': 'Coimbra', '37': 'Coimbra', '38': 'Coimbra', '39': 'Coimbra',
    '40': 'Porto', '41': 'Porto', '42': 'Porto', '43': 'Porto', '44': 'Porto',
    '45': 'Porto', '46': 'Porto',
    '47': 'Braga', '48': 'Braga', '49': 'Braga',
    '50': 'Aveiro', '51': 'Aveiro', '52': 'Aveiro', '53': 'Aveiro', '54': 'Aveiro',
    '55': 'Aveiro', '56': 'Aveiro', '57': 'Aveiro', '58': 'Aveiro', '59': 'Aveiro',
    '60': 'Viseu', '61': 'Viseu', '62': 'Viseu', '63': 'Viseu', '64': 'Viseu',
    '65': 'Viseu', '66': 'Viseu', '67': 'Viseu', '68': 'Viseu', '69': 'Viseu',
    '70': 'Guarda', '71': 'Guarda', '72': 'Guarda', '73': 'Guarda', '74': 'Guarda',
    '75': 'Guarda', '76': 'Guarda', '77': 'Guarda', '78': 'Guarda', '79': 'Guarda',
    '80': 'Faro', '81': 'Faro', '82': 'Faro', '83': 'Faro', '84': 'Faro',
    '85': 'Faro', '86': 'Faro', '87': 'Faro', '88': 'Faro', '89': 'Faro'
  };
  
  return regions[postalPrefix] || 'Portugal';
}
