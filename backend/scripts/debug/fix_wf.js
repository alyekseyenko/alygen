
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function fix() {
    const { data } = await supabase.from('automations').select('*').eq('id', '72adad27-303b-444a-bc26-76704a21d12c').single();
    if (!data) return console.log('Not found');

    const wf = data.workflow_data;
    const emailCondId = 'node_v2_1_1774373173033';
    const alreadyEmailId = 'node_v2_1_1774272940850';
    const sendEmailId = 'node_v2_2_1774273111694';
    const phoneCondId = 'node_v2_2_1774373218936';
    const alreadyWAId = 'node_v2_3_1774273284183';
    const sendWAId = 'node_v2_4_1774273339002';

    // REVISÃO: Se não tiver EMAIL, PARA TUDO.
    // O nó 'node_v2_1_1774373173033' é o "Has Email?"
    // Se for FALSE (bolinha vermelha), não ligamos a nada -> O motor pára.
    
    wf.edges = [
        { from: '1', to: '2' }, // Lead -> Score
        { from: '2', to: emailCondId, condition: 'true' }, // Score < 90 -> Has Email?
        { from: emailCondId, to: alreadyEmailId, condition: 'true' }, // Has Email? -> Not Emailed?
        { from: alreadyEmailId, to: sendEmailId, condition: 'true' }, // Not Emailed? -> Send Email
        { from: sendEmailId, to: phoneCondId }, // Send Email -> Has Phone?
        { from: alreadyEmailId, to: phoneCondId, condition: 'false' }, // Already Emailed -> Has Phone?
        { from: phoneCondId, to: alreadyWAId, condition: 'true' }, // Has Phone? -> Not WA?
        { from: alreadyWAId, to: sendWAId, condition: 'true' } // Not WA? -> Send WA
    ];

    wf.reactFlowEdges = [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e2-em', source: '2', target: emailCondId, condition: 'true', sourceHandle: 'true', animated: true },
        { id: 'eem-aem', source: emailCondId, target: alreadyEmailId, condition: 'true', sourceHandle: 'true', animated: true },
        { id: 'eaem-sem', source: alreadyEmailId, target: sendEmailId, condition: 'true', sourceHandle: 'true', animated: true },
        { id: 'esem-ph', source: sendEmailId, target: phoneCondId, animated: true },
        { id: 'eaem-ph-f', source: alreadyEmailId, target: phoneCondId, condition: 'false', sourceHandle: 'false', animated: true, style: { stroke: '#FF4F00' } },
        { id: 'eph-awa', source: phoneCondId, target: alreadyWAId, condition: 'true', sourceHandle: 'true', animated: true },
        { id: 'eawa-swa', source: alreadyWAId, target: sendWAId, condition: 'true', sourceHandle: 'true', animated: true }
    ];

    const { error } = await supabase.from('automations').update({ workflow_data: wf }).eq('id', data.id);
    console.log(error ? 'Error: ' + error.message : 'Success: Workflow refined (Email mandatory)!');
}

fix();
