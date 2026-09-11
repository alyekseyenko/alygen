import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar pasta para screenshots se não existir
const screenshotsDir = path.join(__dirname, '../../screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

export async function captureWebsiteScreenshot(url, options = {}) {
  const {
    device = 'mobile', // 'mobile' ou 'desktop'
    fullPage = false,
    quality = 80
  } = options;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Configurar viewport baseado no dispositivo
    if (device === 'mobile') {
      await page.setViewport({
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true
      });
    } else {
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1
      });
    }

    // Configurar timeout e navegação
    await page.setDefaultNavigationTimeout(30000);
    await page.setDefaultTimeout(30000);

    console.log(`📸 Capturando screenshot de: ${url} (${device})`);

    // Navegar para a URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Aguardar um pouco para garantir que tudo carregou
    await page.waitForTimeout(2000);

    // Gerar nome do arquivo
    const urlHash = Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    const timestamp = Date.now();
    const filename = `${urlHash}-${device}-${timestamp}.jpg`;
    const filepath = path.join(screenshotsDir, filename);

    // Capturar screenshot
    await page.screenshot({
      path: filepath,
      type: 'jpeg',
      quality: quality,
      fullPage: fullPage
    });

    console.log(`✅ Screenshot salvo: ${filename}`);

    // Converter para base64 para retornar
    const imageBuffer = fs.readFileSync(filepath);
    const base64Image = imageBuffer.toString('base64');

    return {
      success: true,
      filename,
      filepath,
      base64: `data:image/jpeg;base64,${base64Image}`,
      url,
      device,
      timestamp
    };

  } catch (error) {
    console.error('❌ Erro ao capturar screenshot:', error);
    return {
      success: false,
      error: error.message,
      url,
      device
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function captureMultipleScreenshots(url) {
  console.log(`📸 Capturando screenshots mobile e desktop de: ${url}`);
  
  const [mobileResult, desktopResult] = await Promise.all([
    captureWebsiteScreenshot(url, { device: 'mobile' }),
    captureWebsiteScreenshot(url, { device: 'desktop' })
  ]);

  return {
    mobile: mobileResult,
    desktop: desktopResult,
    url
  };
}

// Limpar screenshots antigos (mais de 7 dias)
export function cleanupOldScreenshots() {
  try {
    const files = fs.readdirSync(screenshotsDir);
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias
    
    let deleted = 0;
    files.forEach(file => {
      const filepath = path.join(screenshotsDir, file);
      const stats = fs.statSync(filepath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filepath);
        deleted++;
      }
    });
    
    console.log(`🧹 ${deleted} screenshots antigos removidos`);
    return { deleted };
  } catch (error) {
    console.error('❌ Erro ao limpar screenshots:', error);
    return { error: error.message };
  }
}
