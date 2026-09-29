import { PgBoss } from 'pg-boss';

let bossInstance = null;

export async function startJobQueue() {
  if (process.env.DISABLE_JOB_QUEUE === 'true') return null;
  if (!process.env.PGHOST && process.env.NODE_ENV !== 'production') {
    return null;
  }

  try {
    bossInstance = new PgBoss({
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'alygen_crm',
    });
    await bossInstance.start();
    for (const queueName of ['market-intel', 'audit']) {
      await bossInstance.createQueue(queueName);
    }
    console.log('📬 pg-boss: fila de jobs iniciada (Postgres)');
    return bossInstance;
  } catch (err) {
    console.warn('⚠️ pg-boss não iniciado:', err.message);
    return null;
  }
}

export async function enqueueMarketIntel(payload) {
  return enqueueJob('market-intel', payload, { retryLimit: 2, expireInMinutes: 30 });
}

export async function enqueueAudit(payload) {
  return enqueueJob('audit', payload, { retryLimit: 2, expireInMinutes: 120 });
}

export async function enqueueJob(name, payload, options = {}) {
  if (!bossInstance) return null;
  return bossInstance.send(name, payload, options);
}

export function getJobQueue() {
  return bossInstance;
}
