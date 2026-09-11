import {
  render, Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Img, Hr, Button, Link, Preview
} from '@react-email/components';
import React, { Fragment } from 'react';
const FragmentComponent = Fragment;

// ─── helpers ────────────────────────────────────────────────────────────────
const e = React.createElement;

const SENDER_NAME = process.env.SENDER_NAME || 'Consultor de Crescimento Digital';
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.SMTP_USER || 'contacto@alygen.com';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Alygen';
const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE || 'https://alygen.com';
const COMPANY_LINKEDIN = process.env.COMPANY_LINKEDIN || '';
const SENDER_ROLE = process.env.SENDER_ROLE || 'Consultor de Estratégia Digital';
const WHATSAPP_PHONE = process.env.WHATSAPP_PHONE || '';
const CALENDLY_URL = process.env.CALENDLY_URL || 'https://calendly.com/alygen/30min';
const API_HOST = process.env.API_HOST || 'http://localhost:3001';

function color(val, good, ok) {
  return val >= good ? '#10b981' : val >= ok ? '#f59e0b' : '#ef4444';
}

function whatsappUrl(clientName, website) {
  const msg = encodeURIComponent(
    `Olá! Vi a análise da presença digital (${website || clientName}) e gostaria de agendar uma breve conversa.`
  );
  return WHATSAPP_PHONE ? `https://wa.me/${WHATSAPP_PHONE}?text=${msg}` : CALENDLY_URL;
}

// ─── sub-componentes ─────────────────────────────────────────────────────────
function MetricRow(label, value, c, note) {
  return e(Row, { style: { borderBottom: '1px solid #e5e7eb' } },
    e(Column, { style: { padding: '10px 0' } },
      e(Text, { style: { margin: 0, fontSize: '14px', color: '#6b7280' } }, label)
    ),
    e(Column, { style: { padding: '10px 0', textAlign: 'right' } },
      e(Text, { style: { margin: 0, fontSize: '15px', fontWeight: '700', color: c } }, value),
      note ? e(Text, { style: { margin: 0, fontSize: '12px', color: '#9ca3af' } }, note) : null
    )
  );
}

function PixelRow(label, active) {
  return MetricRow(label, active ? '✓ Instalado' : '✗ Não instalado', active ? '#10b981' : '#ef4444');
}

function SectionTitle(title) {
  return e(Heading, { as: 'h2', style: { margin: '0 0 16px', fontSize: '17px', fontWeight: '700', color: '#111827' } }, title);
}

function Tip(text) {
  return e(Text, { style: { margin: '16px 0 0', fontSize: '13px', color: '#6b7280', lineHeight: '1.6', borderTop: '1px solid #e5e7eb', paddingTop: '12px' } }, text);
}

// ─── concorrentes locais ─────────────────────────────────────────────────────
// Extrai todas as "palavras de cidade" de um endereço (ignora números, ruas, etc.)
function extractCityTokens(address) {
  if (!address) return [];
  // Formato típico Google Maps: "Rua X 12, 1200-001 Lisboa, Portugal"
  // Queremos os segmentos após o código postal
  const parts = address.split(',').map(s => s.trim());
  const tokens = [];
  for (const part of parts) {
    // Remover código postal (ex: 1200-001)
    const clean = part.replace(/\d{4}-\d{3}/, '').trim();
    // Ignorar segmentos só com números ou muito curtos
    if (clean.length > 2 && !/^\d+$/.test(clean)) {
      tokens.push(clean.toLowerCase());
    }
  }
  return tokens;
}

function extractPostalCode(address) {
  if (!address) return null;
  const m = address.match(/(\d{4})-(\d{3})/);
  return m ? { full: m[0], prefix: m[1], suffix: m[2] } : null;
}

// Calcula score de proximidade entre dois endereços (0-3)
function proximityScore(addr1, addr2) {
  if (!addr1 || !addr2) return 0;
  const p1 = extractPostalCode(addr1);
  const p2 = extractPostalCode(addr2);
  const t1 = extractCityTokens(addr1);
  const t2 = extractCityTokens(addr2);

  // Nível 3: mesmo código postal completo (ex: 1200-001)
  if (p1 && p2 && p1.full === p2.full) return 3;

  // Nível 2: mesmo prefixo postal (ex: 1200-xxx) — mesma zona da cidade
  if (p1 && p2 && p1.prefix === p2.prefix) return 2;

  // Nível 1: cidade em comum (token match)
  const cityMatch = t1.some(t => t2.some(t2tok =>
    t2tok.includes(t) || t.includes(t2tok)
  ));
  if (cityMatch) return 1;

  // Nível 0.5: prefixo postal próximo (diferença <= 5, mesma cidade grande)
  if (p1 && p2) {
    const diff = Math.abs(parseInt(p1.prefix) - parseInt(p2.prefix));
    if (diff <= 5) return 0.5;
  }

  return 0;
}

function findCompetitors(leadData, allLeads) {
  if (!allLeads?.length || !leadData) return { competitors: [], locationLabel: null };

  const type = (leadData.type || '').toLowerCase();
  const city = (leadData.city || '').toLowerCase().trim();
  const addr = leadData.address || '';
  const postal = extractPostalCode(addr);

  // Determinar label da localização para o título
  const locationLabel = leadData.city || 'vossa zona';

  // Pontuar cada candidato
  const scored = allLeads
    .filter(l => {
      if (!l.website || l.website === leadData.website) return false;
      if (!l.name || l.name === leadData.name) return false;

      // FILTRO GEOGRÁFICO RÍGIDO: Se não for da mesma cidade ou prefixo postal próximo, descartar
      const lCity = (l.city || '').toLowerCase().trim();
      const lAddr = (l.address || '');
      const lPostal = extractPostalCode(lAddr);

      // 1. Mesmo Nome de Cidade?
      const sameCity = (city && lCity && (city.includes(lCity) || lCity.includes(city)));

      // 2. Mesmo Código Postal (Prefixo)?
      const samePostalPrefix = (postal && lPostal && postal.prefix === lPostal.prefix);

      // Se for de outro distrito/cidade completamente diferente, ignorar
      if (!sameCity && !samePostalPrefix) return false;

      return true;
    })
    .map(l => {
      const lType = (l.type || '').toLowerCase();
      const typeMatch = type && lType && (lType === type || lType.includes(type) || type.includes(lType));
      const prox = proximityScore(addr, l.address || '');

      // Score muito pesado para Prox Geográfica (mesmo CP > mesma Cidade)
      return { lead: l, total: (typeMatch ? 20 : 0) + (prox * 15) };
    })
    .sort((a, b) => b.total - a.total);

  // Apenas retornar se tivermos proximidade real (total >= 15 garante que ou é mesma cidade ou mesmo CP)
  const finalCompetitors = scored.filter(s => s.total >= 15).slice(0, 4);

  return { competitors: finalCompetitors.map(s => s.lead), locationLabel };
}
function CompetitorSection(leadData, allLeads) {
  const { competitors, locationLabel } = findCompetitors(leadData, allLeads);
  if (competitors.length === 0) return null;

  return e(Section, { style: { padding: '0 40px 32px' } },
    SectionTitle(`Competitors in your area (${locationLabel})`),
    e(Section, { style: { ...S.card, borderLeft: '4px solid #6366f1' } },
      e(Text, { style: S.cardIntro },
        `We identified ${competitors.length} competitor${competitors.length > 1 ? 's' : ''} from the same industry in your area. Online visibility can be the deciding factor in customer selection.`
      ),
      ...competitors.map(c =>
        e(Row, { style: { borderBottom: '1px solid #e5e7eb', padding: '8px 0' } },
          e(Column, { style: { verticalAlign: 'middle' } },
            e(Text, { style: { margin: 0, fontSize: '13px', fontWeight: '600', color: '#111827' } }, c.name),
            c.address ? e(Text, { style: { margin: 0, fontSize: '11px', color: '#9ca3af' } }, c.address) : null
          ),
          e(Column, { style: { width: '130px', textAlign: 'right', verticalAlign: 'middle' } },
            e(Link, {
              href: c.website.startsWith('http') ? c.website : `https://${c.website}`,
              style: { fontSize: '11px', color: '#6366f1', textDecoration: 'none' }
            }, c.website.replace(/^https?:\/\//, '').replace(/\/$/, '').substring(0, 25))
          )
        )
      ),
      Tip('Being well-positioned on Google before your competitors can make the difference between winning or losing a customer.')
    )
  );
}

// ─── certificações ─────────────────────────────────────────────────────
const ASSETS_BASE = process.env.ASSETS_BASE_URL || 'https://assets.alygen.com';
const CERTS = [
  // Plataformas
  { src: `${ASSETS_BASE}/certs/meta.png`, alt: 'Meta', h: 22 },
  { src: `${ASSETS_BASE}/certs/google.png`, alt: 'Google', h: 22 },
  { src: `${ASSETS_BASE}/certs/google-cloud.png`, alt: 'Google Cloud', h: 22 },
  { src: `${ASSETS_BASE}/certs/ibm.png`, alt: 'IBM', h: 20 },
  { src: `${ASSETS_BASE}/certs/coursera.png`, alt: 'Coursera', h: 20 },
  { src: `${ASSETS_BASE}/certs/deeplearning.png`, alt: 'DeepLearning.AI', h: 20 },
  { src: `${ASSETS_BASE}/certs/scrimba.png`, alt: 'Scrimba', h: 20 },
];

// Texto de certificações para rodapé (actualizado 2026)
const CERT_BADGES_TEXT = [
  'Generative AI Leader · Google Cloud',
  'IBM AI Product Manager',
  'Machine Learning Specialization · Stanford',
  'Professional Scrum Master™ I (PSM I)',
  'Google Advanced Data Analytics',
  'Solutions Architect & Integration Specialist',
];

function CertificationsSection() {
  return null;
}

function MockupSection(url) {
  if (!url) return null;
  return e(Section, { style: { padding: '0 40px 32px' } },
    e(Section, { style: { ...S.card, padding: '8px', backgroundColor: '#f3f4f6', textAlign: 'center' } },
      e(Img, {
        src: url,
        alt: 'Website Preview',
        width: '100%',
        style: { borderRadius: '6px', display: 'block' }
      }),
      e(Text, { style: { margin: '8px 0 0', fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' } },
        'Visualização Multi-Dispositivo (Desktop, Laptop, Mobile)')
    )
  );
}

// ─── componente principal ────────────────────────────────────────────────────
function AlygenEmail({ analysis, leadData, allLeads }) {
  const clientName = leadData?.name || leadData?.company_name || 'Exmo(a). Sr(a).';
  const {
    seo = {}, security = {}, pixelDetails = {}, coreWebVitals = {},
    qScore = {}, conversion = {}, accessibility = {}, strategicInsights = {}, aeo = {},
    qScoreAdvanced = {}
  } = analysis;

  // performanceDesktop é o campo novo; performanceScore é o campo antigo no Supabase — usar fallback
  const perf = {
    mobile: analysis.performanceMobile || 0,
    desktop: analysis.performanceDesktop || (analysis.performanceMobile > 0 ? analysis.performanceMobile : 0) || analysis.performanceScore || 0
  };
  const qVal = qScore?.score || analysis.overallScore || 0;
  const qGrade = qScore?.grade || 'N/A';
  const qColor = color(qVal, 70, 50);
  const wa = whatsappUrl(clientName, leadData?.website);

  // Benchmarking do Python
  const benchmarks = qScore?.benchmark || { city_avg: 0, category_avg: 0, status: 'neutral' };

  // Nível de Urgência do Python
  const urgency = strategicInsights?.urgency_level || 'BAIXA';
  const tone = strategicInsights?.tone || 'neutral';

  // ML Prediction (se disponível na análise)
  const mlProb = analysis.mlPrediction?.conversion_probability ?? null;

  // Google Ranking (se disponível)
  const ranking = analysis.googleRanking || {};
  const rankingLabel = ranking.ranking && ranking.ranking !== 'N/A' ? ranking.ranking : null;
  const rankingPosition = ranking.position || null;

  // Recomendação estratégica + fragilidade do Python AI
  const strategicRec = strategicInsights?.strategic_recommendation || null;
  const fragilityDetails = strategicInsights?.fragility_details || [];
  const fragilityScore = strategicInsights?.fragility_score || 0;

  // Hero Heading baseado no Tom
  const heroHeading = (() => {
    if (urgency === 'CRÍTICA') return `${clientName} — detetei sinais de abandono digital no vosso site`;
    if (benchmarks.status === 'urgent_gap') return `${clientName} — o vosso site está a perder para os vizinhos em ${leadData.city || 'Portugal'}`;

    const toneMap = {
      luxury: `${clientName} — como elevar a presença digital da vossa marca exclusiva`,
      family: `${clientName} — uma análise cuidada sobre a vossa presença digital`,
      modern: `${clientName} — os dados que mostram o futuro digital da vossa empresa`,
      professional: `${clientName} — relatório técnico e estratégico do vosso website`,
      popular: `${clientName} — como atrair mais clientes através do vosso site`
    };
    return toneMap[tone] || `${clientName} — encontrei oportunidades concretas no vosso site`;
  })();

  // Extrair valores dos Core Web Vitals
  function cwvNum(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val) || 0;
    if (typeof val === 'object') return parseFloat(val.displayValue) || val.value || val.score || 0;
    return 0;
  }
  function cwvStr(val, decimals = 1) {
    const n = cwvNum(val);
    return isNaN(n) ? '—' : n.toFixed(decimals);
  }
  const cwv = {
    lcpNum: cwvNum(coreWebVitals.lcp),
    fidNum: cwvNum(coreWebVitals.fid),
    clsNum: cwvNum(coreWebVitals.cls),
    lcpVal: cwvStr(coreWebVitals.lcp, 1),
    fidVal: cwvStr(coreWebVitals.fid, 0),
    clsVal: cwvStr(coreWebVitals.cls, 3),
  };
  const hasCWV = cwv.lcpNum > 0 || cwv.fidNum > 0;
  const criticalIssues = [
    perf.mobile < 50 && 'Performance mobile crítica',
    !security.hasSSL && 'Sem certificado SSL',
    (seo.score || 0) < 60 && 'SEO precisa de otimização',
    (pixelDetails.totalTracking || 0) < 2 && 'Ferramentas de tracking em falta',
    urgency === 'CRÍTICA' && 'Sinais de fragilidade digital detetados',
  ].filter(Boolean);

  return e(Html, { lang: 'pt' },
    e(Head, null),
    e(Preview, null, `Estratégia Digital para ${clientName} — ${Math.round(qVal)}/100`),
    e(Body, { style: S.body },
      e(Container, { style: S.container },

        // Header
        e(Section, { style: S.logoSection },
          e(Row, null,
            e(Column, { style: { verticalAlign: 'middle' } },
              e(Text, { style: { margin: '0 0 2px', fontSize: '18px', fontWeight: '900', color: '#111827', letterSpacing: '-0.03em' } }, `${COMPANY_NAME.toUpperCase()} — INTELIGÊNCIA DIGITAL`),
              e(Text, { style: { margin: 0, fontSize: '11px', color: '#6b7280', lineHeight: '1.4' } }, 'Consultoria Estratégica · Otimização Web · Automações de IA')
            )
          )
        ),

        // Hero dinâmico (Estilo Carta Corporativa de Elite)
        e(Section, { style: S.section },
          e(Heading, { style: S.h1 }, heroHeading),
          e(Text, { style: { ...S.bodyText, fontSize: '15px', color: '#111827', fontWeight: 'bold' } },
            `Dear Owner / Manager,`
          ),
          e(Text, { style: S.bodyText },
            'My name is ', e('strong', null, SENDER_NAME), ', digital growth specialist at ',
            e('strong', null, COMPANY_NAME), '. Through our Market Intelligence system, I have conducted a strategic diagnosis of the website ', e('strong', null, leadData?.website || clientName),
            ' face to the competitive landscape of your industry.'
          )
        ),

        // 🤖 VEREDICTO IA — Destaque do Agente de Escrita/Síntese
        e(Section, { style: { padding: '0 40px 24px' } },
          e(Section, { style: { backgroundColor: '#fcfcfc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' } },
            e(Text, { style: { margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#FF4F00', textTransform: 'uppercase', letterSpacing: '0.08em' } },
              '🎯 Market Intelligence & Positioning Report'
            ),
            e(Text, { style: { margin: 0, fontSize: '14.5px', color: '#1e293b', lineHeight: '1.75', fontWeight: '500' } },
              analysis.agent_intel || leadData?.agent_intel
                ? (analysis.agent_intel || leadData.agent_intel).replace(/(^"|"$)/g, '').trim()
                : `We identified that your website presents several technical vulnerabilities (especially in mobile performance) and local visibility gaps that are limiting your business reach.`
            )
          )
        ),

        // Diagnóstico Técnico Principal (Limpo, sem ruído)
        e(Section, { style: S.section },
          SectionTitle('Main Technical Diagnostics:'),
          e(Section, { style: S.card },
            MetricRow('Mobile Performance', `${perf.mobile}/100`, color(perf.mobile, 80, 50), perf.mobile < 50 ? 'Critical (traffic loss)' : 'Below optimal'),
            MetricRow('Google Visibility (SEO)', `${seo.score || 0}/100`, color(seo.score || 0, 80, 50)),
            MetricRow('Tracking Systems (Pixels)', `${pixelDetails.totalTracking || 0}/7`, color(pixelDetails.totalTracking || 0, 3, 1))
          )
        ),

        // Concorrentes Locais (FOMO Máximo)
        CompetitorSection(leadData, allLeads),

        // CTA Secção Simples e Formal
        e(Section, { style: { padding: '0 40px 40px' } },
          e(Section, { style: { ...S.ctaSection, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '12px', padding: '32px 24px' } },
            e(Text, { style: { ...S.ctaHeading, fontSize: '18px' } }, 'Can we speak for 10 minutes this week?'),
            e(Text, { style: { ...S.ctaSubtext, fontSize: '13.5px' } },
              'No obligation at all. I would like to present to you the exact action plan to fix these issues and position your business ahead of your local competitors.'
            ),
            e(Row, { style: { textAlign: 'center', marginTop: '16px' } },
              e(Column, { style: { display: 'inline-block', padding: '0 10px' } },
                e(Link, { href: wa, style: { ...S.btnPrimary, backgroundColor: '#25D366', color: '#ffffff', margin: 0, padding: '12px 24px', borderRadius: '8px' } }, 'Chat on WhatsApp')
              ),
              e(Column, { style: { display: 'inline-block', padding: '0 10px' } },
                e(Link, { href: CALENDLY_URL, style: { ...S.btnPrimary, backgroundColor: '#FF4F00', color: '#ffffff', margin: 0, padding: '12px 24px', borderRadius: '8px' } }, 'Schedule a Meeting (30 min)')
              )
            )
          )
        ),

        // P.S. (Gatilho mental extra)
        e(Section, { style: { padding: '0 40px 24px' } },
          e(Text, { style: { margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.7', borderTop: '1px solid #e5e7eb', paddingTop: '20px' } },
            e('strong', null, 'P.S. — '),
            `Since we analyzed your business through Alygen's audit system, if you book your session this week, I will include the complete setup and optimization of your Google Business Profile (Google Maps) at no additional cost (a standard retail value of €200).`
          )
        ),

        // Certificações (Mantidas em formato limpo no rodapé)
        CertificationsSection(),

        // Footer
        e(Section, { style: S.footer },
          e(Row, null,
            e(Column, { style: { verticalAlign: 'middle', paddingLeft: '8px' } },
              e(Text, { style: S.footerName }, SENDER_NAME),
              e(Text, { style: S.footerRole }, `${SENDER_ROLE} · ${COMPANY_NAME}`),
              e(Text, { style: S.footerContact },
                `${SENDER_EMAIL}  ·  `,
                e(Link, { href: COMPANY_WEBSITE, style: S.link }, COMPANY_NAME),
                COMPANY_LINKEDIN ? '  ·  ' : null,
                COMPANY_LINKEDIN ? e(Link, { href: COMPANY_LINKEDIN, style: S.link }, 'LinkedIn') : null
              )
            )
          )
        ),

        // EU Compliance & Opt-Out Footer (RGPD Art. 6 & Lei 41/2004)
        e(Section, { style: { padding: '16px 40px 24px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' } },
          e(Text, { style: { margin: '0 0 6px', fontSize: '11px', color: '#9ca3af', lineHeight: '1.5', textAlign: 'center' } },
            'Legitimate B2B communication based on legitimate interest for technology diagnostics and analytics under the General Data Protection Regulation (GDPR - EU 2016/679) and Law No. 41/2004.'
          ),
          e(Text, { style: { margin: 0, fontSize: '11px', color: '#9ca3af', textAlign: 'center' } },
            e(Link, { href: `${API_HOST}/api/unsubscribe?email=${encodeURIComponent(leadData?.client_email || leadData?.email || '')}`, style: { color: '#6b7280', textDecoration: 'underline' } }, 'Unsubscribe (Opt-out)'),
            ' · ',
            e(Link, { href: `${COMPANY_WEBSITE}/privacy`, style: { color: '#6b7280', textDecoration: 'underline' } }, 'Privacy Policy & Data Protection')
          )
        )
      )
    )
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────
const S = {
  body: { backgroundColor: '#f3f4f6', margin: 0, padding: '24px 0', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
  container: { backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '600px', margin: '0 auto', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  logoSection: { padding: '20px 40px', borderBottom: '1px solid #f3f4f6' },
  skillsSection: { padding: '28px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px' },
  skillsTitle: { margin: '0 0 20px', fontSize: '13px', fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.08em' },
  skillsCol: { width: '50%', paddingRight: '16px', verticalAlign: 'top', paddingBottom: '16px' },
  skillsCat: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.06em' },
  skillsTags: { margin: 0, fontSize: '11px', color: '#6b7280', lineHeight: '1.6' },
  section: { padding: '0 40px 32px' },
  h1: { margin: '32px 0 16px', fontSize: '22px', fontWeight: '700', color: '#111827', lineHeight: '1.3' },
  bodyText: { margin: '0 0 12px', fontSize: '15px', color: '#374151', lineHeight: '1.7' },
  card: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '20px' },
  cardIntro: { margin: '0 0 16px', fontSize: '14px', color: '#374151', lineHeight: '1.6' },
  scoreLabel: { margin: '0 0 4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' },
  scoreValue: { margin: '0 0 16px', fontSize: '48px', fontWeight: '800', lineHeight: '1' },
  scoreMax: { fontSize: '20px', color: '#9ca3af', fontWeight: '400' },
  alertBox: { backgroundColor: '#fef2f2', borderLeft: '3px solid #ef4444', padding: '12px 16px', borderRadius: '6px', margin: '8px 0 12px' },
  alertText: { margin: '0 0 10px', fontSize: '13px', color: '#991b1b', lineHeight: '1.5' },
  subNote: { margin: '-4px 0 8px', fontSize: '12px', color: '#9ca3af' },
  bulletRed: { margin: '0 0 8px', fontSize: '14px', color: '#374151', paddingLeft: '8px' },
  ctaItem: { borderLeft: '3px solid', padding: '10px 14px', borderRadius: '4px', backgroundColor: '#ffffff', marginBottom: '8px' },
  ctaText: { margin: '0 0 4px', fontSize: '14px', fontWeight: '600', color: '#111827' },
  ctaMeta: { margin: 0, fontSize: '12px', color: '#6b7280' },
  opportunityCard: { backgroundColor: '#ecfdf5', borderRadius: '10px', padding: '20px', borderLeft: '4px solid #10b981' },
  opportunityIntro: { margin: '0 0 16px', fontSize: '14px', color: '#065f46', lineHeight: '1.6' },
  opportunityItem: { margin: '0 0 12px', fontSize: '14px', color: '#065f46', lineHeight: '1.6', paddingLeft: '16px' },
  checkItem: { margin: '0 0 8px', fontSize: '15px', color: '#374151', paddingLeft: '8px' },
  ctaSection: { padding: '32px', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)', borderRadius: '12px', textAlign: 'center' },
  ctaHeading: { margin: '0 0 12px', fontSize: '20px', fontWeight: '700', color: '#ffffff', lineHeight: '1.3' },
  ctaSubtext: { margin: '0 0 20px', fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6' },
  ctaBadges: { margin: '0 0 24px', textAlign: 'center' },
  ctaBadge: { display: 'block', margin: '0 auto 8px', padding: '5px 14px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.85)', fontWeight: '500', textAlign: 'center' },
  certsSection: { padding: '20px 24px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', textAlign: 'center' },
  certsLabel: { margin: '0 0 16px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' },
  footer: { padding: '24px 40px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' },
  footerName: { margin: '0 0 2px', fontSize: '15px', fontWeight: '700', color: '#111827' },
  footerRole: { margin: '0 0 12px', fontSize: '13px', color: '#6b7280' },
  footerContact: { margin: 0, fontSize: '13px', color: '#6b7280' },
  link: { color: '#6366f1', textDecoration: 'none' },
  btnPrimary: { backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '8px', padding: '12px 20px', fontSize: '14px', fontWeight: '700', textDecoration: 'none', display: 'inline-block', marginTop: '16px', textAlign: 'center' },
  btnOrange: { backgroundColor: '#f97316', color: '#ffffff', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' },
  btnOutline: { backgroundColor: 'transparent', color: '#25D366', border: '2px solid #25D366', borderRadius: '8px', padding: '10px 22px', fontSize: '14px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' },
  btnWhatsapp: { backgroundColor: '#ffffff', color: '#128C7E', borderRadius: '8px', padding: '14px 24px', fontSize: '16px', fontWeight: '800', textDecoration: 'none', display: 'inline-block', border: '1px solid #e5e7eb' },
};

// ─── exports públicos ─────────────────────────────────────────────────────────
export async function generateEmailTemplate(analysis, leadData, allLeads = []) {
  const clientName = leadData?.name || leadData?.company_name || 'Exmo(a). Sr(a).';

  if (analysis.category === 'SEM_SITE' || analysis.isSocialMediaOnly) {
    return await generateNoWebsiteEmail(analysis, leadData, clientName, allLeads);
  }

  const html = await render(e(AlygenEmail, { analysis, leadData, allLeads }));

  return {
    subject: (() => {
      const issues = [
        (analysis.performanceMobile || 0) < 50 && 'performance',
        !analysis.security?.hasSSL && 'ssl',
        (analysis.seo?.score || 0) < 60 && 'seo',
        (analysis.pixelDetails?.totalTracking || 0) < 2 && 'tracking',
      ].filter(Boolean);
      const name = leadData?.name || leadData?.company_name || clientName;
      const site = leadData?.website || 'vosso website';
      if (issues.length >= 3) return `${name} — encontrei ${issues.length} problemas no vosso website`;
      if ((analysis.performanceMobile || 0) < 50) return `${name} — o vosso site está a perder visitantes mobile`;
      return `${name} — análise do ${site} (resultados)`;
    })(),
    html,
    text: generatePlainText(analysis, clientName),
  };
}

function NoWebsiteEmail({ analysis, leadData, clientName, allLeads }) {
  const platform = analysis.socialMediaInfo?.platform || 'rede social';
  const wa = WHATSAPP_PHONE
    ? `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(`Olá! Vi a análise da presença digital (${clientName}) e gostaria de saber mais sobre a criação de um website.`)}`
    : CALENDLY_URL;

  return e(Html, { lang: 'pt' },
    e(Head, null),
    e(Preview, null, `Oportunidade de Crescimento Digital — ${clientName}`),
    e(Body, { style: S.body },
      e(Container, { style: S.container },

        // Header
        e(Section, { style: S.logoSection },
          e(Row, null,
            e(Column, { style: { verticalAlign: 'middle' } },
              e(Text, { style: { margin: '0 0 2px', fontSize: '18px', fontWeight: '900', color: '#111827', letterSpacing: '-0.03em' } }, `${COMPANY_NAME.toUpperCase()} — INTELIGÊNCIA DIGITAL`),
              e(Text, { style: { margin: 0, fontSize: '11px', color: '#6b7280', lineHeight: '1.4' } }, 'Consultoria Estratégica · Otimização Web · Automações de IA')
            )
          )
        ),

        // Hero
        e(Section, { style: S.section },
          e(Heading, { style: S.h1 }, `${clientName} — oportunidade de crescimento digital`),
          e(Text, { style: S.bodyText },
            'O meu nome é ', e('strong', null, SENDER_NAME), ', da equipa de estratégia digital da ',
            e('strong', null, COMPANY_NAME), '. Ao analisar a vossa empresa, reparei que a vossa presença digital está atualmente centralizada apenas no ',
            e('strong', null, platform), '.'
          ),
          e(Text, { style: S.bodyText },
            'Enquanto lê este email, potenciais clientes estão a pesquisar no Google pelos vossos serviços — e a encontrar os vossos concorrentes diretos.'
          )
        ),

        // Concorrentes locais — ANTES das oportunidades para criar FOMO
        CompetitorSection(leadData, allLeads),

        // O que está a perder
        e(Section, { style: S.section },
          SectionTitle('O que acontece sem presença web própria:'),
          e(Section, { style: { ...S.card, borderLeft: '4px solid #ef4444' } },
            e(Text, { style: { ...S.cardIntro, color: '#374151' } },
              `O ${platform} é uma ferramenta útil — mas não é um ativo vosso. A plataforma pode mudar as regras, reduzir o alcance ou desaparecer.`
            ),
            e(Text, { style: S.bulletRed }, '• Clientes que pesquisam no Google não encontram o vosso negócio'),
            e(Text, { style: S.bulletRed }, '• Sem website, não há como captar contactos fora das redes sociais'),
            e(Text, { style: S.bulletRed }, '• Cada euro gasto em publicidade não tem onde aterrar — sem página própria, o retorno é muito menor'),
            e(Text, { style: S.bulletRed }, `• Dependência total do ${platform} — qualquer alteração na plataforma afeta diretamente o negócio`),
            Tip('Um website profissional é o único ativo digital que a vossa empresa controla a 100% — independente de qualquer rede social.')
          )
        ),

        // O que um website resolve
        e(Section, { style: S.section },
          SectionTitle('O que muda com um website profissional:'),
          e(Section, { style: S.opportunityCard },
            e(Text, { style: S.opportunityIntro }, 'Com uma presença web estruturada, a vossa empresa passa a:'),
            e(Text, { style: S.opportunityItem }, '1. Aparecer no Google quando potenciais clientes pesquisam pelos vossos serviços — de forma orgânica, sem pagar por cada clique'),
            e(Text, { style: S.opportunityItem }, '2. Transmitir credibilidade desde o primeiro contacto — 75% das pessoas avalia a credibilidade de uma empresa pelo website'),
            e(Text, { style: S.opportunityItem }, '3. Captar contactos e pedidos de orçamento automaticamente, 24 horas por dia, mesmo quando estão fechados'),
            e(Text, { style: S.opportunityItem }, '4. Medir o retorno de cada euro investido em publicidade — saber o que funciona e o que não funciona'),
            e(Text, { style: S.opportunityItem }, '5. Construir um ativo digital que valoriza com o tempo, independente de qualquer rede social')
          )
        ),

        // O que a Alygen oferece
        e(Section, { style: S.section },
          SectionTitle(`Como a ${COMPANY_NAME} pode ajudar:`),
          e(Text, { style: S.bodyText }, 'Desenvolvemos a solução completa — do design ao lançamento — adaptada ao vosso setor:'),
          e(Text, { style: S.checkItem }, '✓ Website profissional — design moderno, rápido e otimizado para mobile'),
          e(Text, { style: S.checkItem }, '✓ SEO técnico — para aparecer nas pesquisas relevantes do Google desde o primeiro dia'),
          e(Text, { style: S.checkItem }, '✓ Integração de tracking — Meta Pixel, Google Analytics, Google Ads'),
          e(Text, { style: S.checkItem }, '✓ Formulários e captação de leads — pedidos de orçamento automáticos'),
          e(Text, { style: S.checkItem }, '✓ Formação incluída — ficam a saber gerir o site de forma autónoma'),
          e(Text, { style: { ...S.bodyText, marginTop: '16px', color: '#6b7280', fontSize: '13px' } },
            'Timeline: 3 a 4 semanas  |  Suporte: 30 dias incluído  |  Sem custos escondidos')
        ),

        // CTA
        e(Section, { style: { padding: '0 40px 40px' } },
          e(Section, { style: S.ctaSection },
            e(Text, { style: S.ctaHeading }, 'Posso enviar-vos um plano de ação para o vosso negócio?'),
            e(Text, { style: S.ctaSubtext },
              'Sem compromisso. Preparo um documento com o que seria possível fazer especificamente para a vossa empresa — o que incluiria, quanto tempo levaria e o que poderia mudar.'
            ),
            e(Row, { style: { marginBottom: '20px' } },
              e(Column, { style: { textAlign: 'center' } },
                e(Text, { style: S.ctaBadge }, 'Plano de ação gratuito'),
                e(Text, { style: S.ctaBadge }, 'Resposta em menos de 24h'),
                e(Text, { style: S.ctaBadge }, 'Sem compromisso')
              )
            ),
            e(Link, { href: wa, style: S.btnWhatsapp }, 'Falar no WhatsApp'),
            e(Text, { style: { margin: '15px 0 5px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' } }, 'Ou se preferir agendar:'),
            e(Link, { href: CALENDLY_URL, style: { ...S.btnPrimary, margin: 0, width: '100%', textAlign: 'center' } }, 'Agendar Reunião (30 min)')

          )),

        // P.S.
        e(Section, { style: { padding: '0 40px 24px' } },
          e(Text, { style: { margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '1.7', borderTop: '1px solid #e5e7eb', paddingTop: '20px' } },
            e('strong', null, 'P.S. — '),
            `Para projetos confirmados até ${(() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' }); })()}, incluo sem custo adicional o setup completo do Google Business Profile (a vossa empresa aparece no Google Maps imediatamente) e a configuração do Google Analytics 4. Normalmente cobro €200 por este setup em separado. É só responder a este email.`
          )
        ),

        // Skills
        e(Section, { style: { padding: '0 40px 32px' } },
          e(Section, { style: S.skillsSection },
            e(Text, { style: S.skillsTitle }, `O que a ${COMPANY_NAME} faz por si`),
            e(Row, null,
              e(Column, { style: S.skillsCol },
                e(Text, { style: S.skillsCat }, 'Consultoria de IA & Estratégia'),
                e(Text, { style: S.skillsTags }, 'AI Strategy · LLM Integration · Digital Transformation · AI Solutions')
              ),
              e(Column, { style: S.skillsCol },
                e(Text, { style: S.skillsCat }, 'Automação de Processos'),
                e(Text, { style: S.skillsTags }, 'n8n · Make · Python Scripts · API Integrations · CRM Sync')
              )
            ),
            e(Row, null,
              e(Column, { style: S.skillsCol },
                e(Text, { style: S.skillsCat }, 'Engenharia de Software & Arquitetura'),
                e(Text, { style: S.skillsTags }, 'React · Node.js · REST APIs · SQL/NoSQL · Sistemas Escaláveis')
              ),
              e(Column, { style: S.skillsCol },
                e(Text, { style: S.skillsCat }, 'Otimização Digital & SEO'),
                e(Text, { style: S.skillsTags }, 'Technical SEO · GA4 · Meta Pixel · Otimização de Conversão')
              )
            )
          )),

        // Certificações
        CertificationsSection(),

        // Footer
        e(Section, { style: S.footer },
          e(Row, null,
            e(Column, { style: { verticalAlign: 'middle', paddingLeft: '8px' } },
              e(Text, { style: S.footerName }, SENDER_NAME),
              e(Text, { style: S.footerRole }, `${SENDER_ROLE} · ${COMPANY_NAME}`),
              e(Text, { style: S.footerContact },
                `${SENDER_EMAIL}  ·  `,
                e(Link, { href: COMPANY_WEBSITE, style: S.link }, COMPANY_NAME),
                COMPANY_LINKEDIN ? '  ·  ' : null,
                COMPANY_LINKEDIN ? e(Link, { href: COMPANY_LINKEDIN, style: S.link }, 'LinkedIn') : null
              )
            )
          )
        ),

        // EU Compliance & Opt-Out Footer
        e(Section, { style: { padding: '16px 40px 24px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' } },
          e(Text, { style: { margin: '0 0 6px', fontSize: '11px', color: '#9ca3af', lineHeight: '1.5', textAlign: 'center' } },
            'Comunicação B2B legítima com base no interesse legítimo para diagnóstico e análise tecnológica nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD - UE 2016/679) e da Lei n.º 41/2004.'
          ),
          e(Text, { style: { margin: 0, fontSize: '11px', color: '#9ca3af', textAlign: 'center' } },
            e(Link, { href: `${API_HOST}/api/unsubscribe?email=${encodeURIComponent(leadData?.client_email || leadData?.email || '')}`, style: { color: '#6b7280', textDecoration: 'underline' } }, 'Cancelar subscrição (Opt-out)'),
            ' · ',
            e(Link, { href: `${COMPANY_WEBSITE}/privacy`, style: { color: '#6b7280', textDecoration: 'underline' } }, 'Política de Privacidade e Proteção de Dados')
          )
        )
      )
    )
  );
}

async function generateNoWebsiteEmail(analysis, leadData, clientName, allLeads = []) {
  const platform = analysis.socialMediaInfo?.platform || 'rede social';
  const html = await render(e(NoWebsiteEmail, { analysis, leadData, clientName, allLeads }));
  return {
    subject: `${clientName} — os vossos concorrentes já aparecem no Google`,
    html,
    text: `Olá ${clientName},\n\nReparei que a vossa presença digital está apenas no ${platform}. Posso ajudar a criar um website profissional.\n\n${SENDER_NAME} — ${COMPANY_NAME}\n${SENDER_EMAIL}`,
  };
}

function MeetingConfirmationEmail({ name, time, eventName, location, isReschedule = false }) {
  const wa = WHATSAPP_PHONE
    ? `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(`Olá! Recebi a confirmação da reunião para ${time}. Até breve!`)}`
    : CALENDLY_URL;

  const services = [
    { name: 'Web Design Elite', desc: 'Websites profissionais de alto desempenho e conversão' },
    { name: 'SEO & Visibilidade', desc: 'Posicionamento nos motores de busca e tráfego orgânico' },
    { name: 'Automação com Inteligência Artificial', desc: 'Processos automáticos, CRM e comunicação inteligente' },
    { name: 'Marketing Digital & Paid Ads', desc: 'Campanhas Google, Meta e estratégias de aquisição' },
    { name: 'Análise e Diagnóstico Digital', desc: 'Relatório completo com métricas, SEO e performance' },
  ];

  return e(Html, { lang: 'pt' },
    e(Head, null),
    e(Preview, null, isReschedule
      ? `Proposta de reagendamento — Consultoria ${COMPANY_NAME} com ${name}`
      : `Confirmação de reunião — Consultoria ${COMPANY_NAME} com ${name}`
    ),
    e(Body, { style: S.body },
      e(Container, { style: S.container },

        // Header
        e(Section, { style: S.logoSection },
          e(Row, null,
            e(Column, { style: { verticalAlign: 'middle' } },
              e(Text, { style: { margin: '0 0 2px', fontSize: '18px', fontWeight: '900', color: '#111827', letterSpacing: '-0.03em' } }, `${COMPANY_NAME.toUpperCase()} — CONSULTORIA DIGITAL`),
              e(Text, { style: { margin: 0, fontSize: '11px', color: '#6b7280', lineHeight: '1.4' } }, 'Automação AI · SEO · Web Design Elite')
            )
          )
        ),

        // Hero
        e(Section, { style: { ...S.section, paddingTop: '40px', paddingBottom: '24px' } },
          e(Heading, { style: { ...S.h1, margin: '0 0 16px' } },
            isReschedule ? 'Pedido de Reagendamento' : 'Reuniao Confirmada'
          ),
          e(Text, { style: { ...S.bodyText, fontSize: '16px', lineHeight: '26px' } },
            isReschedule
              ? `Caro/a ${name},\n\nInfelizmente, e por motivos imprevistos, não me será possível estar presente na sessao inicialmente agendada para ${time}. Peço a vossa compreensao e apresento as minhas sinceras desculpas por qualquer inconveniente causado.\n\nGostaria de propor um novo agendamento, com total disponibilidade e dedicacao.\n\nPor favor, escolha a data e hora que melhor se adapte à vossa agenda:`
              : `Caro/a ${name},\n\nÉ com muito agrado que confirmo a nossa sessao de consultoria estratégica digital agendada para ${time}.\n\nEste encontro foi reservado exclusivamente para si. Aguardo com grande expectativa a oportunidade de analisar a vossa presenca digital e partilhar estratégias que poderão impactar positivamente o vosso negócio.`
          )
        ),

        // Detalhes da Reunião
        e(Section, { style: { padding: '0 40px 24px' } },
          e(Section, { style: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' } },
            e(Text, { style: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' } }, 'Servico'),
            e(Text, { style: { margin: '0 0 16px', fontSize: '16px', fontWeight: '600', color: '#111827' } }, eventName),

            e(Text, { style: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' } }, 'Data e Hora'),
            e(Text, { style: { margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#FF4F00' } }, time),

            !isReschedule && location && location.startsWith('http') && e(Fragment, null,
              e(Text, { style: { margin: '0 0 4px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' } }, 'Acesso à Reuniao Virtual'),
              e(Link, { href: location, style: { fontSize: '14px', fontWeight: '600', color: '#2563eb' } }, 'Clique aqui para entrar na sala')
            )
          )
        ),

        // Bloco de Valor
        e(Section, { style: { padding: '0 40px 24px' } },
          e(Section, { style: { backgroundColor: '#fdfcfb', border: '1px solid #fed7aa', borderRadius: '12px', padding: '20px 24px' } },
            e(Text, { style: { margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.08em' } }, 'Nota de Transparência'),
            e(Text, { style: { margin: '0 0 8px', fontSize: '14px', lineHeight: '22px', color: '#374151' } },
              `Esta sessao de consultoria tem um valor comercial de €250. Por ter acedido através do nosso sistema de diagnóstico digital, os encargos foram integralmente assumidos pela ${COMPANY_NAME}.`
            ),
            e(Text, { style: { margin: 0, fontSize: '13px', lineHeight: '20px', color: '#6b7280', fontStyle: 'italic' } },
              'Caso nao consiga comparecer, agradecemos que nos informe com a máxima antecedência, permitindo-nos disponibilizar este horário a outras entidades em lista de espera.'
            )
          )
        ),

        // Servicos Alygen
        e(Section, { style: { padding: '0 40px 24px' } },
          e(Text, { style: { margin: '0 0 16px', fontSize: '13px', fontWeight: '700', color: '#111827', textTransform: 'uppercase', letterSpacing: '0.06em' } }, `O que a ${COMPANY_NAME} pode fazer pelo vosso negócio`),
          ...services.map(s =>
            e(Row, { key: s.name, style: { marginBottom: '10px' } },
              e(Column, { style: { width: '8px', paddingTop: '2px', paddingRight: '10px' } },
                e(Text, { style: { margin: 0, fontSize: '14px', color: '#FF4F00', fontWeight: '700' } }, '—')
              ),
              e(Column, null,
                e(Text, { style: { margin: '0 0 2px', fontSize: '14px', fontWeight: '700', color: '#111827' } }, s.name),
                e(Text, { style: { margin: 0, fontSize: '13px', color: '#6b7280', lineHeight: '18px' } }, s.desc)
              )
            )
          )
        ),

        // CTA
        e(Section, { style: { padding: '0 40px 40px', textAlign: 'center' } },
          isReschedule
            ? e(Button, { href: CALENDLY_URL, style: { ...S.btnPrimary, backgroundColor: '#111827' } }, 'Escolher Nova Data e Hora')
            : e(Fragment, null,
              location && location.startsWith('http')
                ? e(Button, { href: location, style: { ...S.btnPrimary, backgroundColor: '#FF4F00', color: '#ffffff', marginBottom: '16px' } }, 'Entrar na Reuniao Virtual')
                : e(Text, { style: { ...S.bodyText, marginBottom: '24px' } }, 'O link de acesso segue no convite de calendario. Em caso de dúvida, nao hesite em contactar-nos.'),
              e(Button, { href: wa, style: { ...S.btnWhatsapp, background: '#25D366', color: '#ffffff', border: 'none', display: 'block' } }, 'Contactar via WhatsApp')
            )
        ),

        // Footer
        e(Section, { style: S.footer },
          e(Row, null,
            e(Column, { style: { verticalAlign: 'middle', paddingLeft: '8px' } },
              e(Text, { style: S.footerName }, SENDER_NAME),
              e(Text, { style: S.footerRole }, `Especialista em Consultoria e Automação · ${COMPANY_NAME}`),
              e(Text, { style: { margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' } }, `Este é um email do sistema de diagnóstico ${COMPANY_NAME} CRM.`)
            )
          )
        )
      )
    )
  );
}

export async function generateMeetingConfirmationEmail(data, isReschedule = false) {
  const html = await render(e(MeetingConfirmationEmail, {
    name: data.name,
    time: data.time,
    eventName: data.eventName || 'Consultoria Estratégica Digital',
    location: data.location,
    isReschedule
  }));
  return {
    subject: isReschedule
      ? `📌 ${COMPANY_NAME} — Pedido de Reagendamento: ${data.name}`
      : `✅ ${COMPANY_NAME} — Sessao Confirmada: ${data.name}`,
    html
  };
}

export function generatePlainText(analysis, clientName) {
  const qVal = analysis.qScore?.score || analysis.overallScore || 0;
  let text = `Análise do website da ${clientName}

Pontuação Global: ${Math.round(qVal)}/100

DADOS TÉCNICOS
Velocidade Mobile : ${analysis.performanceMobile || 0}/100
SEO               : ${analysis.seo?.score || 0}/100
SSL               : ${analysis.security?.hasSSL ? 'Sim' : 'Não'}
Tracking          : ${analysis.pixelDetails?.totalTracking || 0}/7\n`;

  if (analysis.visionAnalysis && analysis.visionAnalysis.success) {
    text += `\nANÁLISE COGNITIVA & VISUAL (Google Cloud Vision AI)
Elementos Identificados: ${analysis.visionAnalysis.labels?.slice(0, 5).join(', ') || 'N/A'}
Cores Dominantes: ${analysis.visionAnalysis.colors?.join(' | ') || 'N/A'}
Associações Web: ${analysis.visionAnalysis.webEntities?.slice(0, 5).join(', ') || 'N/A'}\n`;
  }

  text += `\nPodemos conversar sobre como melhorar estes resultados?

${SENDER_NAME} — ${COMPANY_NAME}
${SENDER_EMAIL} | ${COMPANY_WEBSITE}`;

  return text;
}

export { generateEmailTemplate as generateEmailHtml };
