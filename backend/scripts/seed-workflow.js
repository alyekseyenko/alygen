import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// IDs consistentes para nós
const N1 = 'node_1';
const N2 = 'node_2';
const N3 = 'node_3';
const N4 = 'node_4';
const N5 = 'node_5';

const PRE_CONFIGURED_WORKFLOW = {
  name: 'Alygen Premium Booking Workflow',
  description: 'O fluxo mestre: Calendly -> Aprovação Telegram -> Confirmar Email & WhatsApp -> Lembrete Agenda',
  is_active: true,
  workflow_data: {
    nodes: [
      { id: N1, type: 'trigger', position: { x: 100, y: 150 }, data: { label: 'Calendly Booking', iconName: 'Calendar', backendType: 'trigger' } },
      { id: N2, type: 'action', position: { x: 400, y: 150 }, data: { label: 'Telegram Approval', actionType: 'telegram_approval', iconName: 'Smartphone', backendType: 'action' } },
      { id: N3, type: 'action', position: { x: 700, y: 50 }, data: { label: 'Send Email Premium', actionType: 'send_email', iconName: 'Mail', backendType: 'action' } },
      { id: N4, type: 'action', position: { x: 700, y: 150 }, data: { label: 'WhatsApp Status', actionType: 'whatsapp', iconName: 'MessageCircle', backendType: 'action' } },
      { id: N5, type: 'action', position: { x: 700, y: 250 }, data: { label: 'Agenda Reminder', actionType: 'meeting_reminder', iconName: 'Calendar', backendType: 'action' } }
    ],
    // Formato que o motor (backend) espera
    edges: [
      { from: N1, to: N2 },
      { from: N2, to: N3 },
      { from: N2, to: N4 },
      { from: N2, to: N5 }
    ],
    // Formato que o React Flow (frontend) espera para mostrar as LINHAS
    reactFlowEdges: [
      { id: 'e1-2', source: N1, target: N2, animated: true, style: { stroke: '#FF4F00', strokeWidth: 2 } },
      { id: 'e2-3', source: N2, target: N3, animated: true, style: { stroke: '#FF4F00', strokeWidth: 2 } },
      { id: 'e2-4', source: N2, target: N4, animated: true, style: { stroke: '#FF4F00', strokeWidth: 2 } },
      { id: 'e2-5', source: N2, target: N5, animated: true, style: { stroke: '#FF4F00', strokeWidth: 2 } }
    ]
  }
};

async function seedAutomation() {
  console.log('🚀 Injetando Workflow Alygen Premium (FIX FINAL DAS LINHAS) na base de dados...');
  try {
    console.log('🧹 Limpando versões anteriores...');
    await supabase.from('automations').delete().eq('name', 'Alygen Premium Booking Workflow');
    
    console.log('🆕 Criando Workflow com reactFlowEdges...');
    const { error } = await supabase.from('automations').insert([PRE_CONFIGURED_WORKFLOW]);
    
    if (error) throw error;
    console.log('✅ Workflow Alygen Premium ATIVADO e VISUALMENTE LIGADO com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao injetar automação:', err.message);
  } finally {
    process.exit();
  }
}

seedAutomation();
