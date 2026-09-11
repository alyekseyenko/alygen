-- Tabela de log de contactos (email + whatsapp)
CREATE TABLE IF NOT EXISTS contacts_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_name text,
  website text,
  type text NOT NULL,        -- 'email' | 'whatsapp'
  recipient text,            -- email address
  phone text,                -- phone number
  message text,              -- mensagem whatsapp
  sent_at timestamptz DEFAULT now()
);

-- Index para busca por website
CREATE INDEX IF NOT EXISTS contacts_log_website_idx ON contacts_log(website);
CREATE INDEX IF NOT EXISTS contacts_log_type_idx ON contacts_log(type);

-- RLS (permitir tudo para anon key)
ALTER TABLE contacts_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON contacts_log FOR ALL USING (true) WITH CHECK (true);
