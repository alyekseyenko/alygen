import { assertPublicHttpUrl } from '../utils/ssrf.js';
import { analyzeSecurity } from './security-analyzer.js';
import { detectPixelsFromHtml } from './analyzers/pixels.js';

/**
 * Light metrics for rival URLs (SSL, tracking count) — no full audit.
 */
export async function lightCompetitorSnapshot(url) {
  try {
    const check = await assertPublicHttpUrl(url);
    if (!check.ok) return { url, error: check.error };
    const security = await analyzeSecurity(url, null, {}).catch(() => ({}));
    return {
      url,
      hasSSL: security?.hasSSL ?? null,
      securityScore: security?.score ?? null,
    };
  } catch (err) {
    return { url, error: err.message };
  }
}

export async function buildCompetitorSnapshots(internalCompetitors = [], renderedHtmlByUrl = {}) {
  const snapshots = [];
  for (const c of internalCompetitors.slice(0, 3)) {
    const rivalUrl = c.url || c.website;
    if (!rivalUrl) continue;
    const base = await lightCompetitorSnapshot(rivalUrl);
    const html = renderedHtmlByUrl[rivalUrl];
    let tracking = null;
    if (html) {
      try {
        const px = detectPixelsFromHtml(html);
        tracking = px.totalTracking;
      } catch {
        /* optional */
      }
    }
    snapshots.push({
      name: c.name || rivalUrl,
      url: rivalUrl,
      qscore: c.qscore ?? null,
      grade: c.grade ?? null,
      hasSSL: base.hasSSL,
      securityScore: base.securityScore,
      trackingCount: tracking,
    });
  }
  return snapshots;
}
