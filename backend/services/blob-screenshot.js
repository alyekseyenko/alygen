import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Captura screenshot do blob 3D
 * @param {string} leadId - ID do lead
 * @param {object} analysis - Dados da análise
 * @returns {Promise<{success: boolean, filename?: string, base64?: string, error?: string}>}
 */
export async function captureBlobScreenshot(leadId, analysis) {
  let browser;
  
  try {
    console.log(`📸 Capturando blob 3D para lead: ${leadId}`);
    
    // Criar HTML temporário com o blob
    const htmlContent = generateBlobHTML(analysis);
    const tempHtmlPath = path.join(__dirname, '../temp', `blob-${leadId}.html`);
    
    // Garantir que a pasta temp existe
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Salvar HTML temporário
    fs.writeFileSync(tempHtmlPath, htmlContent);
    
    // Iniciar Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({
      width: 800,
      height: 800,
      deviceScaleFactor: 2
    });
    
    // Carregar HTML
    await page.goto(`file://${tempHtmlPath}`, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Aguardar o blob renderizar (3 segundos para animação)
    await page.waitForTimeout(3000);
    
    // Capturar screenshot
    const screenshotDir = path.join(__dirname, '../screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const filename = `blob-${leadId}-${Date.now()}.png`;
    const screenshotPath = path.join(screenshotDir, filename);
    
    await page.screenshot({
      path: screenshotPath,
      type: 'png',
      omitBackground: false
    });
    
    // Converter para base64
    const imageBuffer = fs.readFileSync(screenshotPath);
    const base64 = imageBuffer.toString('base64');
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempHtmlPath);
    
    console.log(`✅ Blob capturado: ${filename}`);
    
    return {
      success: true,
      filename,
      path: screenshotPath,
      base64,
      url: `/screenshots/${filename}`
    };
    
  } catch (error) {
    console.error('❌ Erro ao capturar blob:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Gera HTML standalone com o blob 3D
 */
function generateBlobHTML(analysis) {
  const qScore = analysis?.qScoreAdvanced?.score || analysis?.qScore?.score || 0;
  const performanceMobile = analysis?.performanceMobile || 0;
  const performanceDesktop = analysis?.performanceScore || 0;
  const tracking = analysis?.pixelDetails?.totalTracking || 0;
  const seoScore = analysis?.seo?.score || 0;
  const securityScore = analysis?.security?.score || 0;
  const accessibilityScore = analysis?.accessibility?.score || 0;
  const hasSSL = Boolean(analysis?.security?.hasSSL);
  
  // Cor baseada em Q Score
  let color = '#fed7aa';
  if (qScore >= 80) color = '#ff6b00';
  else if (qScore >= 60) color = '#f97316';
  else if (qScore >= 40) color = '#fb923c';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000000;
      overflow: hidden;
    }
    #canvas-container {
      width: 800px;
      height: 800px;
    }
  </style>
</head>
<body>
  <div id="canvas-container"></div>
  
  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.158.0/examples/jsm/"
      }
    }
  </script>
  
  <script type="module">
    import * as THREE from 'three';
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 5, 0);
    camera.lookAt(0, 0, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 800);
    renderer.setPixelRatio(2);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);
    
    const directionalLight1 = new THREE.DirectionalLight(0xf97316, 2.5);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xfb923c, 1.2);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);
    
    const pointLight = new THREE.PointLight(0xff6b00, 0.8);
    pointLight.position.set(0, 0, -10);
    scene.add(pointLight);
    
    // Blob principal
    const radius = 1.5 + (${seoScore} / 100) * 0.5;
    const geometry = new THREE.SphereGeometry(radius, 128, 128);
    const material = new THREE.MeshStandardMaterial({
      color: 0x${color.replace('#', '')},
      emissive: ${qScore >= 70 ? `0x${color.replace('#', '')}` : '0x000000'},
      emissiveIntensity: ${(qScore + securityScore) / 200},
      roughness: ${0.4 - (performanceMobile / 250)},
      metalness: ${0.7 + (accessibilityScore / 200)},
      transparent: true,
      opacity: ${0.85 + (tracking / 70)}
    });
    
    const blob = new THREE.Mesh(geometry, material);
    scene.add(blob);
    
    // Partículas
    const particlesCount = ${tracking} * 10;
    if (particlesCount > 0) {
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particlesCount * 3);
      
      for (let i = 0; i < particlesCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
      
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      const particlesMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x${color.replace('#', '')},
        transparent: true,
        opacity: 0.6
      });
      
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);
      scene.add(particles);
    }
    
    // Animação
    let frame = 0;
    function animate() {
      frame++;
      
      blob.rotation.x = frame * 0.005;
      blob.rotation.y = frame * 0.008;
      
      const pulse = 1 + Math.sin(frame * 0.05) * 0.05;
      blob.scale.set(pulse, pulse, pulse);
      
      renderer.render(scene, camera);
      
      if (frame < 60) {
        requestAnimationFrame(animate);
      }
    }
    
    animate();
  </script>
</body>
</html>
  `;
}

export default { captureBlobScreenshot };
