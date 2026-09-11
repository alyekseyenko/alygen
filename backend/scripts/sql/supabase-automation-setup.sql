-- 🤖 CREATE AUTOMATIONS TABLE
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    workflow_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0
);

-- 🔐 RLS POLICIES
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read automations (for the dashboard)
DROP POLICY IF EXISTS "Allow public read access to automations" ON public.automations;
CREATE POLICY "Allow public read access to automations"
ON public.automations FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to insert/update automations
DROP POLICY IF EXISTS "Allow public insert to automations" ON public.automations;
CREATE POLICY "Allow public insert to automations"
ON public.automations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to automations" ON public.automations;
CREATE POLICY "Allow public update to automations"
ON public.automations FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete to automations" ON public.automations;
CREATE POLICY "Allow public delete to automations"
ON public.automations FOR DELETE
TO anon, authenticated
USING (true);

-- 📊 CREATE AUTOMATION LOGS (History)
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    automation_id UUID REFERENCES public.automations(id) ON DELETE CASCADE,
    lead_id TEXT,
    status TEXT, -- 'success', 'failed', 'skipped'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to logs" ON public.automation_logs;
CREATE POLICY "Allow public read access to logs"
ON public.automation_logs FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public insert to logs" ON public.automation_logs;
CREATE POLICY "Allow public insert to logs"
ON public.automation_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 📈 RPC to increment run count
CREATE OR REPLACE FUNCTION public.increment_automation_count(automation_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.automations
    SET run_count = run_count + 1,
        last_run = timezone('utc'::text, now())
    WHERE id = automation_uuid;
END;
$$ LANGUAGE plpgsql;
