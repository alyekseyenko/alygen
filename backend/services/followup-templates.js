import nodemailer from 'nodemailer';
import { render, Html, Head, Body, Container, Section, Row, Column, Heading, Text, Img, Hr, Button, Link, Preview } from '@react-email/components';
import React from 'react';

const e = React.createElement;

const SENDER_NAME = process.env.SENDER_NAME || 'Consultor Alygen';
const SENDER_EMAIL = process.env.SENDER_EMAIL || process.env.SMTP_USER || 'contacto@alygen.com';
const COMPANY_NAME = process.env.COMPANY_NAME || 'Alygen';
const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE || 'https://alygen.com';
const COMPANY_LINKEDIN = process.env.COMPANY_LINKEDIN || 'https://linkedin.com/company/alygen';
const WHATSAPP_PHONE = process.env.WHATSAPP_PHONE || '';
const CALENDLY_URL = process.env.CALENDLY_URL || 'https://calendly.com/alygen/30min';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || `${COMPANY_NAME} Consultoria`;
const API_HOST = process.env.API_HOST || 'http://localhost:3001';

let _transporter = null;

function createTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 5,
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' }
    });
  }
  return _transporter;
}

function safeName(seq) {
  return seq?.lead_name || 'Olá';
}

function safeWebsiteLabel(seq) {
  return seq?.website || seq?.lead_name || 'o vosso projeto';
}

function whatsappUrl(seq, message) {
  const msg = encodeURIComponent(message);
  return WHATSAPP_PHONE ? `https://wa.me/${WHATSAPP_PHONE}?text=${msg}` : CALENDLY_URL;
}

// Calcular data do bónus (3 dias a partir de hoje)
function bonusDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
}

const S = {
  body: { backgroundColor: '#f3f4f6', margin: 0, padding: '24px 0', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" },
  container: { backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '600px', margin: '0 auto', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  logoSection: { padding: '20px 40px', borderBottom: '1px solid #f3f4f6' },
  section: { padding: '0 40px 28px' },
  h1: { margin: '28px 0 14px', fontSize: '20px', fontWeight: '800', color: '#111827', lineHeight: '1.3', letterSpacing: '-0.01em' },
  bodyText: { margin: '0 0 12px', fontSize: '15px', color: '#374151', lineHeight: '1.7' },
  card: { backgroundColor: '#f9fafb', borderRadius: '10px', padding: '18px', border: '1px solid #e5e7eb' },
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.02em' },
  badgeGreen: { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' },
  badgeIndigo: { backgroundColor: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' },
  ctaSection: { padding: '24px', background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)', borderRadius: '12px', textAlign: 'center' },
  ctaHeading: { margin: '0 0 10px', fontSize: '18px', fontWeight: '800', color: '#ffffff', lineHeight: '1.3' },
  ctaSubtext: { margin: '0 0 18px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' },
  btnWhatsapp: { backgroundColor: '#ffffff', color: '#128C7E', borderRadius: '8px', padding: '14px 28px', fontSize: '15px', fontWeight: '800', textDecoration: 'none', display: 'inline-block' },
  btnOutline: { backgroundColor: 'transparent', color: '#ffffff', border: '1px solid rgba(255,255,255,0.35)', borderRadius: '8px', padding: '12px 18px', fontSize: '13px', fontWeight: '700', textDecoration: 'none', display: 'inline-block' },
  footer: { padding: '22px 40px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' },
  footerName: { margin: '0 0 2px', fontSize: '14px', fontWeight: '800', color: '#111827' },
  footerRole: { margin: '0 0 10px', fontSize: '12px', color: '#6b7280' },
  footerContact: { margin: 0, fontSize: '12px', color: '#6b7280' },
  link: { color: '#6366f1', textDecoration: 'none' },
};

function FollowupEmail({ seq, day }) {
  const isNoWebsite = seq?.template === 'nowebsite';
  const name = safeName(seq);
  const websiteLabel = safeWebsiteLabel(seq);

  const bonus = isNoWebsite
    ? 'o setup do Google Business Profile + Google Analytics (€200)'
    : 'a auditoria de palavras‑chave do vosso setor (€120)';

  const primaryMsg = day === 3
    ? (isNoWebsite
      ? `Olá! Vi a vossa análise e queria perceber como seria o plano para criar um website para ${websiteLabel}.`
      : `Olá! Vi a vossa análise e queria um plano de ação para melhorar o website (${websiteLabel}).`)
    : (isNoWebsite
      ? `Olá! Antes de fechar o dossier, queria falar sobre criar um website para ${websiteLabel}.`
      : `Olá! Antes de fechar o dossier, queria falar sobre as melhorias no website (${websiteLabel}).`);

  const wa = whatsappUrl(seq, primaryMsg);

  const preview = (() => {
    if (day === 3) return isNoWebsite ? `Plano para novo website — ${name}` : `Plano de melhorias — ${name}`;
    return isNoWebsite ? `Último toque (novo website) — ${name}` : `Último toque (melhorias) — ${name}`;
  })();

  const headline = (() => {
    if (day === 3) return isNoWebsite ? 'Só para confirmar se recebeu a análise' : 'Só para confirmar se recebeu a análise';
    return isNoWebsite ? 'Vou fechar o dossier esta semana' : 'Vou fechar o dossier esta semana';
  })();

  const badge = (() => {
    if (isNoWebsite) return e(Text, { style: { ...S.badge, ...S.badgeGreen, margin: '0 0 10px' } }, 'NOVO WEBSITE');
    return e(Text, { style: { ...S.badge, ...S.badgeIndigo, margin: '0 0 10px' } }, 'MELHORIA DE WEBSITE');
  })();

  const day3Body = isNoWebsite
    ? [
        e(Text, { style: S.bodyText }, `Bom dia ${name},`),
        e(Text, { style: S.bodyText }, 'Enviei-vos uma análise há alguns dias e queria apenas confirmar se chegou bem — ou se ficou alguma questão por responder.'),
        e(Section, { style: { ...S.card, marginTop: '8px' } },
          e(Text, { style: { ...S.bodyText, margin: 0 } },
            'Se fizer sentido, posso enviar um plano de ação simples (estrutura do website + páginas recomendadas + exemplos do vosso setor) para avançarem com confiança.'
          )
        ),
        e(Text, { style: { ...S.bodyText, marginTop: '14px' } },
          'O bónus que mencionei — ', e('strong', null, bonus), ' — ainda está disponível até ', e('strong', null, bonusDeadline()), '.'
        ),
        e(Text, { style: { ...S.bodyText, marginBottom: 0 } }, 'Basta responder a este email com “Sim” e eu envio-vos os próximos passos.'),
      ]
    : [
        e(Text, { style: S.bodyText }, `Bom dia ${name},`),
        e(Text, { style: S.bodyText }, 'Enviei-vos uma análise há alguns dias e queria confirmar se chegou bem — e se faz sentido eu preparar um plano de melhorias com prioridades (as 3 ações que mais mexem no resultado).'),
        e(Section, { style: { ...S.card, marginTop: '8px' } },
          e(Text, { style: { ...S.bodyText, margin: 0 } },
            'Normalmente isto inclui: performance mobile, SEO técnico e tracking (para medir ROI).'
          )
        ),
        e(Text, { style: { ...S.bodyText, marginTop: '14px' } },
          'O bónus que mencionei — ', e('strong', null, bonus), ' — ainda está disponível até ', e('strong', null, bonusDeadline()), '.'
        ),
        e(Text, { style: { ...S.bodyText, marginBottom: 0 } }, 'Se quiserem, respondam a este email com “Plano” e envio-vos uma proposta objetiva (sem compromisso).'),
      ];

  const day7Body = isNoWebsite
    ? [
        e(Text, { style: S.bodyText }, `Bom dia ${name},`),
        e(Text, { style: S.bodyText },
          'Vou fechar o dossier da vossa empresa esta semana. Se ainda fizer sentido falar sobre ter um website próprio, este é o último toque antes de eu arquivar.'
        ),
        e(Section, { style: { ...S.card, marginTop: '8px' } },
          e(Text, { style: { ...S.bodyText, margin: 0 } },
            'Posso enviar-vos um mini‑roteiro (páginas essenciais + captação de contactos + SEO base) e 2 exemplos do vosso setor, para decidirem com segurança.'
          )
        ),
        e(Text, { style: { ...S.bodyText, marginBottom: 0 } },
          'Se não for o momento certo, sem problema — fico disponível quando precisarem.'
        ),
      ]
    : [
        e(Text, { style: S.bodyText }, `Bom dia ${name},`),
        e(Text, { style: S.bodyText },
          'Vou fechar o dossier da vossa empresa esta semana. Se quiserem o plano de ação com as melhorias de maior impacto (e estimativa de esforço), este é o último momento antes de eu arquivar.'
        ),
        e(Section, { style: { ...S.card, marginTop: '8px' } },
          e(Text, { style: { ...S.bodyText, margin: 0 } },
            'A ideia é ser simples: 3 prioridades, porquê importam, e qual o próximo passo — sem jargão.'
          )
        ),
        e(Text, { style: { ...S.bodyText, marginBottom: 0 } },
          'Caso não seja o momento certo, sem problema — fico disponível quando precisarem.'
        ),
      ];

  const body = day === 3 ? day3Body : day7Body;

  const ctaTitle = day === 3
    ? (isNoWebsite ? 'Quer que eu envie o plano para o novo website?' : 'Quer que eu envie o plano de melhorias?')
    : (isNoWebsite ? 'Quer falar 10 minutos antes de eu fechar?' : 'Quer o plano antes de eu fechar?');

  const ctaSubtitle = day === 3
    ? (isNoWebsite ? 'Sem compromisso. Envio uma estrutura clara e exemplos do vosso setor.' : 'Sem compromisso. Envio prioridades e próximos passos, de forma objetiva.')
    : (isNoWebsite ? 'Se fizer sentido, ainda envio o mini‑roteiro hoje.' : 'Se fizer sentido, ainda envio o plano hoje.');

  const ctaSecondary = day === 3 ? 'Ou responda a este email' : 'Se preferir, responda por email';

  return e(Html, { lang: 'pt' },
    e(Head, null),
    e(Preview, null, preview),
    e(Body, { style: S.body },
      e(Container, { style: S.container },

        // Header
        e(Section, { style: S.logoSection },
          e(Row, null,
            e(Column, { style: { verticalAlign: 'middle' } },
              e(Text, { style: { margin: '0 0 2px', fontSize: '15px', fontWeight: '900', color: '#111827', letterSpacing: '-0.02em' } }, `${COMPANY_NAME.toUpperCase()} — CONSULTORIA DIGITAL`),
              e(Text, { style: { margin: 0, fontSize: '11px', color: '#6b7280', lineHeight: '1.4' } }, 'Consultoria Web · SEO · Automação AI · Design Criativo')
            )
          )
        ),

        // Main
        e(Section, { style: S.section },
          e(Heading, { style: S.h1 }, headline),
          badge,
          ...body
        ),

        // CTA
        e(Section, { style: { padding: '0 40px 36px' } },
          e(Section, { style: S.ctaSection },
            e(Text, { style: S.ctaHeading }, ctaTitle),
            e(Text, { style: S.ctaSubtext }, ctaSubtitle),
            e(Button, { href: wa, style: S.btnWhatsapp }, 'Responder no WhatsApp'),
            e(Text, { style: { margin: '14px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6' } }, ctaSecondary)
          )
        ),

        e(Hr, { style: { border: 'none', borderTop: '1px solid #e5e7eb', margin: 0 } }),

        // Footer
        e(Section, { style: S.footer },
          e(Row, null,
            e(Column, { style: { verticalAlign: 'middle', paddingLeft: '8px' } },
              e(Text, { style: S.footerName }, SENDER_NAME),
              e(Text, { style: S.footerRole }, `Especialista em Consultoria e Automação · ${COMPANY_NAME}`),
              e(Text, { style: S.footerContact },
                `${SENDER_EMAIL}  ·  `,
                e(Link, { href: COMPANY_WEBSITE, style: S.link }, COMPANY_NAME),
                '  ·  ',
                e(Link, { href: COMPANY_LINKEDIN, style: S.link }, 'LinkedIn')
              )
            )
          )
        ),

        // EU Compliance Opt-out
        e(Section, { style: { padding: '14px 40px 20px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb' } },
          e(Text, { style: { margin: '0 0 4px', fontSize: '11px', color: '#9ca3af', lineHeight: '1.5', textAlign: 'center' } },
            'Comunicação B2B legítima com base no interesse legítimo para diagnóstico e análise tecnológica nos termos do Regulamento Geral sobre a Proteção de Dados (RGPD - UE 2016/679) e da Lei n.º 41/2004.'
          ),
          e(Text, { style: { margin: 0, fontSize: '11px', color: '#9ca3af', textAlign: 'center' } },
            e(Link, { href: `${API_HOST}/api/unsubscribe?email=${encodeURIComponent(seq?.email || '')}`, style: { color: '#6b7280', textDecoration: 'underline' } }, 'Cancelar subscrição (Opt-out)'),
            ' · ',
            e(Link, { href: `${COMPANY_WEBSITE}/privacy`, style: { color: '#6b7280', textDecoration: 'underline' } }, 'Política de Privacidade e Proteção de Dados')
          )
        )
      )
    )
  );
}

export async function generateFollowup1Html(seq) {
  return await render(e(FollowupEmail, { seq, day: 3 }));
}

export async function generateFollowup2Html(seq) {
  return await render(e(FollowupEmail, { seq, day: 7 }));
}

// ─── Envio ────────────────────────────────────────────────────────────────────
export async function sendFollowup1(seq) {
  const transporter = createTransporter();
  
  const htmlContent = await generateFollowup1Html(seq);
  const trackingUrl = `${process.env.API_HOST || 'http://localhost:3005'}/api/track-open/${seq.id}`;
  const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none !important;" alt="" />`;
  const finalHtml = htmlContent.replace('</body>', `${trackingPixel}</body>`);

  const info = await transporter.sendMail({
    from: `"${SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to: seq.email,
    headers: {
      'List-Unsubscribe': `<${API_HOST}/api/unsubscribe?email=${encodeURIComponent(seq.email)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    },
    subject: (() => {
      const name = safeName(seq);
      return seq?.template === 'nowebsite'
        ? `${name} — conseguiu ver a análise (novo website)?`
        : `${name} — ficou com alguma dúvida sobre a análise?`;
    })(),
    html: finalHtml
  });
  console.log(`📧 Follow-up 1 enviado para ${seq.email}: ${info.messageId}`);
  return info;
}

export async function sendFollowup2(seq) {
  const transporter = createTransporter();
  
  const htmlContent = await generateFollowup2Html(seq);
  const trackingUrl = `${process.env.API_HOST || 'http://localhost:3005'}/api/track-open/${seq.id}`;
  const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none !important;" alt="" />`;
  const finalHtml = htmlContent.replace('</body>', `${trackingPixel}</body>`);

  const info = await transporter.sendMail({
    from: `"${SMTP_FROM_NAME}" <${process.env.SMTP_USER}>`,
    to: seq.email,
    headers: {
      'List-Unsubscribe': `<${API_HOST}/api/unsubscribe?email=${encodeURIComponent(seq.email)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    },
    subject: (() => {
      const name = safeName(seq);
      return seq?.template === 'nowebsite'
        ? `${name} — vou fechar o dossier (novo website)`
        : `${name} — vou fechar o dossier esta semana`;
    })(),
    html: finalHtml
  });
  console.log(`📧 Follow-up 2 enviado para ${seq.email}: ${info.messageId}`);
  return info;
}
