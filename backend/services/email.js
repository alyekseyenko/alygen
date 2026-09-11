import axios from 'axios';
import nodemailer from 'nodemailer';
import { generateEmailTemplate } from './email-template.js';
import { createSequence } from './email-sequences.js';
import { logContact } from './supabase-service.js';

// SMTP Connection Pooling Singleton
let _smtpTransporter = null;
let _isVerified = false;

function getSmtpTransporter() {
  if (!_smtpTransporter) {
    _smtpTransporter = nodemailer.createTransport({
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
  }
  return _smtpTransporter;
}

export async function sendEmail({ leadId, emailBody, recipient, cc, analysis, leadData, allLeads = [], customSubject, customBody, attachments = [], isHtmlOnly = false }) {
  console.log(`📧 Enviando email para: ${recipient}${cc ? ` (CC: ${cc})` : ''}`);

  let emailContent, emailSubject;

  if (isHtmlOnly) {
    emailContent = emailBody;
    emailSubject = customSubject;
  } else {
    if (!analysis || !leadData) {
      throw new Error('Análise e dados do lead são obrigatórios');
    }
    const template = await generateEmailTemplate(analysis, leadData, allLeads);
    emailContent = customBody || emailBody || template.html;
    emailSubject = customSubject || template.subject;
  }

  // PRIORIDADE: SMTP Direto (com Connection Pooling)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('➡️ Usando SMTP direto (Pooled Connection)...');
    try {
      const transporter = getSmtpTransporter();

      // Verificar conexão apenas uma vez para o pool
      if (!_isVerified) {
        await transporter.verify();
        _isVerified = true;
        console.log('✅ Conexão SMTP verificada e pool inicializado');
      }

      // 1. Criar/Obter sequência de follow-up ANTES de enviar para ter o ID do pixel
      const sequenceResult = await createSequence({
        leadId,
        leadName: leadData?.name || leadData?.company_name || recipient,
        email: recipient,
        website: leadData?.website || '',
        template: (analysis.category === 'SEM_SITE' || analysis.isSocialMediaOnly) ? 'nowebsite' : 'website',
        body: emailContent // Guardar o corpo do email principal
      });

      const apiHost = process.env.API_HOST || 'http://localhost:3001';
      const unsubscribeUrl = `${apiHost}/api/unsubscribe?email=${encodeURIComponent(recipient)}`;

      let finalHtml = emailContent;
      if (sequenceResult.success && sequenceResult.data?.id) {
        const trackingUrl = `${apiHost}/api/track-open/${sequenceResult.data.id}`;
        const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:block !important; visibility:hidden !important; opacity:0 !important; border:0 !important; margin:0 !important; padding:0 !important;" alt="" />`;

        if (emailContent.includes('</body>')) {
          finalHtml = emailContent.replace('</body>', `${trackingPixel}</body>`);
        } else {
          finalHtml = emailContent + trackingPixel;
        }
        console.log(`📍 Pixel de rastreio injetado para: ${recipient}`);
      }

      // 2. Enviar email com o pixel injetado
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME || 'Alygen - Consultoria'}" <${process.env.SMTP_USER}>`,
        to: recipient,
        subject: emailSubject,
        text: typeof template !== 'undefined' ? template.text : 'Consulte a versão HTML deste email.',
        html: finalHtml,
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
        }
      };

      if (cc) {
        mailOptions.cc = cc;
      }

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
        console.log(`📎 ${attachments.length} anexo(s) adicionado(s) ao email.`);
      }

      const info = await transporter.sendMail(mailOptions);


      console.log(`✅ Email enviado via SMTP: ${info.messageId}`);
      await logContact({
        leadName: leadData?.name,
        website: leadData?.website,
        type: 'email',
        recipient,
        message: null
      });
      return { success: true, method: 'smtp', messageId: info.messageId };
    } catch (error) {
      console.error('❌ Erro ao enviar via SMTP:', error.message);
      console.error('Detalhes:', error);
      throw new Error(`Falha no envio SMTP: ${error.message}`);
    }
  }

  // Opção 2: Via n8n Webhook (Opcional)
  if (process.env.N8N_WEBHOOK_URL) {
    console.log('➡️ Usando n8n webhook como fallback...');
    try {
      await axios.post(process.env.N8N_WEBHOOK_URL, {
        leadId,
        to: recipient,
        subject: emailSubject,
        body: emailContent,
        timestamp: new Date().toISOString()
      });
      console.log('✅ Email enviado via n8n');
      await logContact({
        leadName: leadData?.name,
        website: leadData?.website,
        type: 'email',
        recipient,
        message: null
      });
      return { success: true, method: 'n8n' };
    } catch (error) {
      console.error('❌ Erro ao enviar via n8n:', error.message);
      throw error;
    }
  }

  // Nenhuma configuração disponível
  console.error('❌ Nenhuma configuração de email encontrada!');
  console.error('Configure SMTP_HOST, SMTP_USER e SMTP_PASS no arquivo .env');
  throw new Error('SMTP não configurado. Verifique o arquivo .env');
}

// Extrair nome do cliente do email ou usar domínio
function extractClientName(email) {
  // Tentar extrair nome antes do @
  const username = email.split('@')[0];

  // Se for nome genérico (info, contact, geral), usar domínio
  const genericNames = ['info', 'contact', 'geral', 'admin', 'suporte', 'comercial', 'vendas'];

  if (genericNames.includes(username.toLowerCase())) {
    return extractDomain(email);
  }

  // Capitalizar primeira letra de cada palavra
  return username
    .split(/[._-]/) // Separar por . _ -
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Extrair domínio do email
function extractDomain(email) {
  const match = email.match(/@([^@]+)$/);
  return match ? match[1] : 'seu site';
}

// Formatar email em HTML
function formatEmailHTML(textBody) {
  // Converter texto para HTML com formatação básica
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1, h2, h3 {
      color: #2563eb;
    }
    .separator {
      border-top: 2px solid #e5e7eb;
      margin: 20px 0;
    }
    .highlight {
      background-color: #fef3c7;
      padding: 15px;
      border-left: 4px solid #f59e0b;
      margin: 15px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 0.9em;
      color: #6b7280;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <pre>${textBody}</pre>
    <div class="footer">
      <p>🚀 <strong>CRM Deals Manager</strong> - Sistema de Análise Inteligente de Leads</p>
      <p style="font-size: 0.8em; color: #9ca3af;">
        Este email foi gerado automaticamente. Para parar de receber, responda com "REMOVER".
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
