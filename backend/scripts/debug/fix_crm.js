import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function runFix() {
  console.log('🔄 Iniciando recuperação paginada de dados do CRM via Node.js...');
  let updatedCount = 0;
  let offset = 0;
  const limit = 250;
  let hasMore = true;

  while (hasMore) {
    console.log(`Paginando... offset ${offset}`);
    const { data: leads, error } = await supabase
      .from('lead_analyses')
      .select('id, lead_website, full_analysis')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Erro ao ler leads:', error.message);
      return;
    }

    if (!leads || leads.length === 0) {
      hasMore = false;
      break;
    }

    for (const lead of leads) {
      let analysis;
      try {
        if (typeof lead.full_analysis === 'string') {
          analysis = JSON.parse(lead.full_analysis);
        } else {
          analysis = lead.full_analysis; 
        }
      } catch (e) {
        continue;
      }
      if (!analysis) continue;

      const hasImmunityInJson = analysis.is_immune === true;
      if (hasImmunityInJson || analysis.budget > 0 || analysis.crm_stage !== 'LEAD') {
        const updateData = {
          is_immune: analysis.is_immune || false,
          crm_stage: analysis.crm_stage || 'LEAD',
          budget: analysis.budget || 0,
          private_notes: analysis.private_notes || null,
          client_email: analysis.client_email || null,
          client_phone: analysis.client_phone || null,
          client_nif: analysis.client_nif || null,
          client_address: analysis.client_address || null,
          contact_person: analysis.contact_person || null,
          project_type: analysis.project_type || 'WEBSITE'
        };

        const { error: updateError } = await supabase
          .from('lead_analyses')
          .update(updateData)
          .eq('id', lead.id);

        if (!updateError) {
          updatedCount++;
          if (hasImmunityInJson) console.log(`🛡️ Escudo recuperado para: ${lead.lead_website}`);
        }
      }
    }
    offset += limit;
  }

  console.log(`\n🎉 Fim! ${updatedCount} leads recuperados com sucesso!`);
}

runFix();
