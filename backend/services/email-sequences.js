import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Criar sequência após envio do email principal
export async function createSequence({ leadId, leadName, email, website, template, body }) {
  if (!supabase) return { success: false, error: 'Supabase não configurado' };
  const { data, error } = await supabase
    .from('email_sequences')
    .update({
      lead_id:    leadId || website,
      lead_name:  leadName,
      email,
      website,
      template,           // 'website' ou 'nowebsite'
      email_body: body,   // Guardar o corpo do email
      status:     'sent',
      sent_at:    new Date().toISOString(),
      followup1_sent_at: null,
      followup2_sent_at: null,
      replied_at: null,
      paused:     false,
    })
    .eq('email', email)
    .select();

  // Se não existir, criar novo
  if (error || !data || data.length === 0) {
    const { data: newData, error: insertError } = await supabase
      .from('email_sequences')
      .insert({
        lead_id:    leadId || website,
        lead_name:  leadName,
        email,
        website,
        template,
        email_body: body,
        status:     'sent'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao criar sequência no Supabase:', insertError);
      return { success: false, error: insertError.message };
    }
    return { success: true, data: newData };
  }

  return { success: true, data: data[0] };
}

// Buscar sequências prontas para follow-up 1 (sent há >= 3 dias)
export async function getReadyForFollowup1() {
  if (!supabase) return [];
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('status', 'sent')
    .eq('paused', false)
    .lte('sent_at', cutoff);
  return data || [];
}

// Buscar sequências prontas para follow-up 2 (followup1 enviado há >= 4 dias = dia 7 total)
export async function getReadyForFollowup2() {
  if (!supabase) return [];
  const cutoff = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('status', 'followup1')
    .eq('paused', false)
    .lte('followup1_sent_at', cutoff);
  return data || [];
}

// Atualizar status após envio de follow-up
export async function updateSequenceStatus(id, status, field) {
  if (!supabase) return;
  await supabase
    .from('email_sequences')
    .update({ status, [field]: new Date().toISOString() })
    .eq('id', id);
}

// Marcar como respondeu (para parar a sequência)
export async function markReplied(email) {
  if (!supabase) return;
  await supabase
    .from('email_sequences')
    .update({ status: 'replied', replied_at: new Date().toISOString(), paused: true })
    .eq('email', email);
}

export async function markRepliedById(id) {
  if (!supabase) return { success: false, error: 'Supabase não configurado' };
  const { error } = await supabase
    .from('email_sequences')
    .update({ status: 'replied', replied_at: new Date().toISOString(), paused: true })
    .eq('id', id);
  return { success: !error, error: error?.message };
}

export async function bulkPause(ids, paused) {
  if (!supabase) return { success: false, error: 'Supabase não configurado' };
  if (!Array.isArray(ids) || ids.length === 0) return { success: false, error: 'ids obrigatórios' };
  const { error } = await supabase
    .from('email_sequences')
    .update({ paused: !!paused })
    .in('id', ids);
  return { success: !error, error: error?.message };
}

export async function bulkCancel(ids) {
  if (!supabase) return { success: false, error: 'Supabase não configurado' };
  if (!Array.isArray(ids) || ids.length === 0) return { success: false, error: 'ids obrigatórios' };
  const { error } = await supabase
    .from('email_sequences')
    .update({ status: 'cancelled', paused: true })
    .in('id', ids);
  return { success: !error, error: error?.message };
}

export async function bulkMarkReplied(ids) {
  if (!supabase) return { success: false, error: 'Supabase não configurado' };
  if (!Array.isArray(ids) || ids.length === 0) return { success: false, error: 'ids obrigatórios' };
  const { error } = await supabase
    .from('email_sequences')
    .update({ status: 'replied', replied_at: new Date().toISOString(), paused: true })
    .in('id', ids);
  return { success: !error, error: error?.message };
}

// Pausar / retomar sequência
export async function togglePause(id, paused) {
  if (!supabase) return { success: false };
  const { error } = await supabase
    .from('email_sequences')
    .update({ paused })
    .eq('id', id);
  return { success: !error };
}

// Cancelar sequência
export async function cancelSequence(id) {
  if (!supabase) return { success: false };
  const { error } = await supabase
    .from('email_sequences')
    .update({ status: 'cancelled', paused: true })
    .eq('id', id);
  return { success: !error };
}

// Marcar como aberto (Tracking Pixel)
export async function markOpened(id) {
  if (!supabase) return { success: false };
  
  // Primeiro buscar para ver se já foi aberto e incrementar contador
  const { data: current } = await supabase
    .from('email_sequences')
    .select('open_count, first_opened_at')
    .eq('id', id)
    .single();

  const updates = {
    last_opened_at: new Date().toISOString(),
    open_count: (current?.open_count || 0) + 1
  };

  if (!current?.first_opened_at) {
    updates.first_opened_at = updates.last_opened_at;
  }

  const { error } = await supabase
    .from('email_sequences')
    .update(updates)
    .eq('id', id);

  return { success: !error };
}

// Listar todas as sequências (para o dashboard)
export async function listSequences(filter = 'all') {
  if (!supabase) return { success: false, data: [] };
  const opts = typeof filter === 'object' && filter !== null ? filter : { filter };

  const baseFilter = opts.filter || 'all';
  const status = opts.status;
  const template = opts.template;
  const paused = opts.paused;
  const q = opts.q;

  let query = supabase
    .from('email_sequences')
    .select('*')
    .order('sent_at', { ascending: false });

  if (baseFilter === 'active')    query = query.in('status', ['sent', 'followup1']).eq('paused', false);
  if (baseFilter === 'replied')   query = query.eq('status', 'replied');
  if (baseFilter === 'cold')      query = query.eq('status', 'followup2');
  if (baseFilter === 'cancelled') query = query.eq('status', 'cancelled');

  if (status && status !== 'all') query = query.eq('status', status);
  if (template && template !== 'all') query = query.eq('template', template);
  if (paused === true || paused === false) query = query.eq('paused', paused);

  // Pesquisa simples (Supabase OR)
  if (q && String(q).trim().length >= 2) {
    const term = String(q).trim().replace(/,/g, ' ');
    query = query.or(`lead_name.ilike.%${term}%,email.ilike.%${term}%,website.ilike.%${term}%`);
  }

  const { data, error } = await query;
  return { success: !error, data: data || [] };
}
