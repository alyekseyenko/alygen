import { analyzeLead } from './analyzer.js';
import { updateLeadStatus } from './sheets.js';
import { quotaManager } from './quota-manager.js';

class AnalysisQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.stats = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0
    };
  }

  // Adicionar lead à fila
  async add(lead) {
    const job = {
      id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lead,
      status: 'waiting',
      addedAt: new Date().toISOString(),
      attempts: 0,
      maxAttempts: 3
    };
    
    this.queue.push(job);
    this.stats.waiting++;
    
    console.log(`📥 Lead adicionado à fila: ${lead.name} (ID: ${job.id})`);
    console.log(`📊 Fila: ${this.stats.waiting} aguardando, ${this.stats.active} processando`);
    
    // Iniciar processamento se não estiver rodando
    if (!this.processing) {
      this.processQueue();
    }
    
    return job.id;
  }

  // Adicionar múltiplos leads
  async addBulk(leads) {
    const jobIds = [];
    for (const lead of leads) {
      const jobId = await this.add(lead);
      jobIds.push(jobId);
    }
    return jobIds;
  }

  // Processar fila
  async processQueue() {
    if (this.processing) return;
    
    this.processing = true;
    console.log('🚀 Iniciando processamento da fila...');
    
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      this.stats.waiting--;
      this.stats.active++;
      
      try {
        await this.processJob(job);
        this.stats.completed++;
      } catch (error) {
        console.error(`❌ Erro no job ${job.id}:`, error.message);
        
        // Retry
        if (job.attempts < job.maxAttempts) {
          job.attempts++;
          console.log(`🔄 Retry ${job.attempts}/${job.maxAttempts} para ${job.lead.name}`);
          this.queue.push(job);
          this.stats.waiting++;
        } else {
          console.error(`💥 Job ${job.id} falhou após ${job.maxAttempts} tentativas`);
          this.stats.failed++;
        }
      } finally {
        this.stats.active--;
      }
      
      // Rate limiting: 5 minutos entre análises
      if (this.queue.length > 0) {
        console.log(`⏱️ Aguardando 5 minutos até próxima análise...`);
        console.log(`📊 Fila: ${this.stats.waiting} aguardando, ${this.stats.completed} concluídos, ${this.stats.failed} falhados`);
        await this.sleep(5 * 60 * 1000); // 5 minutos
      }
    }
    
    this.processing = false;
    console.log('✅ Fila processada completamente');
  }

  // Processar um job
  async processJob(job) {
    const { lead } = job;
    
    console.log(`🔍 Processando: ${lead.name} (${lead.website})`);
    
    // Verificar quota
    if (!quotaManager.canAnalyze()) {
      throw new Error('Quota diária atingida');
    }
    
    // Analisar
    const analysis = await analyzeLead(lead.website, lead);
    
    // Usar quota
    quotaManager.useQuota();
    
    // Atualizar Google Sheets
    await updateLeadStatus(lead.id, analysis);
    
    console.log(`✅ Concluído: ${lead.name} - Score: ${analysis.overallScore}/100`);
    
    return { success: true, analysis };
  }

  // Sleep helper
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Status da fila
  getStatus() {
    return {
      waiting: this.stats.waiting,
      active: this.stats.active,
      completed: this.stats.completed,
      failed: this.stats.failed,
      processing: this.processing
    };
  }

  // Limpar estatísticas
  resetStats() {
    this.stats.completed = 0;
    this.stats.failed = 0;
  }
}

// Singleton
export const analysisQueue = new AnalysisQueue();

// Funções helper
export async function queueAnalysis(lead) {
  return await analysisQueue.add(lead);
}

export async function queueBatchAnalysis(leads) {
  return await analysisQueue.addBulk(leads);
}

export function getQueueStatus() {
  return analysisQueue.getStatus();
}
