import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Gera um Mockup Multi-Dispositivo Branded (V2 - Margens Corrigidas)
 * @param {string} url - URL do site
 * @param {string} leadId - ID do lead
 */
export async function generateMultiDeviceMockup(url, leadId) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        // 1. Carregar logo da Alygen
        const cleanLogoPath = path.join(__dirname, '../../logo/alygen-logo.png');
        const legacyLogoPath = path.join(__dirname, '../../logo/cropped-Vadym-Alyekseyenko-Multimedia-Graphic-Designer-logo.png');
        const activeLogoPath = fs.existsSync(cleanLogoPath) ? cleanLogoPath : legacyLogoPath;
        const logoBase64 = fs.existsSync(activeLogoPath) 
            ? `data:image/png;base64,${fs.readFileSync(activeLogoPath).toString('base64')}`
            : '';

        console.log(`📸 Capturando visões para Mockup Final (v2): ${url}`);

        // 2. CAPTURAS REAIS com escala maior
        await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const desktopImg = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 90 });

        await page.setViewport({ width: 1024, height: 768, deviceScaleFactor: 2 });
        await page.waitForTimeout(1000);
        const laptopImg = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 90 });

        await page.setViewport({ width: 430, height: 932, deviceScaleFactor: 2, isMobile: true });
        await page.waitForTimeout(1000);
        const mobileImg = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 90 });

        // 3. COMPOSIÇÃO HTML CORRIGIDA (Mais espaço e margens seguras)
        const compositeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap');
                body { 
                    margin: 0; padding: 0; background: #ffffff; 
                    width: 1400px; height: 900px; /* Alargado */
                    display: flex; flex-direction: column; justify-content: flex-start; align-items: center;
                    font-family: 'Outfit', sans-serif;
                    overflow: hidden;
                }
                
                /* BRANDING HEADER CORRIGIDO */
                .branding-header {
                    width: 1200px; /* Margem de segurança de 100px cada lado */
                    padding: 60px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 100;
                }
                .logo-container {
                    display: flex;
                    align-items: center;
                }
                .logo-alygen { 
                    height: 55px; /* Tamanho fixo generoso */
                    object-fit: contain;
                }
                
                .branding-text {
                    text-align: right;
                }
                .branding-text h2 { 
                    margin: 0; font-size: 18px; font-weight: 700; text-transform: uppercase; 
                    letter-spacing: 2px; color: #111827; 
                }
                .branding-text p { 
                    margin: 8px 0 0; font-size: 18px; font-weight: 400; color: #FF4F00;
                }

                .scene {
                    position: relative;
                    width: 1200px;
                    height: 550px;
                    margin-top: 40px;
                }

                /* MONITOR */
                .monitor {
                    position: absolute;
                    left: 20px; top: 20px;
                    width: 700px; height: 410px;
                    background: #111;
                    border-radius: 12px;
                    padding: 10px;
                    box-shadow: 0 40px 80px -20px rgba(0,0,0,0.25);
                    border: 5px solid #222;
                    z-index: 1;
                }

                /* LAPTOP */
                .laptop {
                    position: absolute;
                    left: 320px; top: 180px;
                    width: 550px; height: 350px;
                    background: #000;
                    border-radius: 15px;
                    padding: 8px;
                    box-shadow: 0 50px 100px -20px rgba(0,0,0,0.35);
                    border: 3px solid #333;
                    z-index: 5;
                }

                /* IPHONE */
                .iphone {
                    position: absolute;
                    right: 40px; top: 40px;
                    width: 220px; height: 460px;
                    background: #000;
                    border-radius: 40px;
                    padding: 10px;
                    box-shadow: 0 60px 120px -25px rgba(0,0,0,0.4), 0 0 20px rgba(255, 79, 0, 0.1);
                    border: 7px solid #111;
                    z-index: 10;
                }
                .iphone-screen { border-radius: 30px; overflow: hidden; height: 100%; width: 100%; }

                .screen {
                    width: 100%; height: 100%;
                    background: #f9fafb;
                    overflow: hidden;
                }
                img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
                
                .footer-bar {
                    position: absolute;
                    bottom: 60px;
                    padding: 12px 40px;
                    background: #f3f4f6;
                    border-radius: 50px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #4b5563;
                    letter-spacing: 1px;
                }
            </style>
        </head>
        <body>
            <div class="branding-header">
                <div class="logo-container">
                    <img src="${logoBase64}" class="logo-alygen" />
                </div>
                <div class="branding-text">
                    <h2>Análise Profissional Alygen</h2>
                    <p>Consultoria de Crescimento Online</p>
                </div>
            </div>

            <div class="scene">
                <!-- Monitor -->
                <div class="monitor">
                    <div class="screen" style="border-radius: 6px;">
                        <img src="data:image/jpeg;base64,${desktopImg}" />
                    </div>
                </div>

                <!-- Laptop -->
                <div class="laptop">
                    <div class="screen" style="border-radius: 8px;">
                        <img src="data:image/jpeg;base64,${laptopImg}" />
                    </div>
                </div>

                <!-- iPhone -->
                <div class="iphone">
                    <div class="iphone-screen">
                        <img src="data:image/jpeg;base64,${mobileImg}" />
                    </div>
                </div>
            </div>

            <div class="footer-bar">
                PLANO ESTRATÉGICO DE PRESENÇA DIGITAL 360º — ${new Date().getFullYear()}
            </div>
        </body>
        </html>
        `;

        // Atribui viewport generoso para não haver cortes
        await page.setViewport({ width: 1400, height: 900 });
        await page.setContent(compositeHtml);
        
        const outputDir = path.join(__dirname, '../screenshots');
        const filename = `multi-mockup-branded-v2-${leadId}-${Date.now()}.png`;
        const filepath = path.join(outputDir, filename);

        // Capturar a imagem final
        await page.screenshot({ path: filepath, fullPage: false });

        console.log(`✅ Mockup V2 (Sem cortes) gerado: ${filename}`);
        
        return {
            success: true,
            path: filepath,
            filename: filename
        };

    } catch (err) {
        console.error('❌ Erro no mockup v2:', err.message);
        return { success: false, error: err.message };
    } finally {
        await browser.close();
    }
}
