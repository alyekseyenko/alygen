import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixEdges() {
    const { data: automation, error } = await supabase
        .from('automations')
        .select('*')
        .eq('name', 'xxxx')
        .single();

    if (error || !automation) return;

    const workflow = automation.workflow_data;
    const initialEmailNodeId = 'node_v2_2_1774273111694';
    
    if (workflow.reactFlowEdges) {
        // Garantir que não duplica
        const hasD3 = workflow.reactFlowEdges.find(e => e.id === "e-d3-1");
        if (!hasD3) {
            workflow.reactFlowEdges.push(
                { id: "e-d3-1", source: initialEmailNodeId, target: "node_wait_d3", animated: true, style: { stroke: '#FF4F00', strokeWidth: 2 } },
                { id: "e-d3-2", source: "node_wait_d3", target: "node_email_d3", animated: true, style: { stroke: '#FF4F00', strokeWidth: 2 } },
                { id: "e-d7-1", source: initialEmailNodeId, target: "node_wait_d7", animated: true, style: { stroke: '#FF4F00', strokeWidth: 2 } },
                { id: "e-d7-2", source: "node_wait_d7", target: "node_email_d7", animated: true, style: { stroke: '#FF4F00', strokeWidth: 2 } }
            );

            await supabase
                .from('automations')
                .update({ workflow_data: workflow })
                .eq('id', automation.id);
                
            console.log('✅ Linhas visuais corrigidas!');
        } else {
            console.log('✅ Linhas já estavam ok.');
        }
    }
}

fixEdges();
