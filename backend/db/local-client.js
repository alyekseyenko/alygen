import crypto from 'crypto';
import db from '../services/local-db-service.js';

function parseOrFilter(orStr) {
  return String(orStr)
    .split(',')
    .map((part) => {
      const m = part.trim().match(/^([^.]+)\.([^.]+)\.(.+)$/);
      if (!m) return null;
      return { col: m[1], op: m[2], val: m[3] };
    })
    .filter(Boolean);
}

function normalizeAutomationRow(row) {
  if (!row) return row;
  if (row.workflow_data && typeof row.workflow_data === 'string') {
    try {
      row.workflow_data = JSON.parse(row.workflow_data);
    } catch {
      /* keep */
    }
  }
  if (!row.workflow_data && (row.nodes || row.edges)) {
    try {
      row.workflow_data = {
        nodes: row.nodes ? JSON.parse(row.nodes) : [],
        edges: row.edges ? JSON.parse(row.edges) : [],
      };
    } catch {
      row.workflow_data = { nodes: [], edges: [] };
    }
  }
  if (!row.trigger_type && row.trigger) row.trigger_type = row.trigger;
  if (row.is_active === 1 || row.is_active === '1') row.is_active = true;
  if (row.paused === 1 || row.paused === '1') row.paused = true;
  return row;
}

function normalizeRow(table, row) {
  if (table === 'automations') return normalizeAutomationRow(row);
  if (table === 'email_sequences' && row) {
    if (row.paused === 1) row.paused = true;
    if (row.paused === 0) row.paused = false;
  }
  if (table === 'automation_logs' && row?.details_json && !row.details) {
    try {
      row.details = JSON.parse(row.details_json);
    } catch {
      row.details = row.details_json;
    }
  }
  if (table === 'automation_logs' && row?.details && typeof row.details === 'string') {
    try {
      row.details = JSON.parse(row.details);
    } catch { /* keep */ }
  }
  if (table === 'automation_states' && row?.context && typeof row.context === 'string') {
    try {
      row.context = JSON.parse(row.context);
    } catch { /* keep */ }
  }
  return row;
}

class LocalQuery {
  constructor(table) {
    this.table = table;
    this.op = 'select';
    this.columns = '*';
    this.filters = [];
    this.orFilters = [];
    this.orderBy = null;
    this.limitN = null;
    this.payload = null;
    this.singleRow = false;
    this.joinAutomation = false;
  }

  select(cols) {
    this.op = 'select';
    this.columns = cols;
    if (String(cols).includes('automations(*)')) {
      this.joinAutomation = true;
    }
    return this;
  }

  insert(rows) {
    this.op = 'insert';
    this.payload = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  update(values) {
    this.op = 'update';
    this.payload = values;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(col, val) {
    this.filters.push({ type: 'eq', col, val });
    return this;
  }

  in(col, vals) {
    this.filters.push({ type: 'in', col, vals });
    return this;
  }

  lte(col, val) {
    this.filters.push({ type: 'lte', col, val });
    return this;
  }

  ilike(col, val) {
    this.filters.push({ type: 'ilike', col, val });
    return this;
  }

  or(expr) {
    this.orFilters = parseOrFilter(expr);
    return this;
  }

  order(col, { ascending = true } = {}) {
    this.orderBy = { col, ascending };
    return this;
  }

  limit(n) {
    this.limitN = n;
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  buildWhere(params) {
    const clauses = [];
    for (const f of this.filters) {
      if (f.type === 'eq') {
        if (f.col === 'is_active' && (f.val === true || f.val === 'true')) {
          clauses.push(`(${f.col} = 1 OR ${f.col} = true)`);
        } else {
          clauses.push(`${f.col} = $${params.length + 1}`);
          params.push(f.val);
        }
      } else if (f.type === 'in') {
        const placeholders = f.vals.map((v) => {
          params.push(v);
          return `$${params.length}`;
        });
        clauses.push(`${f.col} IN (${placeholders.join(', ')})`);
      } else if (f.type === 'lte') {
        clauses.push(`${f.col} <= $${params.length + 1}`);
        params.push(f.val);
      } else if (f.type === 'ilike') {
        clauses.push(`${f.col} ILIKE $${params.length + 1}`);
        params.push(typeof f.val === 'string' && !f.val.includes('%') ? `%${f.val}%` : f.val);
      }
    }
    if (this.orFilters.length) {
      const orParts = this.orFilters.map((f) => {
        params.push(f.val);
        return `${f.col} = $${params.length}`;
      });
      clauses.push(`(${orParts.join(' OR ')})`);
    }
    return clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  }

  async execute() {
    const params = [];
    try {
      if (this.op === 'select') {
        let sql = `SELECT ${this.columns === '*' ? '*' : this.columns} FROM ${this.table}`;
        sql += ` ${this.buildWhere(params)}`;
        if (this.orderBy) {
          sql += ` ORDER BY ${this.orderBy.col} ${this.orderBy.ascending ? 'ASC' : 'DESC'}`;
        }
        if (this.limitN) sql += ` LIMIT ${this.limitN}`;
        const result = await db.query(sql, params);
        let rows = (result.rows || []).map((r) => normalizeRow(this.table, { ...r }));

        if (this.joinAutomation && rows.length) {
          for (const row of rows) {
            const autoRes = await db.query('SELECT * FROM automations WHERE id = $1', [row.automation_id]);
            row.automations = normalizeAutomationRow(autoRes.rows[0] || null);
          }
        }

        if (this.singleRow) {
          const data = rows[0] || null;
          if (!data) return { data: null, error: { message: 'Row not found' } };
          return { data, error: null };
        }
        return { data: rows, error: null };
      }

      if (this.op === 'insert') {
        const inserted = [];
        for (const row of this.payload) {
          const record = { ...row };
          if (!record.id && this.table !== 'automation_logs') record.id = crypto.randomUUID();
          const jsonCols = new Set(['context', 'details', 'workflow_data', 'metadata', 'payload', 'full_certificate', 'metrics']);
          if (this.table === 'automation_logs' && record.details && typeof record.details === 'object') {
            record.details = JSON.stringify(record.details);
          }
          for (const key of Object.keys(record)) {
            if (jsonCols.has(key) && record[key] !== null && typeof record[key] === 'object') {
              record[key] = JSON.stringify(record[key]);
            }
          }
          const colNames = Object.keys(record);
          const placeholders = colNames.map((_, i) => `$${i + 1}`);
          const sql = `INSERT INTO ${this.table} (${colNames.join(', ')}) VALUES (${placeholders.join(', ')})`;
          await db.query(sql, colNames.map((c) => record[c]));
          inserted.push(record);
        }
        return { data: this.singleRow ? inserted[0] : inserted, error: null };
      }

      if (this.op === 'update') {
        const sets = Object.keys(this.payload).map((key) => {
          params.push(this.payload[key]);
          return `${key} = $${params.length}`;
        });
        const sql = `UPDATE ${this.table} SET ${sets.join(', ')} ${this.buildWhere(params)}`;
        await db.query(sql, params);
        return { data: null, error: null };
      }

      if (this.op === 'delete') {
        const sql = `DELETE FROM ${this.table} ${this.buildWhere(params)}`;
        await db.query(sql, params);
        return { data: null, error: null };
      }

      return { data: null, error: { message: 'Unknown operation' } };
    } catch (err) {
      return { data: null, error: { message: err.message } };
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

export const localDb = {
  from(table) {
    return new LocalQuery(table);
  },

  async rpc(fn, args = {}) {
    if (fn === 'increment_automation_count') {
      const id = args.automation_uuid;
      await db.query('UPDATE automations SET run_count = COALESCE(run_count, 0) + 1 WHERE id = $1', [id]);
      return { data: null, error: null };
    }
    return { data: null, error: { message: `RPC ${fn} not implemented` } };
  },
};

export default localDb;
