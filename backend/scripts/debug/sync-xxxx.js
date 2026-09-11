
import { fetchLeads } from './services/sheets.js';
import { getAllAnalyses } from './services/supabase-service.js';
import { runAutomationsForLead } from './services/automation-engine.js';
import dotenv from 'dotenv';

dotenv.config();

async function startSync() {
    console.log('🚀 Iniciando Sincronização do 0 (Paginated)...');
    
    try {
        console.log('📊 Buscando leads do Google Sheets...');
        const leadsResult = await fetchLeads();
        const leads = leadsResult.leads || leadsResult;
        console.log(`✅ ${leads.length} leads encontrados.`);

        console.log('☁️ Buscando análises do Supabase em blocos...');
        const allAnalyses = [];
        let offset = 0;
        const limit = 50;
        let hasMore = true;

        while (hasMore) {
            console.log(`📡 Buscando bloco ${offset / limit + 1}...`);
            const { data, error } = await getAllAnalyses(limit, offset);
            
            if (error || !data || data.length === 0) {
                hasMore = false;
            } else {
                allAnalyses.push(...data);
                if (data.length < limit) {
                    hasMore = false;
                } else {
                    offset += limit;
                }
            }
        }
        
        console.log(`✅ ${allAnalyses.length} análises totais encontradas.`);

        const analysisMap = {};
        allAnalyses.forEach(a => {
            if (a.website) {
                const normalize = u => u?.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
                analysisMap[normalize(a.website)] = a;
            }
        });

        let processed = 0;
        let skipped = 0;

        for (const lead of leads) {
            const normalize = u => u?.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
            const analysis = analysisMap[normalize(lead.website)];

            if (analysis) {
                console.log(`⚙️ [${processed + 1}] Processando: ${lead.name} (${lead.website})`);
                await runAutomationsForLead(lead, analysis);
                processed++;
                // Pequeno delay para evitar rate limits
                await new Promise(r => setTimeout(r, 1000));
            } else {
                skipped++;
            }
        }

        console.log('\n✨ Sincronização concluída!');
        console.log(`✅ Processados: ${processed}`);
        console.log(`⏭️ Ignorados (sem análise): ${skipped}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro durante a sincronização:', error);
        process.exit(1);
    }
}

startSync();
