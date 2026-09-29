import * as cheerio from 'cheerio';
import { fetchRenderedPage } from '../browser-pool.js';

export function detectPixelsFromHtml(html) {
  if (!html) {
    return {
      facebook: false,
      ga4: false,
      gtm: false,
      linkedin: false,
      hotjar: false,
      tiktok: false,
      clarity: false,
      totalTracking: 0,
      dataQuality: 'missing',
    };
  }
  const $ = cheerio.load(html);
  const hasFacebookPixel = html.includes('fbq(') || $('script[src*="connect.facebook.net"]').length > 0;
  const fbEvents = [];
  if (hasFacebookPixel) {
    const fbMatches = html.match(/fbq\('track',\s*'([^']+)'/g) || [];
    fbMatches.forEach((match) => {
      const event = (match.match(/'([^']+)'/) || [])[1];
      if (event && !fbEvents.includes(event)) fbEvents.push(event);
    });
  }
  const hasGA4 = html.includes('gtag(') || $('script[src*="googletagmanager.com/gtag"]').length > 0;
  let ga4Id = '';
  if (hasGA4) {
    const ga4Match = html.match(/G-[A-Z0-9]+/);
    if (ga4Match) ga4Id = ga4Match[0];
  }
  const hasGTM = html.includes('googletagmanager.com/gtm.js') || html.includes('GTM-');
  let gtmId = '';
  if (hasGTM) {
    const gtmMatch = html.match(/GTM-[A-Z0-9]+/);
    if (gtmMatch) gtmId = gtmMatch[0];
  }
  const hasLinkedIn = html.includes('snap.licdn.com') || html.includes('_linkedin_partner_id');
  const hasHotjar = html.includes('hotjar.com') || html.includes('hjid');
  const hasTikTok = html.includes('analytics.tiktok.com') || html.includes('ttq.load');
  const hasClarity = html.includes('clarity.ms') || html.includes('clarity(');
  const trackingArr = [hasFacebookPixel, hasGA4, hasGTM, hasLinkedIn, hasHotjar, hasTikTok, hasClarity];
  return {
    facebook: hasFacebookPixel,
    facebookEvents: fbEvents,
    ga4: hasGA4,
    ga4MeasurementId: ga4Id,
    gtm: hasGTM,
    gtmId,
    linkedin: hasLinkedIn,
    hotjar: hasHotjar,
    tiktok: hasTikTok,
    clarity: hasClarity,
    totalTracking: trackingArr.filter(Boolean).length,
    dataQuality: 'measured',
  };
}

export async function detectPixels(url, html = null) {
  try {
    let sourceHtml = html;
    if (!sourceHtml) {
      const rendered = await fetchRenderedPage(url);
      sourceHtml = rendered.html;
      if (!rendered.ok) {
        return {
          facebook: false,
          ga4: false,
          gtm: false,
          linkedin: false,
          hotjar: false,
          tiktok: false,
          clarity: false,
          totalTracking: 0,
          dataQuality: 'missing',
        };
      }
    }
    return detectPixelsFromHtml(sourceHtml);
  } catch (error) {
    console.error('Pixel Detection Error:', error.message);
    return {
      facebook: false,
      ga4: false,
      gtm: false,
      linkedin: false,
      hotjar: false,
      tiktok: false,
      clarity: false,
      totalTracking: 0,
      dataQuality: 'missing',
    };
  }
}
