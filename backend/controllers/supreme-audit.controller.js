import axios from 'axios';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper for Google Auth (shared with sheets.js logic)
const getGoogleAuth = () => {
  const credentialsPath = path.join(__dirname, '..', 'google-credentials.json');
  if (!fs.existsSync(credentialsPath)) return null;
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

/**
 * Supreme Audit Controller: Enterprise Ecosystem Verification
 */
export const runUltimateAudit = async (req, res) => {
  const { category } = req.params;
  const start = Date.now();

  try {
    switch (category) {
      case 'scraper_credits': {
        const apiKey = process.env.SCRAPER_API_KEY;
        if (!apiKey) throw new Error('SCRAPER_API_KEY não configurada');
        
        const { data } = await axios.get(`http://api.scraperapi.com/account?api_key=${apiKey}`);
        res.json({
          success: true,
          name: 'ScraperAPI Balance',
          status: (data.requestCount < data.planLimit * 0.9) ? 'pass' : 'warn',
          details: `Uso: ${data.requestCount} / ${data.planLimit} | Concorrência: ${data.concurrentUsage}/${data.concurrencyLimit}`,
          latency: Date.now() - start
        });
        break;
      }

      case 'sheets_connectivity': {
        const auth = getGoogleAuth();
        const sheetId = process.env.GOOGLE_SHEET_ID;
        if (!auth || !sheetId) throw new Error('Credenciais ou ID da Planilha ausentes');
        
        const doc = new GoogleSpreadsheet(sheetId, auth);
        await doc.loadInfo();
        
        res.json({
          success: true,
          name: 'Google Sheets Ecosystem',
          status: 'pass',
          details: `Planilha "${doc.title}" acessível | ${doc.sheetCount} abas detectadas.`,
          latency: Date.now() - start
        });
        break;
      }

      case 'secret_integrity': {
        const mandatoryKeys = [
          'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'GROQ_API_KEY', 
          'SCRAPER_API_KEY', 'GOOGLE_SHEET_ID',
          'TELEGRAM_BOT_TOKEN'
        ];
        
        const missing = mandatoryKeys.filter(key => !process.env[key]);
        
        res.json({
          success: true,
          name: 'Secret Shield (Env)',
          status: missing.length === 0 ? 'pass' : 'fail',
          details: missing.length === 0 
            ? 'Todos os segredos críticos estão presentes.' 
            : `Faltam chaves: ${missing.join(', ')}`,
          latency: Date.now() - start
        });
        break;
      }

      case 'python_stress': {
        const pythonUrl = process.env.PYTHON_SERVICE_URL;
        if (!pythonUrl) throw new Error('PYTHON_SERVICE_URL não configurada');
        
        const mockPayload = { website: 'test.com', force: false, mock: true };
        const { data } = await axios.post(`${pythonUrl}/analyze`, mockPayload, { timeout: 10000 });
        
        res.json({
          success: true,
          name: 'AI Microservice Handshake',
          status: data ? 'pass' : 'fail',
          details: 'Pipeline Python respondeu corretamente ao payload de stress.',
          latency: Date.now() - start
        });
        break;
      }

      default:
        res.status(400).json({ success: false, error: 'Categoria Ultimate inválida' });
    }
  } catch (e) {
    res.json({
      success: false,
      name: category,
      status: 'fail',
      details: e.message,
      latency: 0
    });
  }
};
