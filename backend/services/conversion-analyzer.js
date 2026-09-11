import axios from 'axios';
import * as cheerio from 'cheerio';

export async function analyzeConversion(url, html = null) {
  try {
    if (!html) {
      const { data } = await axios.get(url, { timeout: 30000 });
      html = data;
    }
    
    const $ = cheerio.load(html);
    
    const ctas = analyzeCTAs($);
    const forms = analyzeForms($);
    const contact = analyzeContactMethods($, html);
    const urgency = analyzeUrgencyElements($, html);
    const socialProof = analyzeSocialProof($, html);
    
    // Debug logs
    console.log(`📊 Conversão - CTAs: ${ctas.total}, Forms: ${forms.total}, WhatsApp: ${contact.whatsapp}, Tel Clicável: ${contact.clickablePhone}`);
    
    const score = calculateConversionScore({ ctas, forms, contact, urgency, socialProof });
    
    return {
      ctas,
      forms,
      contact,
      urgency,
      socialProof,
      score,
      recommendations: generateConversionRecommendations({ ctas, forms, contact, urgency, socialProof })
    };
  } catch (error) {
    console.error('Conversion Analysis Error:', error.message);
    return { score: 0, error: error.message };
  }
}

function analyzeCTAs($) {
  const ctaButtons = [];
  const ctaKeywords = [
    'comprar', 'buy', 'contactar', 'contact', 'solicitar', 'request',
    'orçamento', 'quote', 'agendar', 'schedule', 'começar', 'start',
    'experimentar', 'try', 'inscrever', 'subscribe', 'registar', 'register',
    'saber mais', 'learn more', 'download', 'ligar', 'call',
    'marcar', 'book', 'reservar', 'reserve', 'pedir', 'ask',
    'consulta', 'appointment', 'falar', 'speak', 'enviar', 'send'
  ];
  
  // Buscar em botões e links (mais abrangente)
  $('button, a.btn, a.button, input[type="submit"], [class*="cta"], [class*="btn"], a[class*="button"]').each((i, el) => {
    const text = $(el).text().trim().toLowerCase();
    const href = $(el).attr('href');
    
    if (text.length > 0) {
      const isCTA = ctaKeywords.some(keyword => text.includes(keyword));
      
      if (isCTA || $(el).attr('class')?.includes('cta')) {
        // Analisar posição
        const position = getElementPosition($(el));
        
        // Analisar cor (se inline)
        const style = $(el).attr('style') || '';
        const hasColor = style.includes('background') || style.includes('color');
        
        ctaButtons.push({
          text: $(el).text().trim().substring(0, 50),
          type: el.name,
          position,
          hasColor,
          href: href || null,
          classes: $(el).attr('class') || ''
        });
      }
    }
  });
  
  // Analisar qualidade dos CTAs
  const aboveFold = ctaButtons.filter(cta => cta.position === 'above-fold').length;
  const hasActionVerbs = ctaButtons.some(cta => 
    ['comprar', 'solicitar', 'agendar', 'começar', 'experimentar'].some(verb => 
      cta.text.toLowerCase().includes(verb)
    )
  );
  
  return {
    total: ctaButtons.length,
    buttons: ctaButtons.slice(0, 10), // Máximo 10
    aboveFold,
    hasActionVerbs,
    quality: ctaButtons.length >= 3 && aboveFold >= 1 && hasActionVerbs ? 'Boa' : 
             ctaButtons.length >= 1 ? 'Média' : 'Fraca'
  };
}

function getElementPosition($el) {
  // Heurística simples: elementos no topo do HTML geralmente estão "above fold"
  const html = $el.closest('html').html();
  const elementIndex = html.indexOf($el.toString());
  const totalLength = html.length;
  
  return elementIndex < totalLength * 0.3 ? 'above-fold' : 'below-fold';
}

function analyzeForms($) {
  const forms = [];
  
  // Detectar formulários tradicionais
  $('form').each((i, form) => {
    const $form = $(form);
    const inputs = $form.find('input:not([type="hidden"]), textarea, select');
    const requiredFields = $form.find('[required]').length;
    const hasEmail = $form.find('input[type="email"]').length > 0;
    const hasPhone = $form.find('input[type="tel"]').length > 0;
    const hasSubmit = $form.find('button[type="submit"], input[type="submit"]').length > 0;
    
    // Calcular fricção (quanto mais campos, maior a fricção)
    const friction = inputs.length > 8 ? 'Alta' : 
                     inputs.length > 4 ? 'Média' : 'Baixa';
    
    forms.push({
      fields: inputs.length,
      requiredFields,
      hasEmail,
      hasPhone,
      hasSubmit,
      friction,
      action: $form.attr('action') || 'N/A'
    });
  });
  
  // Detectar formulários modernos (sem <form> tag)
  const modernFormInputs = $('input[type="text"], input[type="email"], input[type="tel"], textarea').not('form input, form textarea');
  
  if (modernFormInputs.length > 0 && forms.length === 0) {
    // Provável formulário AJAX/JavaScript
    forms.push({
      fields: modernFormInputs.length,
      requiredFields: modernFormInputs.filter('[required]').length,
      hasEmail: $('input[type="email"]').length > 0,
      hasPhone: $('input[type="tel"]').length > 0,
      hasSubmit: true, // Assumir que existe
      friction: modernFormInputs.length > 8 ? 'Alta' : modernFormInputs.length > 4 ? 'Média' : 'Baixa',
      action: 'AJAX/JavaScript (sem <form>)'
    });
  }
  
  return {
    total: forms.length,
    forms: forms,
    hasForms: forms.length > 0,
    averageFriction: forms.length > 0 
      ? forms.reduce((acc, f) => acc + (f.friction === 'Alta' ? 3 : f.friction === 'Média' ? 2 : 1), 0) / forms.length
      : 0
  };
}

function analyzeContactMethods($, html) {
  const methods = {
    phone: [],
    email: [],
    whatsapp: false,
    messenger: false,
    livechat: false,
    contactForm: false
  };
  
  // Telefone
  const phoneRegex = /(\+351\s?)?(\d{3}\s?\d{3}\s?\d{3}|\d{2}\s?\d{3}\s?\d{4})/g;
  const phones = html.match(phoneRegex) || [];
  methods.phone = [...new Set(phones)].slice(0, 3);
  
  // Telefone clicável (tel:) - buscar em todo HTML
  const telLinks = $('a[href^="tel:"], a[href*="tel:"]');
  methods.clickablePhone = telLinks.length > 0;
  
  // Extrair números de telefone clicáveis
  if (methods.clickablePhone && methods.phone.length === 0) {
    telLinks.each((i, el) => {
      const href = $(el).attr('href');
      const phoneNumber = href.replace('tel:', '').replace(/\s/g, '');
      if (phoneNumber && !methods.phone.includes(phoneNumber)) {
        methods.phone.push(phoneNumber);
      }
    });
  }
  
  // Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = html.match(emailRegex) || [];
  methods.email = [...new Set(emails)].slice(0, 3);
  
  // WhatsApp
  methods.whatsapp = html.includes('wa.me') || html.includes('whatsapp') || html.includes('api.whatsapp.com');
  
  // Facebook Messenger
  methods.messenger = html.includes('facebook.com/messages') || html.includes('m.me/');
  
  // Live Chat
  methods.livechat = html.includes('tawk.to') || 
                     html.includes('intercom') || 
                     html.includes('drift') || 
                     html.includes('livechat') ||
                     html.includes('zendesk');
  
  // Formulário de contato
  methods.contactForm = $('form').length > 0;
  
  // Score de acessibilidade de contato
  const contactScore = 
    (methods.phone.length > 0 ? 20 : 0) +
    (methods.clickablePhone ? 15 : 0) +
    (methods.email.length > 0 ? 15 : 0) +
    (methods.whatsapp ? 20 : 0) +
    (methods.messenger ? 10 : 0) +
    (methods.livechat ? 15 : 0) +
    (methods.contactForm ? 15 : 0);
  
  return {
    ...methods,
    totalMethods: [
      methods.phone.length > 0,
      methods.email.length > 0,
      methods.whatsapp,
      methods.messenger,
      methods.livechat,
      methods.contactForm
    ].filter(Boolean).length,
    contactScore
  };
}

function analyzeUrgencyElements($, html) {
  const urgencyKeywords = [
    'limitado', 'limited', 'apenas hoje', 'today only', 'últimas unidades', 'last units',
    'promoção', 'promotion', 'desconto', 'discount', 'oferta', 'offer',
    'expire', 'expira', 'termina', 'ends', 'restam', 'remaining'
  ];
  
  const scarcityKeywords = [
    'apenas', 'only', 'últimos', 'last', 'esgotando', 'selling out',
    'vagas limitadas', 'limited spots', 'stock limitado', 'limited stock'
  ];
  
  const bodyText = $('body').text().toLowerCase();
  
  const hasUrgency = urgencyKeywords.some(keyword => bodyText.includes(keyword));
  const hasScarcity = scarcityKeywords.some(keyword => bodyText.includes(keyword));
  const hasCountdown = html.includes('countdown') || html.includes('timer');
  
  return {
    hasUrgency,
    hasScarcity,
    hasCountdown,
    score: (hasUrgency ? 33 : 0) + (hasScarcity ? 33 : 0) + (hasCountdown ? 34 : 0)
  };
}

function analyzeSocialProof($, html) {
  const testimonials = $('[class*="testimonial"], [class*="review"], [class*="depoimento"]').length;
  const ratings = $('[class*="rating"], [class*="star"]').length;
  
  // Buscar números de clientes
  const clientNumbers = html.match(/(\d+)\+?\s*(clientes|clients|customers)/gi) || [];
  
  // Buscar logos de clientes
  const clientLogos = $('[class*="client"], [class*="partner"], [class*="logo"]').find('img').length;
  
  // Buscar badges/certificações
  const badges = $('[class*="badge"], [class*="certificat"], [class*="award"]').length;
  
  const hasSocialProof = testimonials > 0 || ratings > 0 || clientNumbers.length > 0 || clientLogos > 0;
  
  return {
    testimonials,
    ratings,
    clientNumbers: clientNumbers.length,
    clientLogos,
    badges,
    hasSocialProof,
    score: Math.min(
      (testimonials * 20) + 
      (ratings * 15) + 
      (clientNumbers.length * 25) + 
      (clientLogos * 10) + 
      (badges * 15),
      100
    )
  };
}

function calculateConversionScore({ ctas, forms, contact, urgency, socialProof }) {
  return Math.round(
    (ctas.total > 0 ? 20 : 0) +
    (ctas.aboveFold > 0 ? 10 : 0) +
    (forms.hasForms ? 15 : 0) +
    (forms.averageFriction < 2 ? 10 : 0) +
    (contact.contactScore * 0.25) +
    (urgency.score * 0.10) +
    (socialProof.score * 0.10)
  );
}

function generateConversionRecommendations({ ctas, forms, contact, urgency, socialProof }) {
  const recommendations = [];
  
  if (ctas.total === 0) {
    recommendations.push('CRÍTICO: Adicionar CTAs claros (ex: "Solicitar Orçamento", "Contactar Agora")');
  } else if (ctas.aboveFold === 0) {
    recommendations.push('Adicionar CTA visível acima da dobra (primeira visualização)');
  }
  
  if (!forms.hasForms && !contact.whatsapp) {
    recommendations.push('Adicionar formulário de contato ou WhatsApp para facilitar conversão');
  }
  
  if (forms.averageFriction > 2) {
    recommendations.push('Reduzir campos do formulário (máximo 5 campos para aumentar conversões)');
  }
  
  if (!contact.clickablePhone && contact.phone.length > 0) {
    recommendations.push('Tornar telefone clicável (link tel:) para mobile');
  }
  
  if (!contact.whatsapp) {
    recommendations.push('Adicionar botão WhatsApp (aumenta conversões em 30-40%)');
  }
  
  if (!urgency.hasUrgency && !urgency.hasScarcity) {
    recommendations.push('Adicionar elementos de urgência/escassez (ex: "Promoção válida até...")');
  }
  
  if (!socialProof.hasSocialProof) {
    recommendations.push('Adicionar prova social (depoimentos, número de clientes, avaliações)');
  }
  
  return recommendations;
}
