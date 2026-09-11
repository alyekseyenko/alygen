-- Fix RLS policies for automations table
DROP POLICY IF EXISTS "Allow public read access to automations" ON public.automations;
DROP POLICY IF EXISTS "Allow public insert to automations" ON public.automations;
DROP POLICY IF EXISTS "Allow public update to automations" ON public.automations;
DROP POLICY IF EXISTS "Allow public delete to automations" ON public.automations;

-- Create new policies that bypass RLS
CREATE POLICY "Allow all read access to automations"
ON public.automations FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow all insert to automations"
ON public.automations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow all update to automations"
ON public.automations FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all delete to automations"
ON public.automations FOR DELETE
TO anon, authenticated
USING (true);
