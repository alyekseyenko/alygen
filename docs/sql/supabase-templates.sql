-- CREATE EMAIL TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE RESTRICTIONS (RLS)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read
DROP POLICY IF EXISTS "Allow public read access to templates" ON public.email_templates;
CREATE POLICY "Allow public read access to templates"
ON public.email_templates FOR SELECT
USING (true);

-- Allow anyone to insert
DROP POLICY IF EXISTS "Allow public insert to templates" ON public.email_templates;
CREATE POLICY "Allow public insert to templates"
ON public.email_templates FOR INSERT
WITH CHECK (true);

-- Allow anyone to update
DROP POLICY IF EXISTS "Allow public update to templates" ON public.email_templates;
CREATE POLICY "Allow public update to templates"
ON public.email_templates FOR UPDATE
USING (true);

-- Allow anyone to delete
DROP POLICY IF EXISTS "Allow public delete to templates" ON public.email_templates;
CREATE POLICY "Allow public delete to templates"
ON public.email_templates FOR DELETE
USING (true);
