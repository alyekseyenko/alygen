import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const QUOTA_FILE = path.join(__dirname, '..', 'data', 'quota.json');
const DAILY_LIMIT = 50;

class QuotaManager {
  constructor() {
    this.ensureDataDir();
    this.loadQuota();
  }

  ensureDataDir() {
    const dir = path.dirname(QUOTA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  loadQuota() {
    try {
      if (fs.existsSync(QUOTA_FILE)) {
        const data = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf8'));
        this.quota = data;
        this.checkReset();
      } else {
        this.resetQuota();
      }
    } catch (error) {
      console.error('Erro ao carregar quota:', error.message);
      this.resetQuota();
    }
  }

  saveQuota() {
    try {
      fs.writeFileSync(QUOTA_FILE, JSON.stringify(this.quota, null, 2));
    } catch (error) {
      console.error('Erro ao salvar quota:', error.message);
    }
  }

  checkReset() {
    const today = new Date().toDateString();
    if (this.quota.date !== today) {
      console.log('🔄 Reset diário de quota');
      this.resetQuota();
    }
  }

  resetQuota() {
    this.quota = {
      date: new Date().toDateString(),
      used: 0,
      limit: DAILY_LIMIT,
      remaining: DAILY_LIMIT
    };
    this.saveQuota();
  }

  canAnalyze() {
    this.checkReset();
    return this.quota.remaining > 0;
  }

  useQuota() {
    this.checkReset();
    if (this.canAnalyze()) {
      this.quota.used++;
      this.quota.remaining--;
      this.saveQuota();
      console.log(`📊 Quota usada: ${this.quota.used}/${this.quota.limit} (${this.quota.remaining} restantes)`);
      return true;
    }
    console.warn('⚠️ Quota diária atingida!');
    return false;
  }

  getStatus() {
    this.checkReset();
    return {
      ...this.quota,
      resetAt: this.getNextResetTime()
    };
  }

  getNextResetTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }
}

export const quotaManager = new QuotaManager();
