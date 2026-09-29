import { appendUnsubscribeQuery } from './unsubscribe-token.js';

const API_HOST = process.env.API_HOST || 'http://localhost:3001';

export function buildUnsubscribeUrl(email) {
  if (!email) return `${API_HOST}/api/unsubscribe`;
  return appendUnsubscribeQuery(`${API_HOST}/api/unsubscribe`, email);
}
