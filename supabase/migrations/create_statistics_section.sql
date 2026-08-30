-- 1. Create statistics_section table
CREATE TABLE IF NOT EXISTS public.statistics_section (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Grant table permissions to roles
GRANT ALL ON TABLE public.statistics_section TO anon, authenticated, service_role;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.statistics_section ENABLE ROW LEVEL SECURITY;

-- 4. Allow public read access (for landing page visitors)
CREATE POLICY "Allow public read on statistics_section"
  ON public.statistics_section
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Allow authenticated users / admins to insert statistics section
CREATE POLICY "Allow authenticated insert on statistics_section"
  ON public.statistics_section
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Allow authenticated users / admins to update statistics section
CREATE POLICY "Allow authenticated update on statistics_section"
  ON public.statistics_section
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
