-- 1. Create hero_section table
CREATE TABLE IF NOT EXISTS public.hero_section (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  heading TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Grant table permissions to roles
GRANT ALL ON TABLE public.hero_section TO anon, authenticated, service_role;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.hero_section ENABLE ROW LEVEL SECURITY;

-- 4. Allow public read access (for landing page visitors)
CREATE POLICY "Allow public read on hero_section"
  ON public.hero_section
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Allow authenticated users / admins to insert hero section
CREATE POLICY "Allow authenticated insert on hero_section"
  ON public.hero_section
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 6. Allow authenticated users / admins to update hero section
CREATE POLICY "Allow authenticated update on hero_section"
  ON public.hero_section
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
