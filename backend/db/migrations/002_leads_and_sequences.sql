CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  lead_name TEXT,
  lead_website TEXT,
  client_email TEXT,
  status TEXT DEFAULT 'LEAD',
  is_immune INTEGER DEFAULT 0,
  opt_out INTEGER DEFAULT 0,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_website ON leads(lead_website);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(client_email);

CREATE TABLE IF NOT EXISTS email_sequences (
  id TEXT PRIMARY KEY,
  lead_id TEXT,
  lead_name TEXT,
  email TEXT UNIQUE NOT NULL,
  website TEXT,
  template TEXT,
  email_body TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP,
  followup1_sent_at TIMESTAMP,
  followup2_sent_at TIMESTAMP,
  replied_at TIMESTAMP,
  paused INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  first_opened_at TIMESTAMP,
  last_opened_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_sequences_status ON email_sequences(status);
CREATE INDEX IF NOT EXISTS idx_email_sequences_sent_at ON email_sequences(sent_at);

CREATE TABLE IF NOT EXISTS lead_events (
  id TEXT PRIMARY KEY,
  lead_id TEXT,
  lead_website TEXT,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_lead_events_website ON lead_events(lead_website);
CREATE INDEX IF NOT EXISTS idx_lead_events_type ON lead_events(event_type);
