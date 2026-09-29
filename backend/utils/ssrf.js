import dns from 'dns/promises';
import net from 'net';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'metadata.google',
]);

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 0) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized.startsWith('fe80:') || normalized.startsWith('fc') || normalized.startsWith('fd')) {
      return true;
    }
  }
  return false;
}

/**
 * Valida URLs HTTP(S) públicas antes de Puppeteer/Playwright.
 * @returns {Promise<{ ok: true, url: URL } | { ok: false, error: string }>}
 */
export async function assertPublicHttpUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { ok: false, error: 'URL inválida' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
  } catch {
    return { ok: false, error: 'URL mal formada' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Apenas HTTP/HTTPS são permitidos' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.local')) {
    return { ok: false, error: 'Host não permitido' };
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { ok: false, error: 'Endereço IP privado não permitido' };
    }
    return { ok: true, url: parsed };
  }

  try {
    const records = await dns.lookup(hostname, { all: true });
    for (const { address } of records) {
      if (isPrivateIp(address)) {
        return { ok: false, error: 'O domínio resolve para uma rede privada' };
      }
    }
  } catch {
    return { ok: false, error: 'Não foi possível resolver o domínio' };
  }

  return { ok: true, url: parsed };
}

export default assertPublicHttpUrl;
