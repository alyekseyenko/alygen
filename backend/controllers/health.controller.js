import db from '../services/local-db-service.js';

export const fullSystemHealthCheck = async (req, res) => {
    const results = [];
    const pushResult = (name, status, details = null, latency = 0) => {
        results.push({ name, status, details, latency });
    };

    const startTotal = Date.now();

    try {
        const start = Date.now();
        await db.query('SELECT id FROM lead_analyses LIMIT 1');
        pushResult('Postgres/SQLite Local', 'pass', 'Base de dados local acessível', Date.now() - start);
    } catch (e) {
        pushResult('Postgres/SQLite Local', 'fail', e.message);
    }

    try {
        const start = Date.now();
        const { getJobQueue } = await import('../services/job-queue.js');
        const boss = getJobQueue();
        pushResult('Job Queue (pg-boss)', boss ? 'pass' : 'warn', boss ? 'Fila persistente ativa' : 'Modo memória / SQLite', Date.now() - start);
    } catch (e) {
        pushResult('Job Queue (pg-boss)', 'warn', e.message);
    }

    try {
        const start = Date.now();
        if (process.env.GROQ_API_KEY) {
            const axios = (await import('axios')).default;
            await axios.get('https://api.groq.com/openai/v1/models', {
                headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            });
            pushResult('Groq AI API', 'pass', 'API Key válida', Date.now() - start);
        } else {
            pushResult('Groq AI API', 'warn', 'GROQ_API_KEY não definida');
        }
    } catch (e) {
        pushResult('Groq AI API', 'fail', e.message);
    }

    try {
        const start = Date.now();
        const axios = (await import('axios')).default;
        const pythonUrl = process.env.PYTHON_FASTAPI_URL || 'http://localhost:3003';
        const response = await axios.get(`${pythonUrl}/health`, { timeout: 2000 });
        pushResult('Python FastAPI Engine', response.data?.status === 'online' ? 'pass' : 'warn', 'Motor agentes', Date.now() - start);
    } catch (e) {
        pushResult('Python FastAPI Engine', 'fail', e.message);
    }

    const hasCriticalFailures = results.some((r) => r.status === 'fail');
    res.json({ success: !hasCriticalFailures, totalLatencyMs: Date.now() - startTotal, results });
};
