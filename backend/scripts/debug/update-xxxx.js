import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function patchAutomation() {
    console.log('🔍 Fetching workflow "xxxx"...');
    const { data: automation, error } = await supabase
        .from('automations')
        .select('*')
        .eq('name', 'xxxx')
        .single();

    if (error || !automation) {
        console.error('❌ Error fetching workflow:', error?.message);
        return;
    }

    let modified = false;
    const workflow = automation.workflow_data;

    if (workflow && workflow.nodes) {
        workflow.nodes.forEach(node => {
            if (node.actionType === 'send_email' || (node.data && node.data.actionType === 'send_email')) {
                // Modificar data.config
                if (node.data && node.data.config) {
                    node.data.config.attach_pdf = true;
                    node.data.config.attach_image = true;
                    // node.data.config.require_approval = true; // Só liga o telegram se o utilizador configurou no .env!
                }
                // Modificar config
                if (node.config) {
                    node.config.attach_pdf = true;
                    node.config.attach_image = true;
                }
                modified = true;
                console.log('✅ Send Email node aktualizado com PDF e Imagem!');
            }
        });
    }

    // Apenas liga a aprovação humana se as variaveis de ambiente estiverem configuradas
    const hasTelegram = process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID;
    if (hasTelegram && workflow && workflow.nodes) {
         workflow.nodes.forEach(node => {
            if (node.actionType === 'send_email' || (node.data && node.data.actionType === 'send_email')) {
                if (node.data && node.data.config) node.data.config.require_approval = true;
                if (node.config) node.config.require_approval = true;
                console.log('✅ Aprovação Humana do Telegram ativada (toggles)');
            }
        });
    }

    if (modified) {
        console.log('📝 Atualizando no Supabase...');
        const { error: updateError } = await supabase
            .from('automations')
            .update({ workflow_data: workflow })
            .eq('id', automation.id);
            
        if (updateError) {
             console.error('❌ Error updating workflow:', updateError.message);
        } else {
             console.log('✅ Automação xxxx atualizada com sucesso no banco de dados!');
        }
    }
}

patchAutomation();
