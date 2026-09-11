// Gerenciador de API Keys do Groq com rotação automática
class GroqKeyManager {
  constructor() {
    // Carregar chaves prioritariamente do ambiente (.env)
    const envKeys = (process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    // Chaves carregadas de forma segura via .env (sem segredos expostos no código)
    this.keys = envKeys;
    
    this.currentIndex = 0;
    this.failedKeys = new Set();
    this.lastRotation = Date.now();
    
    console.log(`🔑 Groq Key Manager: ${this.keys.length} chaves disponíveis ${this.keys.length > 0 ? '(via .env)' : '(nenhuma chave configurada - modo offline/fallback)'}`);
  }
  
  getCurrentKey() {
    // Se todas as chaves falharam, resetar após 1 hora
    if (this.failedKeys.size >= this.keys.length) {
      const hoursSinceReset = (Date.now() - this.lastRotation) / (1000 * 60 * 60);
      if (hoursSinceReset >= 1) {
        console.log('⚠️ 1 hora passou, resetando chaves falhadas...');
        this.failedKeys.clear();
        this.currentIndex = 0;
        this.lastRotation = Date.now();
      } else {
        console.log(`⚠️ Todas as chaves falharam. Aguarde ${Math.ceil(60 - hoursSinceReset * 60)} minutos.`);
        return null;
      }
    }
    
    // Pular chaves que falharam
    let attempts = 0;
    while (this.failedKeys.has(this.currentIndex) && attempts < this.keys.length) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      attempts++;
    }
    
    if (attempts >= this.keys.length) {
      return null; // Todas falharam
    }
    
    return this.keys[this.currentIndex];
  }
  
  markAsFailed(key) {
    const index = this.keys.indexOf(key);
    if (index !== -1) {
      this.failedKeys.add(index);
      console.log(`❌ Chave #${index + 1} marcada como falha (${this.failedKeys.size}/${this.keys.length})`);
    }
  }
  
  rotateKey() {
    const oldIndex = this.currentIndex;
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    
    // Pular chaves que falharam
    let attempts = 0;
    while (this.failedKeys.has(this.currentIndex) && attempts < this.keys.length) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      attempts++;
    }
    
    if (attempts >= this.keys.length) {
      console.log('❌ Todas as chaves falharam');
      return null;
    }
    
    console.log(`🔄 Rotação: chave #${oldIndex + 1} → chave #${this.currentIndex + 1}`);
    return this.getCurrentKey();
  }
  
  getStats() {
    return {
      total: this.keys.length,
      current: this.currentIndex + 1,
      failed: this.failedKeys.size,
      available: this.keys.length - this.failedKeys.size
    };
  }
}

// Singleton
const groqKeyManager = new GroqKeyManager();

export default groqKeyManager;
