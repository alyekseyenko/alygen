import crypto from 'crypto';
import db from './local-db-service.js';

function boolToInt(v) {
  return v ? 1 : 0;
}

export async function createSequence({ leadId, leadName, email, website, template, body }) {
  const now = new Date().toISOString();
  const existing = await db.query('SELECT id FROM email_sequences WHERE email = $1', [email]);
  if (existing.rows?.length) {
    await db.query(
      `UPDATE email_sequences SET lead_id = $1, lead_name = $2, website = $3, template = $4, email_body = $5,
       status = 'sent', sent_at = $6, followup1_sent_at = NULL, followup2_sent_at = NULL, replied_at = NULL, paused = 0
       WHERE email = $7`,
      [leadId || website, leadName, website, template, body, now, email]
    );
    const row = await db.query('SELECT * FROM email_sequences WHERE email = $1', [email]);
    return { success: true, data: row.rows[0] };
  }

  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO email_sequences (id, lead_id, lead_name, email, website, template, email_body, status, sent_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', $8)`,
    [id, leadId || website, leadName, email, website, template, body, now]
  );
  const row = await db.query('SELECT * FROM email_sequences WHERE id = $1', [id]);
  return { success: true, data: row.rows[0] };
}

export async function getReadyForFollowup1() {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const res = await db.query(
    `SELECT * FROM email_sequences WHERE status = 'sent' AND paused = 0 AND sent_at <= $1`,
    [cutoff]
  );
  return res.rows || [];
}

export async function getReadyForFollowup2() {
  const cutoff = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const res = await db.query(
    `SELECT * FROM email_sequences WHERE status = 'followup1' AND paused = 0 AND followup1_sent_at <= $1`,
    [cutoff]
  );
  return res.rows || [];
}

export async function updateSequenceStatus(id, status, field) {
  await db.query(`UPDATE email_sequences SET status = $1, ${field} = $2 WHERE id = $3`, [
    status,
    new Date().toISOString(),
    id,
  ]);
}

export async function markReplied(email) {
  await db.query(
    `UPDATE email_sequences SET status = 'replied', replied_at = $1, paused = 1 WHERE email = $2`,
    [new Date().toISOString(), email]
  );
}

export async function markRepliedById(id) {
  await db.query(
    `UPDATE email_sequences SET status = 'replied', replied_at = $1, paused = 1 WHERE id = $2`,
    [new Date().toISOString(), id]
  );
  return { success: true };
}

export async function bulkPause(ids, paused) {
  if (!ids?.length) return { success: false, error: 'ids obrigatórios' };
  for (const id of ids) {
    await db.query('UPDATE email_sequences SET paused = $1 WHERE id = $2', [boolToInt(paused), id]);
  }
  return { success: true };
}

export async function bulkCancel(ids) {
  if (!ids?.length) return { success: false, error: 'ids obrigatórios' };
  for (const id of ids) {
    await db.query(`UPDATE email_sequences SET status = 'cancelled', paused = 1 WHERE id = $1`, [id]);
  }
  return { success: true };
}

export async function bulkMarkReplied(ids) {
  if (!ids?.length) return { success: false, error: 'ids obrigatórios' };
  const now = new Date().toISOString();
  for (const id of ids) {
    await db.query(`UPDATE email_sequences SET status = 'replied', replied_at = $1, paused = 1 WHERE id = $2`, [now, id]);
  }
  return { success: true };
}

export async function togglePause(id, paused) {
  await db.query('UPDATE email_sequences SET paused = $1 WHERE id = $2', [boolToInt(paused), id]);
  return { success: true };
}

export async function cancelSequence(id) {
  await db.query(`UPDATE email_sequences SET status = 'cancelled', paused = 1 WHERE id = $1`, [id]);
  return { success: true };
}

export async function markOpened(id) {
  const current = await db.query('SELECT open_count, first_opened_at FROM email_sequences WHERE id = $1', [id]);
  const row = current.rows?.[0];
  const now = new Date().toISOString();
  const openCount = (row?.open_count || 0) + 1;
  const firstOpened = row?.first_opened_at || now;
  await db.query(
    'UPDATE email_sequences SET open_count = $1, first_opened_at = $2, last_opened_at = $3 WHERE id = $4',
    [openCount, firstOpened, now, id]
  );
  return { success: true };
}

export async function listSequences(filter = 'all') {
  const opts = typeof filter === 'object' && filter !== null ? filter : { filter };
  const params = [];
  let sql = 'SELECT * FROM email_sequences WHERE 1=1';

  const baseFilter = opts.filter || 'all';
  if (baseFilter === 'active') sql += ` AND status IN ('sent', 'followup1') AND paused = 0`;
  if (baseFilter === 'replied') sql += ` AND status = 'replied'`;
  if (baseFilter === 'cold') sql += ` AND status = 'followup2'`;
  if (baseFilter === 'cancelled') sql += ` AND status = 'cancelled'`;

  if (opts.status && opts.status !== 'all') {
    params.push(opts.status);
    sql += ` AND status = $${params.length}`;
  }
  if (opts.template && opts.template !== 'all') {
    params.push(opts.template);
    sql += ` AND template = $${params.length}`;
  }
  if (opts.paused === true || opts.paused === false) {
    params.push(boolToInt(opts.paused));
    sql += ` AND paused = $${params.length}`;
  }
  if (opts.q && String(opts.q).trim().length >= 2) {
    const term = `%${String(opts.q).trim()}%`;
    params.push(term, term, term);
    sql += ` AND (lead_name ILIKE $${params.length - 2} OR email ILIKE $${params.length - 1} OR website ILIKE $${params.length})`;
  }

  sql += ' ORDER BY sent_at DESC';
  const res = await db.query(sql, params);
  return { success: true, data: res.rows || [] };
}
