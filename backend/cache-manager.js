import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, 'data', 'cache');
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

class CacheManager {
  constructor() {
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  // Gerar chave única para URL
  generateKey(url) {
    return crypto.createHash('md5').update(url).digest('hex');
  }

  // Verificar se cache existe e é válido
  has(url) {
    const key = this.generateKey(url);
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    
    if (!fs.existsSync(cachePath)) return false;
    
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      const age = Date.now() - cached.timestamp;
      
      if (age > CACHE_DURATION) {
        this.delete(url);
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  // Obter dados do cache
  get(url) {
    const key = this.generateKey(url);
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    
    if (!this.has(url)) return null;
    
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      console.log(`✅ Cache hit: ${url} (${Math.round((Date.now() - cached.timestamp) / 1000 / 60)} min atrás)`);
      return cached.data;
    } catch (error) {
      console.error('Erro ao ler cache:', error.message);
      return null;
    }
  }

  // Salvar no cache
  set(url, data) {
    const key = this.generateKey(url);
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    
    try {
      fs.writeFileSync(cachePath, JSON.stringify({
        url,
        data,
        timestamp: Date.now()
      }, null, 2));
      console.log(`💾 Cache salvo: ${url}`);
    } catch (error) {
      console.error('Erro ao salvar cache:', error.message);
    }
  }

  // Deletar cache específico
  delete(url) {
    const key = this.generateKey(url);
    const cachePath = path.join(CACHE_DIR, `${key}.json`);
    
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
      console.log(`🗑️ Cache deletado: ${url}`);
    }
  }

  // Limpar cache antigo
  cleanup() {
    const files = fs.readdirSync(CACHE_DIR);
    let deleted = 0;
    
    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      try {
        const cached = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const age = Date.now() - cached.timestamp;
        
        if (age > CACHE_DURATION) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      } catch (error) {
        // Arquivo corrompido, deletar
        fs.unlinkSync(filePath);
        deleted++;
      }
    });
    
    if (deleted > 0) {
      console.log(`🧹 ${deleted} caches antigos removidos`);
    }
  }

  // Estatísticas do cache
  getStats() {
    const files = fs.readdirSync(CACHE_DIR);
    let totalSize = 0;
    let validCaches = 0;
    let expiredCaches = 0;
    
    files.forEach(file => {
      const filePath = path.join(CACHE_DIR, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      try {
        const cached = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const age = Date.now() - cached.timestamp;
        
        if (age > CACHE_DURATION) {
          expiredCaches++;
        } else {
          validCaches++;
        }
      } catch (error) {
        expiredCaches++;
      }
    });
    
    return {
      total: files.length,
      valid: validCaches,
      expired: expiredCaches,
      size: Math.round(totalSize / 1024), // KB
      sizeFormatted: totalSize > 1024 * 1024 
        ? `${(totalSize / 1024 / 1024).toFixed(2)} MB`
        : `${Math.round(totalSize / 1024)} KB`
    };
  }

  // Limpar todo o cache
  clear() {
    const files = fs.readdirSync(CACHE_DIR);
    files.forEach(file => {
      fs.unlinkSync(path.join(CACHE_DIR, file));
    });
    console.log(`🗑️ ${files.length} caches removidos`);
  }
}

export default new CacheManager();
