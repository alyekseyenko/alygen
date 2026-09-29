import crypto from 'crypto';

function getSecret() {
  return process.env.UNSUBSCRIBE_HMAC_SECRET || process.env.ALYGEN_API_KEY || '';
}

export function createUnsubscribeToken(email) {
  const secret = getSecret();
  if (!secret || !email) return null;
  return crypto.createHmac('sha256', secret).update(email.trim().toLowerCase()).digest('hex');
}

export function verifyUnsubscribeToken(email, token) {
  const secret = getSecret();
  if (!secret) return true;
  const expected = createUnsubscribeToken(email);
  if (!expected || !token || token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function appendUnsubscribeQuery(baseUrl, email) {
  const token = createUnsubscribeToken(email);
  const params = new URLSearchParams({ email });
  if (token) params.set('token', token);
  return `${baseUrl}?${params.toString()}`;
}
