import { getAutomations, upsertAutomation } from './services/supabase-service.js';

async function fix() {
  const result = await getAutomations();
  const xxxx = result.data.find(a => a.name === 'xxxx');
  if (!xxxx) return;

  const data = xxxx.workflow_data;
  const edges = data.edges;

  // 1. node_is_whatsapp_check (false) -> node_notify_admin
  if (!edges.some(e => e.from === 'node_is_whatsapp_check' && e.condition === 'false')) {
    edges.push({ from: 'node_is_whatsapp_check', to: 'node_notify_admin', condition: 'false' });
    data.reactFlowEdges.push({
      id: "e-node_is_whatsapp_check-node_notify_admin-false",
      source: "node_is_whatsapp_check",
      target: "node_notify_admin",
      condition: "false",
      animated: true,
      style: { stroke: "#FF4F00" }
    });
  }

  // 2. node_v2_2_1774373218936 (false) -> node_notify_admin
  if (!edges.some(e => e.from === 'node_v2_2_1774373218936' && e.condition === 'false')) {
    edges.push({ from: 'node_v2_2_1774373218936', to: 'node_notify_admin', condition: 'false' });
    data.reactFlowEdges.push({
      id: "e-node_v2_2_1774373218936-node_notify_admin-false",
      source: "node_v2_2_1774373218936",
      target: "node_notify_admin",
      condition: "false",
      animated: true,
      style: { stroke: "#FF4F00" }
    });
  }

  // 3. node_v2_1_1774373173033 (false) -> node_v2_2_1774373218936
  if (!edges.some(e => e.from === 'node_v2_1_1774373173033' && e.condition === 'false')) {
    edges.push({ from: 'node_v2_1_1774373173033', to: 'node_v2_2_1774373218936', condition: 'false' });
    data.reactFlowEdges.push({
      id: "e-node_v2_1_1774373173033-node_v2_2_1774373218936-false",
      source: "node_v2_1_1774373173033",
      target: "node_v2_2_1774373218936",
      condition: "false",
      animated: true,
      style: { stroke: "#FF4F00" }
    });
  }

  xxxx.workflow_data = data;
  const updateResult = await upsertAutomation(xxxx);
  
  if (updateResult.success) {
    console.log('✅ Workflow "xxxx" corrigido com sucesso!');
  } else {
    console.error('❌ Erro ao atualizar workflow:', updateResult.error);
  }
}

fix();
