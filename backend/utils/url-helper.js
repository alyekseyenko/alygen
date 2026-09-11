/**
 * Normaliza URLs para padronização de chaves de cache, deduplicação e buscas no CRM.
 * Remove prefixos de protocolo (http://, https://), 'www.' e trailing slashes.
 *
 * @param {string} url - URL para normalização
 * @returns {string} URL normalizado em lowercase
 */
export const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  return url.toLowerCase().trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
};
