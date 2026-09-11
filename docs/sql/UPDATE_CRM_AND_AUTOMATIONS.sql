-- ============================================
-- 1. TABELAS DE AUTOMAÇÃO
-- ============================================

-- Tabela principal de automações
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    workflow_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    trigger_type TEXT DEFAULT 'manual',
    version INTEGER DEFAULT 1
);

-- Políticas RLS para Automações
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to automations" ON public.automations;
CREATE POLICY "Allow public read access to automations" ON public.automations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert to automations" ON public.automations;
CREATE POLICY "Allow public insert to automations" ON public.automations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to automations" ON public.automations;
CREATE POLICY "Allow public update to automations" ON public.automations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete to automations" ON public.automations;
CREATE POLICY "Allow public delete to automations" ON public.automations FOR DELETE TO authenticated USING (true);

-- Tabela de Logs de Automação
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
    lead_id TEXT,
    status TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Políticas RLS para Logs
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to logs" ON public.automation_logs;
CREATE POLICY "Allow public read access to logs" ON public.automation_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow public insert to logs" ON public.automation_logs;
CREATE POLICY "Allow public insert to logs" ON public.automation_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Função RPC para incrementar execuções
CREATE OR REPLACE FUNCTION public.increment_automation_count(automation_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.automations
    SET run_count = run_count + 1,
        last_run = timezone('utc'::text, now())
    WHERE id = automation_uuid;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 2. TABELA DE CERTIFICADOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.certificates (
    id BIGSERIAL PRIMARY KEY,
    certificate_id TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    website TEXT NOT NULL,
    qscore INTEGER NOT NULL,
    qgrade TEXT NOT NULL,
    metrics JSONB,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    full_certificate JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read to certificates" ON public.certificates;
CREATE POLICY "Allow public read to certificates" ON public.certificates FOR SELECT TO authenticated, anon USING (true);

DROP POLICY IF EXISTS "Allow public insert to certificates" ON public.certificates;
CREATE POLICY "Allow public insert to certificates" ON public.certificates FOR INSERT TO authenticated, anon WITH CHECK (true);


-- ============================================
-- 3. TABELA DE LOGS DE CONTACTO
-- ============================================
CREATE TABLE IF NOT EXISTS public.contacts_log (
    id BIGSERIAL PRIMARY KEY,
    lead_name TEXT,
    website TEXT,
    type TEXT,
    phone TEXT,
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.contacts_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public CRUD to contacts_log" ON public.contacts_log;
CREATE POLICY "Allow public CRUD to contacts_log" ON public.contacts_log FOR ALL TO authenticated USING (true);


-- ============================================
-- 4. COLUNAS ADICIONAIS EM LEAD_ANALYSES
-- ============================================
ALTER TABLE public.lead_analyses
  ADD COLUMN IF NOT EXISTS third_party_services JSONB,
  ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'EMPRESA',
  ADD COLUMN IF NOT EXISTS agent_intel TEXT,
  ADD COLUMN IF NOT EXISTS agent_intel_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS extracted_phones JSONB;
