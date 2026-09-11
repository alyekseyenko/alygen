import crypto from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar credenciais do ficheiro google-credentials.json existente
const credsPath = join(__dirname, '..', 'google-credentials.json');
let credentials = null;

if (existsSync(credsPath)) {
  try {
    credentials = JSON.parse(readFileSync(credsPath, 'utf8'));
    console.log('👁️ Google Cloud Vision Authenticated with Service Account');
  } catch (err) {
    console.error('❌ Erro ao autenticar Google Cloud Vision:', err.message);
  }
}

/**
 * Gera um token de acesso OAuth2 usando assinatura manual de JWT (Failsafe & Independente de biblioteca)
 */
async function getAccessTokenManual() {
  if (!credentials) {
    throw new Error('Chaves da Google Cloud não carregadas.');
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const base64UrlEncode = (str) => Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const tokenInput = base64UrlEncode(JSON.stringify(header)) + '.' + base64UrlEncode(JSON.stringify(claim));
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(tokenInput);
  const signature = base64UrlEncode(sign.sign(credentials.private_key));
  const assertion = tokenInput + '.' + signature;

  const response = await axios.post(
    'https://oauth2.googleapis.com/token',
    'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + assertion,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    }
  );

  return response.data?.access_token;
}

/**
 * Analisa uma imagem base64 ou caminho do ficheiro com a Google Cloud Vision API
 * @param {string} base64Image - Imagem em base64 (completa com prefixo ou apenas dados)
 */
export async function analyzeImageWithVision(base64Image) {
  if (!credentials) {
    console.warn('⚠️ Credenciais Google Cloud não configuradas para Vision.');
    return { success: false, error: 'Credenciais ausentes' };
  }

  try {
    // 1. Obter token de acesso OAuth2 válido
    const accessToken = await getAccessTokenManual();

    if (!accessToken) {
      throw new Error('Falha ao gerar o token de acesso');
    }

    // 2. Limpar prefixo base64 se presente
    let cleanBase64 = base64Image;
    if (base64Image.includes(';base64,')) {
      cleanBase64 = base64Image.split(';base64,')[1];
    }

    // 3. Estruturar o pedido para a API Cloud Vision
    const payload = {
      requests: [
        {
          image: {
            content: cleanBase64
          },
          features: [
            {
              type: 'LABEL_DETECTION',
              maxResults: 12
            },
            {
              type: 'TEXT_DETECTION'
            },
            {
              type: 'WEB_DETECTION',
              maxResults: 10
            },
            {
              type: 'IMAGE_PROPERTIES'
            }
          ]
        }
      ]
    };

    // 4. Executar pedido HTTP REST para a Vision API
    const response = await axios.post(
      'https://vision.googleapis.com/v1/images:annotate',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const annotation = response.data?.responses?.[0] || {};
    
    // 5. Estruturar respostas de alto nível para o relatório estratégico
    const labels = (annotation.labelAnnotations || []).map(l => l.description);
    const fullText = annotation.fullTextAnnotation?.text || '';
    const webEntities = (annotation.webDetection?.webEntities || [])
      .filter(w => w.description)
      .map(w => w.description);
      
    // Cores dominantes (paleta visual)
    const colors = (annotation.imagePropertiesAnnotation?.dominantColors?.colors || [])
      .slice(0, 3)
      .map(c => {
        const rgb = c.color || {};
        return `rgb(${rgb.red || 0}, ${rgb.green || 0}, ${rgb.blue || 0})`;
      });

    return {
      success: true,
      labels,
      fullText: fullText.substring(0, 1000), // limite seguro
      webEntities,
      colors,
      raw: {
        textCount: fullText.length,
        labelCount: labels.length
      }
    };

  } catch (error) {
    console.error('❌ Erro na API Google Cloud Vision:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}
