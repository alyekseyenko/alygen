-- ============================================
-- ATUALIZAÇÃO DA TABELA: email_sequences
-- Copie e cole este código no SQL Editor do seu Supabase
-- ============================================

-- 1. Garantir que a tabela existe com a estrutura base
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT,
  lead_name TEXT,
  email TEXT UNIQUE NOT NULL,
  website TEXT,
  template TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  followup1_sent_at TIMESTAMP WITH TIME ZONE,
  followup2_sent_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  paused BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar colunas para RASTREIO DE ABERTURA (se não existirem)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='email_sequences' AND column_name='open_count') THEN
        ALTER TABLE email_sequences ADD COLUMN open_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='email_sequences' AND column_name='first_opened_at') THEN
        ALTER TABLE email_sequences ADD COLUMN first_opened_at TIMESTAMP WITH TIME ZONE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='email_sequences' AND column_name='last_opened_at') THEN
        ALTER TABLE email_sequences ADD COLUMN last_opened_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- 3. Adicionar coluna para ARQUIVO DO CORPO DO EMAIL (Novo Pedido)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='email_sequences' AND column_name='email_body') THEN
        ALTER TABLE email_sequences ADD COLUMN email_body TEXT;
    END IF;
END $$;

-- 4. Habilitar RLS (Segurança)
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

-- 5. Criar Políticas de Acesso
DO $$ 
BEGIN 
    -- Política para o backend (anon/authenticated)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_sequences' AND policyname='Allow all for anon') THEN
        CREATE POLICY "Allow all for anon" ON email_sequences FOR ALL TO anon USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_sequences' AND policyname='Allow all for authenticated') THEN
        CREATE POLICY "Allow all for authenticated" ON email_sequences FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='email_sequences' AND policyname='Allow all for service role') THEN
        CREATE POLICY "Allow all for service role" ON email_sequences FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

COMMENT ON COLUMN email_sequences.email_body IS 'Armazena o conteúdo HTML do último email enviado para este lead';
COMMENT ON COLUMN email_sequences.open_count IS 'Número total de vezes que os emails da sequência foram abertos';
