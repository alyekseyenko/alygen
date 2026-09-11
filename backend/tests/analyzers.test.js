import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { analyzeGDPR } from '../services/gdpr-analyzer.js';
import { normalizeUrl } from '../utils/url-helper.js';

describe('GDPR & Privacy Compliance Analyzer', () => {
  it('returns zero score for empty input or missing cheerio instance', () => {
    const result = analyzeGDPR(null, null);
    expect(result.score).toBe(0);
    expect(result.grade).toBe('F');
    expect(result.riskLevel).toBe('HIGH');
  });

  it('detects privacy policy and cookie policy links', () => {
    const sampleHtml = `
      <html>
        <body>
          <a href="/politica-de-privacidade">Política de Privacidade</a>
          <a href="/politica-de-cookies">Gestão de Cookies</a>
        </body>
      </html>
    `;
    const $ = cheerio.load(sampleHtml);
    const result = analyzeGDPR(sampleHtml, $);

    expect(result.factors.hasPrivacyPolicy).toBe(true);
    expect(result.factors.hasCookiePolicy).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  it('detects enterprise CMP consent banners like Cookiebot or OneTrust', () => {
    const sampleHtml = `
      <html>
        <head>
          <script src="https://consent.cookiebot.com/uc.js" id="Cookiebot"></script>
        </head>
        <body>
          <a href="/privacy">Privacy Policy</a>
        </body>
      </html>
    `;
    const $ = cheerio.load(sampleHtml);
    const result = analyzeGDPR(sampleHtml, $);

    expect(result.factors.hasCookieBanner).toBe(true);
    expect(result.factors.detectedConsentTools).toContain('cookiebot');
    expect(result.grade).not.toBe('F');
  });
});

describe('URL Normalizer Utility', () => {
  it('normalizes various URL formats consistently', () => {
    expect(normalizeUrl('https://www.example.com/')).toBe('example.com');
    expect(normalizeUrl('http://sub.domain.pt/path/')).toBe('sub.domain.pt/path');
    expect(normalizeUrl('   example.com   ')).toBe('example.com');
  });
});
