/**
 * 🐍 Python Bridge — Alygen CRM
 * 
 * Wrapper seguro para chamar os microserviços Python.
 * Se o Python estiver offline, usa automaticamente o módulo JS original.
 * Zero risco: a webapp funciona 100% sem o Python.
 */

import axios from 'axios';
import { semanticMemoryService } from './semantic-memory.js';
import db from './local-db-service.js';
import { getRequestId } from '../utils/async-context.js';

// Distributed Tracing: Attach X-Request-Id to all outgoing microservice calls
axios.interceptors.request.use((config) => {
  const reqId = getRequestId();
  if (reqId && config.headers && !config.headers['X-Request-Id']) {
    config.headers['X-Request-Id'] = reqId;
  }
  return config;
});

const PYTHON_FASTAPI_URL = process.env.PYTHON_FASTAPI_URL || 'http://localhost:3003';
const PYTHON_URL = process.env.PYTHON_SERVICE_URL || PYTHON_FASTAPI_URL;
const PYTHON_ML_URL = process.env.PYTHON_ML_URL || PYTHON_FASTAPI_URL;
const PYTHON_SCORING_URL = process.env.PYTHON_SCORING_URL || PYTHON_FASTAPI_URL;
const TIMEOUT_MS = 3000; 

let pythonAvailable = null;
let mlAvailable = null;
let scoringAvailable = null;
let fastApiAvailable = null;
let lastCheckTime   = 0;
const CHECK_INTERVAL = 30_000; 

/**
 * Verificar se o microserviço Python está online.
 * Faz cache do resultado por 30s para não sobrecarregar.
 */
async function isFastApiAvailable() {
  const now = Date.now();
  if (fastApiAvailable !== null && now - lastCheckTime < CHECK_INTERVAL) {
    return fastApiAvailable;
  }
  try {
    await axios.get(`${PYTHON_FASTAPI_URL}/health`, { timeout: 1500 });
    fastApiAvailable = true;
  } catch {
    fastApiAvailable = false;
  }
  lastCheckTime = now;
  return fastApiAvailable;
}

async function isPythonAvailable() {
  const now = Date.now();
  if (pythonAvailable !== null && now - lastCheckTime < CHECK_INTERVAL) {
    return pythonAvailable;
  }
  try {
    await axios.get(`${PYTHON_URL}/health`, { timeout: 1500 });
    pythonAvailable = true;
  } catch {
    pythonAvailable = false;
  }
  lastCheckTime = now;
  return pythonAvailable;
}

async function isMlAvailable() {
  const now = Date.now();
  if (mlAvailable !== null && now - lastCheckTime < CHECK_INTERVAL) {
    return mlAvailable;
  }
  try {
    await axios.get(`${PYTHON_ML_URL}/health`, { timeout: 1500 });
    mlAvailable = true;
  } catch {
    mlAvailable = false;
  }
  lastCheckTime = now;
  return mlAvailable;
}

async function isScoringAvailable() {
  const now = Date.now();
  if (scoringAvailable !== null && now - lastCheckTime < CHECK_INTERVAL) {
    return scoringAvailable;
  }
  try {
    await axios.get(`${PYTHON_SCORING_URL}/health`, { timeout: 1500 });
    scoringAvailable = true;
  } catch {
    scoringAvailable = false;
  }
  lastCheckTime = now;
  return scoringAvailable;
}

/**
 * Calcular Q-Score via Python (8x mais rápido para lotes).
 * Fallback automático para o módulo JS se Python offline.
 * 
 * @param {object} analysis - Resultado da análise
 * @param {object} leadData - Dados do lead
 * @param {Function} jsFallback - calculateQScoreAdvanced original
 * @param {Array} allLeads - Lista completa de leads para benchmarking
 */
export async function scoreWithPython(analysis, leadData, jsFallback, allLeads = []) {
  if (await isScoringAvailable()) {
    try {
      const { data } = await axios.post(
        `${PYTHON_SCORING_URL}/score/single`,
        { analysis, leadData, allLeads },
        { timeout: TIMEOUT_MS }
      );
      if (data.success && data.qScore) {
        return data.qScore;
      }
    } catch (err) {
      console.warn('⚠️ Python score falhou, usando JS:', err.message);
      scoringAvailable = false;
    }
  }
  // Fallback seguro para o JS original
  return jsFallback ? jsFallback(analysis, leadData) : null;
}

/**
 * Pontuar múltiplos leads de uma vez (muito mais eficiente).
 * 
 * @param {Array} leads - Lista de {analysis, leadData}
 * @param {Function} jsFallback - Função JS a usar por lead se Python offline
 * @param {Array} allLeads - Lista completa para benchmarking
 */
export async function scoreBulkWithPython(leads, jsFallback, allLeads = []) {
  if (await isScoringAvailable()) {
    try {
      const { data } = await axios.post(
        `${PYTHON_SCORING_URL}/score/bulk`,
        { leads, allLeads },
        { timeout: TIMEOUT_MS * 2 }
      );
      if (data.success && data.scores) {
        console.log(`🐍 Python bulk score: ${data.scores.length} leads com Benchmarking`);
        return data.scores;
      }
    } catch (err) {
      console.warn('⚠️ Python bulk score falhou, usando JS:', err.message);
      scoringAvailable = false;
    }
  }
  // Fallback: processar um a um com JS
  if (jsFallback) {
    return leads.map(item => jsFallback(item.analysis || item, item.leadData || {}));
  }
  return [];
}
/**
 * Analisar acessibilidade de HTML via Python (lxml — 3x mais rápido).
 * 
 * @param {string} html - HTML da página
 * @param {string} url - URL para logging
 * @param {Function} jsFallback - analyzeAccessibility JS original
 */
export async function accessibilityWithPython(html, url, jsFallback) {
  if (await isScoringAvailable() && html) {
    try {
      const { data } = await axios.post(
        `${PYTHON_SCORING_URL}/accessibility/analyze`,
        { html, url },
        { timeout: TIMEOUT_MS }
      );
      if (data.success && typeof data.score === 'number') {
        console.log(`🐍 Python acessibilidade: ${url} → ${data.score}/100`);
        return data;
      }
    } catch (err) {
      console.warn('⚠️ Python acessibilidade falhou, usando JS:', err.message);
    }
  }
  // Fallback para o analisador JS original
  return jsFallback ? jsFallback(url, html) : { score: 0, errors: 0, issues: [] };
}

/**
 * Predição ML de probabilidade de fecho de leads.
 * Apenas funciona após treinar o modelo com /ml/train.
 * 
 * @param {Array} leads - Lista de leads do Supabase
 */
export async function mlPredictCloseProbability(leads) {
  if (!await isMlAvailable()) return null;

  try {
    // Enviar estrutura completa — o Python extrai os 15 features via extract_ml_features()
    const { data } = await axios.post(
      `${PYTHON_ML_URL}/ml/predict`,
      leads,
      { timeout: TIMEOUT_MS * 4 }
    );
    return data.success ? data.predictions : null;
  } catch (err) {
    console.warn('⚠️ ML predict indisponível:', err.message);
    return null;
  }
}

/**
 * Treinar o modelo ML com dados históricos do Supabase.
 * Chamar este endpoint uma vez quando tiver leads suficientes com CRM stage.
 * 
 * @param {Array} historicalLeads - Leads com crm_stage preenchido
 */
export async function mlTrainModel(historicalLeads) {
  if (!await isMlAvailable()) {
    return { success: false, error: 'Python offline' };
  }

  try {
    const { data } = await axios.post(
      `${PYTHON_ML_URL}/ml/train`,
      historicalLeads,
      { timeout: 30_000 } // Treino pode demorar mais
    );
    if (data.success) {
      console.log(`✅ Modelo ML treinado com ${data.samples} leads — Accuracy: ${data.accuracy}%`);
    }
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Scraping profundo via Python Playwright (para SPAs e links ocultos).
 * 
 * @param {string} url - URL do site
 */
export async function deepScrapeWithPython(url) {
  if (await isPythonAvailable()) {
    try {
      const { data } = await axios.post(
        `${PYTHON_URL}/scrape/deep`,
        { url },
        { timeout: 5_000 } // Fail fast se o Playwright ou Python encravar
      );
      if (data.success) {
        console.log(`🐍 Python Deep Scraping: ${url} → ${data.count?.emails} emails, ${data.count?.phones} telefones`);
        return data;
      }
    } catch (err) {
      // Retornamos erros específicos do servidor se o Playwright não estiver instalado
      if (err.response?.data?.error?.includes('Playwright não está instalado')) {
        return err.response.data;
      }
      console.warn('⚠️ Python Deep Scraping falhou ou timeout:', err.message);
    }
  }
  return { success: false, emails: [], phones: [] };
}

/**
 * Realiza análise estratégica (Tom de Voz e Fragilidade) via Python.
 * Requer o texto bruto da página e o URL para identificação de copyright.
 * 
 * @param {string} text - Texto bruto da página
 * @param {string} url - URL do site
 */
export async function analyzeStrategic(text, url) {
  if (await isPythonAvailable()) {
    try {
      const { data } = await axios.post(
        `${PYTHON_URL}/analysis/strategic`,
        { text, url },
        { timeout: 10_000 }
      );
      return data;
    } catch (err) {
      console.warn('⚠️ Erro na análise estratégica Python:', err.message);
    }
  }
  return { success: false, tone: 'neutral', fragility_score: 0 };
}

/**
 * Gera um PDF profissional usando o motor Python Playwright (Senior Mode)
 * Ideal para relatórios de auditoria rápidos e com design premium.
 * 
 * @param {string} html - Conteúdo HTML formatado
 * @param {string} filename - Nome sugerido do ficheiro
 */
export async function generateStrategicPDF(html, filename = 'auditoria-alygen.pdf') {
  if (await isPythonAvailable() && html) {
    try {
      const { data } = await axios.post(
        `${PYTHON_URL}/generate/pdf`,
        { html, filename },
        { 
          responseType: 'arraybuffer', // Crucial para receber binário
          headers: { 'Content-Type': 'application/json' },
          timeout: 25000 
        }
      );
      
      console.log(`🐍 Python PDF Generator: ${filename} gerado com sucesso.`);
      return Buffer.from(data);
    } catch (err) {
      console.warn('⚠️ Erro no motor de PDF Python, abortando:', err.message);
      throw err;
    }
  }
  throw new Error('Motor de PDF Python (3002) está offline.');
}

/**
 * ⚡ Verificar posição no Google via Python Playwright.
 * Substitui o Scraper API externo (que devolvia 403) — sem custo, sem API key.
 * 
 * @param {string} domain  - Domínio do lead (ex: sffadvogada.pt)
 * @param {string} query   - Query de pesquisa local (ex: "advogado Faro")
 * @param {number} maxResults - Número de resultados a analisar (default: 10)
 */
export async function getGoogleRanking(domain, query, maxResults = 10) {
  if (!domain || !query) return { ranking: 'N/A', position: null };

  if (await isPythonAvailable()) {
    try {
      const { data } = await axios.post(
        `${PYTHON_URL}/ranking/google`,
        { domain, query, maxResults },
        { timeout: 45_000 } // Playwright pode demorar até 30s
      );
      if (data.success) {
        console.log(`🔎 Google Ranking: ${domain} → ${data.ranking} (query: "${query}")`);
        return data;
      }
    } catch (err) {
      console.warn('⚠️ Google Ranking Python falhou:', err.message);
    }
  }

  // Fallback: retorna N/A sem bloquear a análise principal
  return { success: false, ranking: 'N/A', position: null, status: 'offline' };
}

/**
 * Inteligência de Mercado Multi-Agente (Senior 2026 Engine).
 * Orquestra Researcher, Strategist e Synthesizer em paralelo.
 */
export async function getMarketIntelMultiAgent(name, city, sector, website) {
  // 1. Try to fetch from Local Semantic Memory cache first (RAG Layer)
  try {
    const memoryMatches = await semanticMemoryService.findSimilarIntel(sector, city || 'Portugal');
    if (memoryMatches && memoryMatches.length > 0) {
      const match = memoryMatches[0];
      console.log(`🧠 [RAG Cache] Semantic Match found in database for ${sector} in ${city || 'Portugal'}: using cached intel.`);
      return {
        success: true,
        intel: `Com base nas inteligências de mercado locais e semânticas guardadas para ${sector} in ${city || 'Portugal'}:\nIdentificámos que os concorrentes "${match.competitors}" continuam fortes na região. Para se destacar e reverter as dores técnicas detetadas, a empresa deve agir no posicionamento digital de forma imediata.`,
        source: 'Semantic Cache (RAG)'
      };
    }
  } catch (err) {
    console.warn('⚠️ Error querying local semantic memory:', err.message);
  }

  // 1b. Query internal leads in the same niche and region to extract exact competitors from database
  let internalCompetitors = [];
  try {
    if (city && sector) {
      const sql = `
        SELECT lead_name, lead_website, qscore, qscore_grade 
        FROM lead_analyses 
        WHERE lead_city ILIKE $1 AND lead_type ILIKE $2 AND lead_website <> $3 AND qscore >= 50 
        ORDER BY qscore DESC 
        LIMIT 3
      `;
      const dbRes = await db.query(sql, [city, sector, website || '']);
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        internalCompetitors = dbRes.rows.map(r => ({
          name: r.lead_name || '',
          url: r.lead_website || '',
          qscore: r.qscore || 0,
          grade: r.qscore_grade || 'C'
        }));
        console.log(`🎯 [Internal Competitors Match] Encontrados ${internalCompetitors.length} concorrentes internos na base de dados Alygen para ${sector} em ${city}.`);
      }
    }
  } catch (dbErr) {
    console.warn('⚠️ Falha ao cruzar concorrentes internos da base de dados:', dbErr.message);
  }

  const useFastApi = await isFastApiAvailable();
  const baseUrl = useFastApi ? PYTHON_FASTAPI_URL : PYTHON_URL;
  
  try {
    const { data } = await axios.post(
      `${baseUrl}/agent/market-intel`,
      { name, city, sector, website, internal_competitors: internalCompetitors },
      { timeout: 60_000 }
    );
    
    // 2. Cache the newly generated intelligence inside our Semantic memories in background
    if (data.success && data.intel) {
      semanticMemoryService.saveMemory({
        sector,
        district: city || 'Portugal',
        companyName: name,
        website,
        painPoints: data.pain_points || 'Lacuna de performance técnica',
        competitors: data.competitors || 'Concorrentes locais'
      }).catch(err => console.warn('⚠️ Background save to semantic memory failed:', err.message));
    }

    return data;
  } catch (err) {
    console.error('❌ Multi-Agent Intel failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Verificar status do microserviço (para endpoint de diagnóstico).
 */
export async function getPythonStatus() {
  const [flask, fast] = await Promise.all([
    isPythonAvailable().then(v => ({ legacy: v })),
    isFastApiAvailable().then(v => ({ engine2026: v }))
  ]);
  return { online: flask.legacy || fast.engine2026, flask, fast };
}
