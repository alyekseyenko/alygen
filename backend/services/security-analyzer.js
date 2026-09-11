import axios from 'axios';
import https from 'https';

export async function analyzeSecurity(url, htmlContent = null) {
  try {
    const urlObj = new URL(url);
    const originalProtocol = urlObj.protocol;
    
    // ✅ SEMPRE testar HTTPS primeiro, mesmo se o URL vier com HTTP
    const httpsUrl = url.replace(/^http:\/\//i, 'https://');
    const httpsUrlObj = new URL(httpsUrl);
    
    // Tentar verificar SSL com HTTPS
    let hasSSL = false;
    let sslInfo = null;
    
    try {
      sslInfo = await checkSSLCertificate(httpsUrlObj.hostname);
      
      // Tentar fazer request HEAD HTTPS apenas para confirmar conectividade
      await axios.head(httpsUrl, { 
        timeout: 5000,
        validateStatus: () => true 
      });
      
      hasSSL = sslInfo.valid;
    } catch (error) {
      // Se falhar HTTPS, confirmar que não tem SSL
      hasSSL = false;
      sslInfo = { valid: false, error: 'HTTPS não disponível' };
    }
    
    // Se não tem SSL, retornar score 0
    if (!hasSSL) {
      return {
        hasSSL: false,
        ssl: sslInfo,
        score: 0,
        critical: 'Site não usa HTTPS - CRÍTICO para segurança e SEO',
        originalProtocol: originalProtocol.replace(':', '')
      };
    }
    
    // Se tem SSL, fazer análise completa com HTTPS
    let data = htmlContent;
    let headers = {};
    if (!data) {
      const response = await axios.get(httpsUrl, { 
        timeout: 30000,
        validateStatus: () => true 
      });
      data = response.data;
      headers = response.headers;
    } else {
      // Fetch headers quickly via HEAD if we already have body
      try {
        const hRes = await axios.head(httpsUrl, { timeout: 10000, validateStatus: () => true });
        headers = hRes.headers;
      } catch (e) {}
    }
    
    const securityHeaders = {
      xFrameOptions: !!headers['x-frame-options'],
      contentSecurityPolicy: !!headers['content-security-policy'],
      strictTransportSecurity: !!headers['strict-transport-security'],
      xContentTypeOptions: !!headers['x-content-type-options'],
      xXSSProtection: !!headers['x-xss-protection'],
      referrerPolicy: !!headers['referrer-policy']
    };
    
    // Verificar Mixed Content
    const hasMixedContent = data.includes('http://') && hasSSL;
    
    // Verificar Cookies Seguros
    const setCookie = headers['set-cookie'] || [];
    const insecureCookies = setCookie.filter(c => !c.includes('Secure')).length;
    
    const score = calculateSecurityScore({
      hasSSL: hasSSL,
      sslValid: sslInfo.valid,
      ...securityHeaders,
      noMixedContent: !hasMixedContent,
      secureCookies: insecureCookies === 0
    });
    
    return {
      hasSSL: hasSSL,
      ssl: sslInfo,
      headers: securityHeaders,
      hasMixedContent,
      cookies: {
        total: setCookie.length,
        insecure: insecureCookies
      },
      score,
      issues: generateSecurityIssues({ sslInfo, securityHeaders, hasMixedContent, insecureCookies }),
      originalProtocol: originalProtocol.replace(':', ''),
      testedUrl: httpsUrl
    };
  } catch (error) {
    console.error('Security Analysis Error:', error.message);
    return { score: 0, error: error.message };
  }
}

function checkSSLCertificate(hostname) {
  return new Promise((resolve) => {
    const options = {
      host: hostname,
      port: 443,
      method: 'GET',
      rejectUnauthorized: false
    };
    
    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      
      if (cert && Object.keys(cert).length > 0) {
        const validTo = new Date(cert.valid_to);
        const daysUntilExpiry = Math.floor((validTo - new Date()) / (1000 * 60 * 60 * 24));
        
        resolve({
          valid: daysUntilExpiry > 0,
          issuer: cert.issuer?.O || 'Unknown',
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysUntilExpiry,
          subject: cert.subject?.CN || hostname
        });
      } else {
        resolve({ valid: false, error: 'No certificate found' });
      }
    });
    
    req.on('error', () => {
      resolve({ valid: false, error: 'SSL connection failed' });
    });
    
    req.end();
  });
}

function calculateSecurityScore(checks) {
  const weights = {
    hasSSL: 30,
    sslValid: 20,
    xFrameOptions: 10,
    contentSecurityPolicy: 10,
    strictTransportSecurity: 10,
    xContentTypeOptions: 5,
    xXSSProtection: 5,
    referrerPolicy: 5,
    noMixedContent: 5,
    secureCookies: 5
  };
  
  let score = 0;
  Object.keys(checks).forEach(key => {
    if (checks[key]) score += weights[key] || 0;
  });
  
  return Math.min(score, 100);
}

function generateSecurityIssues({ sslInfo, securityHeaders, hasMixedContent, insecureCookies }) {
  const issues = [];
  
  if (!sslInfo.valid) issues.push('Certificado SSL inválido ou expirado');
  if (!securityHeaders.xFrameOptions) issues.push('Vulnerável a clickjacking (falta X-Frame-Options)');
  if (!securityHeaders.contentSecurityPolicy) issues.push('Sem Content Security Policy');
  if (!securityHeaders.strictTransportSecurity) issues.push('Sem HSTS (Strict-Transport-Security)');
  if (hasMixedContent) issues.push('Mixed Content detectado (HTTP em HTTPS)');
  if (insecureCookies > 0) issues.push(`${insecureCookies} cookies sem flag Secure`);
  
  return issues;
}
