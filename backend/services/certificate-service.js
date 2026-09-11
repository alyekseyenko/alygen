import db from './local-db-service.js';
import crypto from 'crypto';

/**
 * Gerar ID único para certificado
 * Formato: ALY-YYYY-XXXXXX (ex: ALY-2024-A3F9B2)
 */
function generateCertificateId() {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ALY-${year}-${randomHex}`;
}

/**
 * Gerar certificado ALYGEN
 */
export function generateCertificate(companyName, website, qscore, qgrade, metrics) {
  const certificateId = generateCertificateId();
  const issuedAt = new Date().toISOString();
  const validUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  
  return {
    certificate_id: certificateId,
    company_name: companyName,
    website: website,
    qscore: qscore,
    qgrade: qgrade,
    metrics: metrics,
    issued_at: issuedAt,
    valid_until: validUntil,
    verification_url: `${process.env.APP_URL || process.env.COMPANY_WEBSITE || 'https://alygen.com'}/verify/${certificateId}`
  };
}

/**
 * Salvar certificado na BD Local
 */
export async function saveCertificate(certificate) {
  try {
    const metricsStr = certificate.metrics ? JSON.stringify(certificate.metrics) : null;
    const fullCertStr = JSON.stringify(certificate);

    db.prepare(`
      INSERT INTO certificates (
        certificate_id, company_name, website, qscore, qgrade, metrics, issued_at, valid_until, full_certificate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(certificate_id) DO UPDATE SET
        company_name = excluded.company_name,
        qscore = excluded.qscore,
        qgrade = excluded.qgrade,
        metrics = excluded.metrics,
        full_certificate = excluded.full_certificate,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      certificate.certificate_id,
      certificate.company_name,
      certificate.website,
      certificate.qscore,
      certificate.qgrade,
      metricsStr,
      certificate.issued_at,
      certificate.valid_until,
      fullCertStr
    );

    console.log(`✅ Certificado ${certificate.certificate_id} salvo na BD Local`);
    return { success: true, data: certificate };
  } catch (error) {
    console.error('❌ Erro ao salvar certificado local:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Buscar certificado por website na BD Local
 */
export async function getCertificate(website) {
  try {
    const row = db.prepare('SELECT * FROM certificates WHERE website = ? ORDER BY issued_at DESC LIMIT 1').get(website);
    if (!row) {
      return { success: false, error: 'Certificado não encontrado' };
    }
    return { success: true, certificate: JSON.parse(row.full_certificate) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Criar certificado de verificação ALYGEN
 */
export async function createCertificate(leadData, analysis) {
  const certificateId = generateCertificateId();
  const qScore = analysis.qScoreAdvanced?.score || analysis.qScore?.score || 0;
  const qGrade = analysis.qScoreAdvanced?.grade || analysis.qScore?.grade || 'F';
  
  const certificate = {
    id: certificateId,
    companyName: leadData.name || leadData.company_name,
    website: leadData.website || analysis.url,
    qScore: qScore,
    qGrade: qGrade,
    issuedAt: new Date().toISOString(),
    issuedBy: process.env.COMPANY_NAME ? `${process.env.COMPANY_NAME} - Digital Intelligence` : 'Alygen - Digital Intelligence',
    verificationUrl: `${process.env.APP_URL || process.env.COMPANY_WEBSITE || 'https://alygen.com'}/verify/${certificateId}`,
    
    // Métricas principais
    metrics: {
      performance: analysis.performanceMobile || 0,
      seo: analysis.seo?.score || 0,
      security: analysis.security?.score || 0,
      accessibility: analysis.accessibility?.score || 0,
      tracking: analysis.pixelDetails?.totalTracking || 0
    },
    
    // Metadata
    analysisVersion: '3.0',
    certifiedBy: process.env.CERTIFIED_BY || process.env.SENDER_NAME || 'Alygen Intelligence Team',
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 ano
  };
  
  // Salvar no Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .insert({
          certificate_id: certificateId,
          company_name: certificate.companyName,
          website: certificate.website,
          qscore: qScore,
          qgrade: qGrade,
          metrics: certificate.metrics,
          issued_at: certificate.issuedAt,
          valid_until: certificate.validUntil,
          full_certificate: certificate
        });
      
      if (error) {
        console.error('❌ Erro ao salvar certificado no Supabase:', error);
      } else {
        console.log(`✅ Certificado ${certificateId} salvo no Supabase`);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar certificado:', error);
    }
  }
  
  return certificate;
}

/**
 * Verificar certificado por ID
 */
export async function verifyCertificate(certificateId) {
  if (!supabase) {
    return { valid: false, error: 'Supabase não configurado' };
  }
  
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_id', certificateId)
      .single();
    
    if (error || !data) {
      return { valid: false, error: 'Certificado não encontrado' };
    }
    
    // Verificar se ainda é válido
    const validUntil = new Date(data.valid_until);
    const isExpired = validUntil < new Date();
    
    return {
      valid: !isExpired,
      certificate: data.full_certificate,
      issuedAt: data.issued_at,
      validUntil: data.valid_until,
      expired: isExpired
    };
  } catch (error) {
    console.error('❌ Erro ao verificar certificado:', error);
    return { valid: false, error: error.message };
  }
}

/**
 * Gerar SVG do certificado
 */
export function generateCertificateSVG(certificate) {
  const { id, companyName, qScore, qGrade, issuedAt } = certificate;
  const date = new Date(issuedAt).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  // Cor baseada no Q Score
  let scoreColor = '#ef4444'; // Vermelho
  if (qScore >= 80) scoreColor = '#10b981'; // Verde
  else if (qScore >= 60) scoreColor = '#f59e0b'; // Amarelo
  else if (qScore >= 40) scoreColor = '#fb923c'; // Laranja
  
  return `
<svg width="600" height="200" xmlns="http://www.w3.org/2000/svg">
  <!-- Fundo -->
  <rect width="600" height="200" fill="#ffffff" rx="12"/>
  <rect width="600" height="200" fill="none" stroke="#e5e7eb" stroke-width="2" rx="12"/>
  
  <!-- Borda decorativa -->
  <rect x="10" y="10" width="580" height="180" fill="none" stroke="${scoreColor}" stroke-width="1" stroke-dasharray="5,5" rx="8"/>
  
  <!-- Logo Alygen (canto superior esquerdo) -->
  <image href="${process.env.APP_URL || process.env.COMPANY_WEBSITE || 'https://alygen.com'}/logo/alygen-logo.png" x="20" y="20" width="100" height="30"/>
  
  <!-- Título -->
  <text x="300" y="50" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#111827" text-anchor="middle">
    CERTIFICADO DE VERIFICAÇÃO
  </text>
  
  <!-- Q Score (destaque) -->
  <circle cx="500" cy="100" r="50" fill="${scoreColor}" opacity="0.1"/>
  <circle cx="500" cy="100" r="45" fill="none" stroke="${scoreColor}" stroke-width="3"/>
  <text x="500" y="95" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="${scoreColor}" text-anchor="middle">
    ${qScore}
  </text>
  <text x="500" y="115" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">
    Q Score ${qGrade}
  </text>
  
  <!-- Empresa -->
  <text x="30" y="100" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
    Representado para:
  </text>
  <text x="30" y="125" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#111827">
    ${companyName}
  </text>
  
  <!-- ID do Certificado -->
  <text x="30" y="155" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">
    ID: ${id}
  </text>
  
  <!-- Data -->
  <text x="30" y="175" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">
    Emitido em ${date}
  </text>
  
  <!-- Selo de verificação -->
  <circle cx="570" cy="170" r="8" fill="${scoreColor}"/>
  <text x="570" y="174" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">
    ✓
  </text>
</svg>
  `.trim();
}

/**
 * Gerar HTML do certificado (para email)
 */
export function generateCertificateHTML(certificate) {
  const { id, companyName, qScore, qGrade, issuedAt, verificationUrl } = certificate;
  const date = new Date(issuedAt).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  // Cor baseada no Q Score
  let scoreColor = '#ef4444';
  let scoreBg = '#fef2f2';
  if (qScore >= 80) {
    scoreColor = '#10b981';
    scoreBg = '#ecfdf5';
  } else if (qScore >= 60) {
    scoreColor = '#f59e0b';
    scoreBg = '#fffbeb';
  } else if (qScore >= 40) {
    scoreColor = '#fb923c';
    scoreBg = '#fff7ed';
  }
  
  return `
<div style="background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%); border: 2px solid #e5e7eb; border-radius: 12px; padding: 30px; margin: 20px 0; position: relative; overflow: hidden;">
  <!-- Borda decorativa -->
  <div style="position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; border: 1px dashed ${scoreColor}; border-radius: 8px; opacity: 0.3;"></div>
  
  <!-- Conteúdo -->
  <div style="position: relative; z-index: 1;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${process.env.APP_URL || process.env.COMPANY_WEBSITE || 'https://alygen.com'}/logo/alygen-logo.png" alt="Alygen" style="max-width: 120px; height: auto;">
    </div>
    
    <!-- Título -->
    <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 700; text-align: center; text-transform: uppercase; letter-spacing: 1px;">
      Certificado de Verificação
    </h3>
    
    <!-- Grid: Info + Score -->
    <div style="display: grid; grid-template-columns: 1fr auto; gap: 30px; align-items: center;">
      <!-- Informações -->
      <div>
        <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px;">Representado para:</p>
        <p style="margin: 0 0 15px 0; color: #111827; font-size: 20px; font-weight: 700;">${companyName}</p>
        
        <p style="margin: 0 0 3px 0; color: #9ca3af; font-size: 12px;">ID: <strong>${id}</strong></p>
        <p style="margin: 0 0 3px 0; color: #9ca3af; font-size: 11px;">Emitido em ${date}</p>
        <p style="margin: 0; color: #9ca3af; font-size: 11px;">Válido por 1 ano</p>
      </div>
      
      <!-- Q Score Badge -->
      <div style="text-align: center;">
        <div style="width: 120px; height: 120px; border-radius: 50%; background: ${scoreBg}; border: 4px solid ${scoreColor}; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <div style="color: ${scoreColor}; font-size: 42px; font-weight: 700; line-height: 1;">${qScore}</div>
          <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Q Score ${qGrade}</div>
        </div>
      </div>
    </div>
    
    <!-- Verificação -->
    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px;">
        Certificado verificável em:
      </p>
      <a href="${verificationUrl}" style="color: ${scoreColor}; font-size: 13px; font-weight: 600; text-decoration: none;">
        ${verificationUrl}
      </a>
    </div>
    
    <!-- Selo -->
    <div style="position: absolute; bottom: 20px; right: 20px; width: 24px; height: 24px; border-radius: 50%; background: ${scoreColor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: bold;">
      ✓
    </div>
  </div>
</div>
  `.trim();
}

export default {
  generateCertificate,
  saveCertificate,
  getCertificate,
  createCertificate,
  verifyCertificate,
  generateCertificateSVG,
  generateCertificateHTML
};
