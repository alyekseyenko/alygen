import puppeteer from 'puppeteer';

let browserInstance = null;
let browserLaunching = null;

const LAUNCH_OPTS = {
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
};

export async function getSharedBrowser() {
  if (browserInstance) return browserInstance;
  if (!browserLaunching) {
    browserLaunching = puppeteer.launch(LAUNCH_OPTS).then((b) => {
      browserInstance = b;
      browserLaunching = null;
      return b;
    });
  }
  return browserLaunching;
}

/**
 * Render page once (networkidle) for pixel/JS-heavy detection.
 */
export async function fetchRenderedPage(url, { timeoutMs = 45_000 } = {}) {
  const browser = await getSharedBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: timeoutMs });
    const html = await page.content();
    const status = response?.status() || 0;
    return { html, status, ok: true };
  } catch (err) {
    return { html: '', status: 0, ok: false, error: err.message };
  } finally {
    await page.close().catch(() => {});
  }
}

export async function shutdownBrowserPool() {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
  }
}
