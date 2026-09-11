import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUEUE_FILE = path.join(__dirname, 'data', 'queue.json');
const RATE_LIMIT_MS = 20 * 1000; // 20 segundos (Opção Balanceada: 3 análises/min)

class AnalysisQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.lastProcessedAt = null;
    this.lastHeartbeat = null;
    this.loadQueue();
  }

  loadQueue() {
    if (fs.existsSync(QUEUE_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
        this.queue = data.queue || [];
        this.lastProcessedAt = data.lastProcessedAt ? new Date(data.lastProcessedAt) : null;

        // 🛡️ Auto-Healing: Recuperar tarefas que ficaram em 'processing' durante um shutdown/crash inesperado
        let recoveredCount = 0;
        this.queue.forEach(item => {
          if (item.status === 'processing') {
            item.status = 'pending';
            item.progressLog = 'Recuperado automaticamente após reinício do sistema.';
            recoveredCount++;
          }
        });

        if (recoveredCount > 0) {
          console.log(`🛡️ [Queue Auto-Healing] ${recoveredCount} tarefa(s) em 'processing' recuperada(s) para 'pending'.`);
          this.saveQueue();
        }
      } catch (err) {
        console.error('⚠️ [Queue Error] Falha ao ler ficheiro da fila:', err.message);
        this.queue = [];
      }
    }
  }

  saveQueue() {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify({
      queue: this.queue,
      lastProcessedAt: this.lastProcessedAt
    }, null, 2));
  }

  add(leadData, forceReanalyze = false, options = {}) {
    const id = Date.now() + Math.random();
    this.queue.push({
      id,
      leadData,
      forceReanalyze, // ✅ Guardar flag para o worker saber que tem de ignorar cache
      options, // ✅ Guardar opções (ex: phase)
      addedAt: new Date().toISOString(),
      status: 'pending'
    });
    this.saveQueue();

    // Retornar posição na fila
    const position = this.queue.filter(item => item.status === 'pending').length;
    const estimatedWaitTime = this.getEstimatedWaitTime();

    // Processar fila
    this.processNext();

    return { id, position, estimatedWaitTime };
  }

  getEstimatedWaitTime() {
    const pendingCount = this.queue.filter(item => item.status === 'pending').length;

    if (!this.lastProcessedAt) {
      return 0;
    }

    const timeSinceLastProcess = Date.now() - new Date(this.lastProcessedAt).getTime();
    const timeUntilNextProcess = Math.max(0, RATE_LIMIT_MS - timeSinceLastProcess);

    return timeUntilNextProcess + (pendingCount - 1) * RATE_LIMIT_MS;
  }

  canProcess() {
    if (!this.lastProcessedAt) return true;
    const timeSinceLastProcess = Date.now() - new Date(this.lastProcessedAt).getTime();
    return timeSinceLastProcess >= RATE_LIMIT_MS;
  }

  async processNext() {
    if (this.processing || this.queue.length === 0) return;

    const pending = this.queue.find(item => item.status === 'pending');
    if (!pending) return;

    if (!this.canProcess()) {
      const waitTime = RATE_LIMIT_MS - (Date.now() - new Date(this.lastProcessedAt).getTime());
      setTimeout(() => this.processNext(), waitTime);
      return;
    }

    // NOTE: Execution is handled externally by worker.js
    // This method only ensures scheduling continues after rate-limit window
    setTimeout(() => this.processNext(), RATE_LIMIT_MS);
  }

  getStatus(id) {
    const item = this.queue.find(q => q.id === id);
    if (!item) return null;

    const position = this.queue.filter(q =>
      q.status === 'pending' && q.addedAt < item.addedAt
    ).length + 1;

    return {
      id: item.id,
      status: item.status,
      progressLog: item.progressLog || null,
      error: item.error || null,
      position,
      estimatedWaitTime: this.getEstimatedWaitTime(),
      addedAt: item.addedAt
    };
  }

  getQueueStats() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(q => q.status === 'pending').length,
      processing: this.queue.filter(q => q.status === 'processing').length,
      completed: this.queue.filter(q => q.status === 'completed').length,
      failed: this.queue.filter(q => q.status === 'failed').length,
      lastProcessedAt: this.lastProcessedAt,
      nextProcessIn: this.canProcess() ? 0 : RATE_LIMIT_MS - (Date.now() - new Date(this.lastProcessedAt).getTime())
    };
  }

  clearCompleted() {
    this.queue = this.queue.filter(q => q.status !== 'completed');
    this.saveQueue();
  }
}

export default new AnalysisQueue();
