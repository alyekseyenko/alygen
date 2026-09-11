import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function injectFollowups() {
    console.log('🔍 A adicionar Follow-up D3 e D7 na automação "xxxx"...');
    
    const { data: automation, error } = await supabase
        .from('automations')
        .select('*')
        .eq('name', 'xxxx')
        .single();

    if (error || !automation) {
        console.error('❌ Erro:', error?.message);
        return;
    }

    const workflow = automation.workflow_data;
    
    // O nó de email inicial:
    const initialEmailNodeId = 'node_v2_2_1774273111694';
    
    // Garantir que não duplica se for corrido 2 vezes
    if (workflow.nodes.find(n => n.id === 'node_wait_d3')) {
        console.log('✅ Os nós D3 e D7 já estão na automação xxxx.');
        return;
    }

    // Criar Nós (Wait 3 dias -> Followup 1)
    const nodeWaitD3 = {
        id: "node_wait_d3",
        data: { label: "Wait 3 Dias", actionType: "wait", backendType: "wait", config: { delay: "259200" } },
        type: "action",
        config: { delay: "259200" },
        actionType: "wait",
        backendType: "wait",
        position: { x: 250, y: 700 }
    };
    const nodeEmailD3 = {
        id: "node_email_d3",
        data: { label: "Send Email (D3)", actionType: "send_email", config: { template_id: "alygen_followup_1" } },
        type: "action",
        config: { template_id: "alygen_followup_1" },
        actionType: "send_email",
        position: { x: 250, y: 850 }
    };

    // Criar Nós (Wait 7 dias -> Followup 2)
    const nodeWaitD7 = {
        id: "node_wait_d7",
        data: { label: "Wait 7 Dias", actionType: "wait", backendType: "wait", config: { delay: "604800" } },
        type: "action",
        config: { delay: "604800" },
        actionType: "wait",
        backendType: "wait",
        position: { x: 500, y: 700 }
    };
    const nodeEmailD7 = {
        id: "node_email_d7",
        data: { label: "Send Email (D7)", actionType: "send_email", config: { template_id: "alygen_followup_2" } },
        type: "action",
        config: { template_id: "alygen_followup_2" },
        actionType: "send_email",
        position: { x: 500, y: 850 }
    };

    // Inserir os nós no fluxograma
    workflow.nodes.push(nodeWaitD3, nodeEmailD3, nodeWaitD7, nodeEmailD7);

    // Inserir as arestas (edges)
    workflow.edges.push(
        { from: initialEmailNodeId, to: "node_wait_d3" },
        { from: "node_wait_d3", to: "node_email_d3" },
        { from: initialEmailNodeId, to: "node_wait_d7" },
        { from: "node_wait_d7", to: "node_email_d7" }
    );

    const { error: updateError } = await supabase
        .from('automations')
        .update({ workflow_data: workflow })
        .eq('id', automation.id);
        
    if (updateError) {
         console.error('❌ Error updating workflow:', updateError.message);
    } else {
         console.log('✅ Automação xxxx atualizada com D3 e D7 (Em paralelo após o 1º Email)!');
    }
}

injectFollowups();
