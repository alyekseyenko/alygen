import axios from 'axios';
import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);

export async function validateEmails(emails) {
  if (!emails || emails.length === 0) {
    return { validated: [], invalid: [], disposable: [] };
  }

  const results = await Promise.all(
    emails.map(email => validateSingleEmail(email))
  );

  return {
    validated: results.filter(r => r.valid).map(r => r.email),
    invalid: results.filter(r => !r.valid && !r.disposable).map(r => ({ email: r.email, reason: r.reason })),
    disposable: results.filter(r => r.disposable).map(r => r.email),
    details: results
  };
}

async function validateSingleEmail(email) {
  const result = {
    email,
    valid: false,
    disposable: false,
    catchAll: false,
    roleBased: false,
    reason: ''
  };

  // 1. Validação de formato
  const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*@[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    result.reason = 'Formato inválido';
    return result;
  }

  const [localPart, domain] = email.split('@');

  // 2. Verificar emails role-based (info@, admin@, support@)
  const roleBasedPrefixes = ['info', 'admin', 'support', 'contact', 'sales', 'hello', 'noreply', 'no-reply'];
  if (roleBasedPrefixes.includes(localPart.toLowerCase())) {
    result.roleBased = true;
    result.reason = 'Email genérico (role-based)';
  }

  // 3. Verificar domínios descartáveis
  const disposableDomains = [
    'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'mailinator.com',
    'throwaway.email', 'temp-mail.org', 'yopmail.com', 'maildrop.cc'
  ];
  
  if (disposableDomains.some(d => domain.toLowerCase().includes(d))) {
    result.disposable = true;
    result.reason = 'Email descartável';
    return result;
  }

  // 4. Verificar MX records (DNS)
  try {
    const mxRecords = await resolveMx(domain);
    
    if (!mxRecords || mxRecords.length === 0) {
      result.reason = 'Domínio sem MX records';
      return result;
    }

    // Email válido se tem MX records
    result.valid = true;
    result.mxRecords = mxRecords.length;
    result.reason = 'Email válido';

    // 5. Detectar catch-all (heurística)
    // Domínios catch-all aceitam qualquer email
    const catchAllDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    if (catchAllDomains.includes(domain.toLowerCase())) {
      result.catchAll = false; // Estes não são catch-all
    } else {
      // Para domínios corporativos, assumir que não é catch-all
      result.catchAll = false;
    }

  } catch (error) {
    result.reason = 'Domínio não existe ou sem MX records';
    return result;
  }

  return result;
}

// Enriquecer dados do email (opcional - requer APIs pagas)
export async function enrichEmail(email) {
  // Placeholder para integração futura com Hunter.io, Apollo, etc.
  return {
    email,
    name: null,
    position: null,
    company: null,
    linkedin: null,
    phone: null,
    enriched: false,
    note: 'Enriquecimento requer API paga (Hunter.io, Apollo)'
  };
}
