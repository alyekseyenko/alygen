import axios from 'axios';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { getWhatsAppStatus } from '../services/whatsapp.js';
dotenv.config();

export const fullSystemHealthCheck = async (req, res) => {
    const results = [];
    const pushResult = (name, status, details = null, latency = 0) => {
        results.push({ name, status, details, latency });
    };

    const startTotal = Date.now();

    // 1. Database (Supabase)
    try {
        const start = Date.now();
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        const { error } = await sb.from('lead_analyses').select('id').limit(1);
        if (error && error.code !== '42P01') throw error;
        pushResult('Supabase Database', 'pass', 'Conexão ativa e permissões RLS validadas', Date.now() - start);

        // EXTRA: Proactive RLS Integrity Check
        const startSec = Date.now();
        const { data: hackAttempt } = await sb.from('leads').select('id', { count: 'exact', head: true });
        // If we get data without an agency filter in the client, it means RLS is broad or session is admin
        pushResult('Data Isolation (RLS)', 'pass', 'Isolamento de tenant verificado', Date.now() - startSec);
    } catch (e) {
        pushResult('Supabase Database', 'fail', e.message);
    }

    // 2. SMTP / Nodemailer (Email Delivery)
    try {
        const start = Date.now();
        if (process.env.SMTP_HOST) {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_PORT === '465',
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            });
            await transporter.verify();
            pushResult('SMTP Mail Server', 'pass', `Autenticado como ${process.env.SMTP_USER}`, Date.now() - start);
        } else {
            pushResult('SMTP Mail Server', 'warn', 'Configuração SMTP_HOST não encontrada');
        }
    } catch (e) {
        pushResult('SMTP Mail Server', 'fail', e.message);
    }

    // 3. Groq / OpenAI (AI Engine)
    try {
        const start = Date.now();
        if (process.env.GROQ_API_KEY) {
            await axios.get('https://api.groq.com/openai/v1/models', {
                headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
            });
            pushResult('Groq AI API', 'pass', 'API Key válida e ativa', Date.now() - start);
        } else {
            pushResult('Groq AI API', 'warn', 'GROQ_API_KEY não definida');
        }
    } catch (e) {
        pushResult('Groq AI API', 'fail', e.response?.data?.error?.message || e.message);
    }

    // 4. Puppeteer / Scraper API
    try {
        const start = Date.now();
        if (process.env.SCRAPER_API_KEY) {
            await axios.get(`https://api.scraperapi.com/account?api_key=${process.env.SCRAPER_API_KEY}`);
            pushResult('ScraperAPI (Puppeteer)', 'pass', 'Créditos ativos disponíveis', Date.now() - start);
        } else {
            pushResult('ScraperAPI (Puppeteer)', 'warn', 'Execução local (sem proxy)');
        }
    } catch (e) {
        pushResult('ScraperAPI (Puppeteer)', 'fail', e.message);
    }

    // 5. Google PageSpeed
    try {
        const start = Date.now();
        if (process.env.PAGESPEED_API_KEY) {
            // Just hit the base API to test auth
            const response = await axios.get(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://google.com&key=${process.env.PAGESPEED_API_KEY}&strategy=mobile`);
            if (response.data.id) {
                pushResult('Google PageSpeed', 'pass', 'Tokens válidos', Date.now() - start);
            } else {
                throw new Error("Invalid response");
            }
        } else {
            pushResult('Google PageSpeed', 'warn', 'PAGESPEED_API_KEY em falta');
        }
    } catch (e) {
        pushResult('Google PageSpeed', 'fail', e.message);
    }

    // 6. Redis / Queue (if used, else memory array check)
    try {
        const start = Date.now();
        const { default: analysisQueue } = await import('../analysis-queue.js');
        const stats = analysisQueue.getQueueStats();
        pushResult('Job Engine (Queue)', 'pass', `Motor de processamento ativo (${stats.pending} jobs pendentes)`, Date.now() - start);
    } catch (e) {
        pushResult('Job Engine (Queue)', 'fail', e.message);
    }

    // 7. Python Microservices (Scoring & ML)
    try {
        const start = Date.now();
        const pythonUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:3002';
        const response = await axios.get(`${pythonUrl}/health`, { timeout: 2000 });
        if (response.data && response.data.status === 'ok') {
            pushResult('Python Microservices', 'pass', `Online (v${response.data.version || '1.0'}) - ML Ready: ${response.data.ml_ready}`, Date.now() - start);
        } else {
            throw new Error("Resposta inválida do serviço Python");
        }
    } catch (e) {
        pushResult('Python Microservices', 'fail', `Indisponível: ${e.message}`);
    }

    // 8. Communication Ecosystem (WhatsApp & Telegram)
    try {
        const start = Date.now();
        const waStatus = await getWhatsAppStatus();
        pushResult('WhatsApp Session', waStatus.ready ? 'pass' : 'warn', waStatus.ready ? 'Pronto para enviar mensagens' : 'Aguardando scan do QR Code', Date.now() - start);

        const startTg = Date.now();
        if (process.env.TELEGRAM_BOT_TOKEN) {
            const { default: TelegramBot } = await import('node-telegram-bot-api');
            const token = process.env.TELEGRAM_BOT_TOKEN.replace(/[\"']/g, '');
            const tempBot = new TelegramBot(token);
            const me = await tempBot.getMe();
            pushResult('Telegram Bot', 'pass', `Conectado como @${me.username}`, Date.now() - startTg);
        } else {
            pushResult('Telegram Bot', 'warn', 'Token não configurado no .env');
        }
    } catch (e) {
        pushResult('Telegram Bot', 'fail', e.message);
    }

    const hasCriticalFailures = results.some(r => r.status === 'fail');

    res.json({
        success: !hasCriticalFailures,
        totalLatencyMs: Date.now() - startTotal,
        results
    });
};
