import axios from 'axios';
import puppeteer from 'puppeteer';
import logger from './logger.js';

/**
 * Resilient Fetcher (Senior Tier)
 * Tries Axios first (fast), then Puppeteer (stealthy) if Axios is blocked or fails.
 */
export async function resilientFetch(url, options = {}) {
  const { 
    timeout = 15000, 
    usePuppeteerAsFallback = true,
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  } = options;

  // 1. Try Axios (Standard)
  try {
    logger.info(`🌐 Axios fetching: ${url}`);
    const response = await axios.get(url, {
      timeout,
      headers: { 
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 500 // Accept 403/404 to check if we should fallback
    });

    if (response.status === 200 && response.data && typeof response.data === 'string') {
      return { 
        html: response.data, 
        status: response.status, 
        method: 'axios',
        headers: response.headers 
      };
    }

    logger.warn(`⚠️ Axios status ${response.status} for ${url}. Triggering fallback...`);
  } catch (err) {
    logger.warn(`⚠️ Axios failed for ${url}: ${err.message}. Triggering fallback...`);
  }

  // 2. Try Puppeteer (Stealth Fallback)
  if (usePuppeteerAsFallback) {
    let browser;
    try {
      logger.info(`🕵️ Puppeteer fallback fetching: ${url}`);
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1920,1080'
        ]
      });

      const page = await browser.newPage();
      await page.setUserAgent(userAgent);
      
      // Stealth: hide puppeteer
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      });

      // Navigate
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      const html = await page.content();
      const status = 200; // Puppeteer doesn't return status easily for redirects, but 200 is typical for successful content()

      return { 
        html, 
        status, 
        method: 'puppeteer',
        headers: {} // Puppeteer headers are different, but usually not needed for cheerio
      };
    } catch (puppError) {
      logger.error(`🚨 Puppeteer also failed for ${url}: ${puppError.message}`);
      return { html: '', status: 500, error: puppError.message };
    } finally {
      if (browser) await browser.close();
    }
  }

  return { html: '', status: 500, error: 'All fetch methods failed' };
}
