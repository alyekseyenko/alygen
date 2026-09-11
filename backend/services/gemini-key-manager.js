class GeminiKeyManager {
  constructor() {
    const envKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    this.keys = envKeys;
    this.currentIndex = 0;
  }

  getCurrentKey() {
    if (!this.keys || this.keys.length === 0) return null;
    return this.keys[this.currentIndex];
  }

  rotateKey() {
    if (!this.keys || this.keys.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return this.getCurrentKey();
  }
}

const geminiKeyManager = new GeminiKeyManager();
export default geminiKeyManager;
