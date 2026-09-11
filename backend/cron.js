import cron from 'node-cron';
import { getReadyForFollowup1, getReadyForFollowup2, updateSequenceStatus } from './services/email-sequences.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename_cron = fileURLToPath(import.meta.url);
const __dirname_cron = path.dirname(__filename_cron);

export function startFollowupCron() {
  // Corre a cada hora para follow-ups e automações temporizadas
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Cron: verificando follow-ups e automações temporizadas...');
    await processFollowup1();
    await processFollowup2();
    
    // 🔥 NOVO: Rodar automações com trigger timed/auto
    try {
        const { runTimedAutomations } = await import('./services/automation-engine.js');
        await runTimedAutomations();
    } catch (err) {
        console.error('❌ Erro no Cron ao rodar automações temporizadas:', err.message);
    }
  });

  // Corre à meia-noite (0 0) para limpar imagens velhas
  cron.schedule('0 0 * * *', async () => {
    console.log('🧹 Cron: Limpando screenshots com mais de 7 dias...');
    await cleanupScreenshots();
  });

  // 🛡️ RGPD Art. 5: Retenção de dados (limpar análises técnicas com mais de 365 dias)
  cron.schedule('0 3 * * 0', async () => {
    console.log('🛡️ Cron RGPD: Limpando análises antigas (política de retenção)...');
    try {
      const { deleteOldAnalyses } = await import('./services/supabase-service.js');
      const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '365', 10);
      const res = await deleteOldAnalyses(retentionDays);
      console.log(`🛡️ Cron RGPD: ${res.deleted || 0} análises antigas removidas (retenção: ${retentionDays} dias).`);
    } catch (err) {
      console.error('❌ Erro no Cron RGPD ao limpar dados antigos:', err.message);
    }
  });

  console.log('✅ Cron de follow-ups e limpeza iniciado');
}

async function cleanupScreenshots() {
  try {
    const screenshotsDir = path.join(__dirname_cron, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        console.log('ℹ️ Screenshots directory not found, skipping cleanup.');
        return;
    }

    const files = fs.readdirSync(screenshotsDir);
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    let deletedCount = 0;
    for (const file of files) {
      if (!file.endsWith('.png')) continue;
      const filePath = path.join(screenshotsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > SEVEN_DAYS_MS) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    console.log(`✅ Limpeza concluída: ${deletedCount} ficheiros removidos.`);
  } catch (err) {
    console.error('❌ Erro na limpeza de screenshots:', err.message);
  }
}

async function processFollowup1() {
  const sequences = await getReadyForFollowup1();
  if (!sequences.length) return;

  console.log(`📬 Follow-up 1: ${sequences.length} email(s) potencialmente pendentes`);
  const { requestSequenceApproval } = await import('./services/telegram-service.js');
  const { getAnalysisFromSupabase } = await import('./services/supabase-service.js');
  
  for (const seq of sequences) {
    try {
      // 🛑 Verificar se o cliente tem Imunidade (Virou Cliente / Negociação)
      if (seq.website) {
          const analysisRes = await getAnalysisFromSupabase(seq.website);
          if (analysisRes.success && analysisRes.data?.is_immune) {
              console.log(`🛡️ [IMUNIDADE] Abortando Follow-up D3 de ${seq.email}. Cliente Imune.`);
              import('./services/email-sequences.js').then(m => m.cancelSequence(seq.id));
              continue; // Salta este lead
          }
      }

      await requestSequenceApproval(seq, 3);
      await updateSequenceStatus(seq.id, 'waiting_approval_d3', 'updated_at'); 
    } catch (err) {
      console.error(`❌ Erro ao pedir aprovação D3 para ${seq.email}:`, err.message);
    }
  }
}

async function processFollowup2() {
  const sequences = await getReadyForFollowup2();
  if (!sequences.length) return;

  console.log(`📬 Follow-up 2: ${sequences.length} email(s) potencialmente pendentes`);
  const { requestSequenceApproval } = await import('./services/telegram-service.js');
  const { getAnalysisFromSupabase } = await import('./services/supabase-service.js');

  for (const seq of sequences) {
    try {
      // 🛑 Verificar Imunidade
      if (seq.website) {
          const analysisRes = await getAnalysisFromSupabase(seq.website);
          if (analysisRes.success && analysisRes.data?.is_immune) {
              console.log(`🛡️ [IMUNIDADE] Abortando Follow-up D7 de ${seq.email}. Cliente Imune.`);
              import('./services/email-sequences.js').then(m => m.cancelSequence(seq.id));
              continue;
          }
      }

      await requestSequenceApproval(seq, 7);
      await updateSequenceStatus(seq.id, 'waiting_approval_d7', 'updated_at');
    } catch (err) {
      console.error(`❌ Erro ao pedir aprovação D7 para ${seq.email}:`, err.message);
    }
  }
}
