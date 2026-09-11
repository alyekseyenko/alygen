import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUOTA_FILE = path.join(__dirname, 'data', 'quota.json');
const DAILY_LIMIT = 500; // Opção Balanceada: 500 análises/dia

class QuotaManager {
  constructor() {
    this.ensureQuotaFile();
  }

  ensureQuotaFile() {
    if (!fs.existsSync(QUOTA_FILE)) {
      this.resetQuota();
    }
  }

  getQuota() {
    const data = JSON.parse(fs.readFileSync(QUOTA_FILE, 'utf8'));
    const today = new Date().toISOString().split('T')[0];
    
    if (data.date !== today) {
      this.resetQuota();
      return { used: 0, remaining: DAILY_LIMIT, date: today };
    }
    
    return { used: data.used, remaining: DAILY_LIMIT - data.used, date: data.date };
  }

  canAnalyze() {
    const quota = this.getQuota();
    return quota.remaining > 0;
  }

  useQuota() {
    const quota = this.getQuota();
    if (quota.remaining <= 0) {
      throw new Error('Quota diária excedida (500 análises/dia)');
    }
    
    const data = { date: quota.date, used: quota.used + 1 };
    fs.writeFileSync(QUOTA_FILE, JSON.stringify(data, null, 2));
    return { used: data.used, remaining: DAILY_LIMIT - data.used };
  }

  resetQuota() {
    const today = new Date().toISOString().split('T')[0];
    fs.writeFileSync(QUOTA_FILE, JSON.stringify({ date: today, used: 0 }, null, 2));
  }
}

export default new QuotaManager();
