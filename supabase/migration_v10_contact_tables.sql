-- ================================================
-- COMPLETE STANDALONE MIGRATION FOR CONTACT & CRM TABLES
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/sgeffapbsrppzrgqfpec/sql/new
-- ================================================

-- 1. Ensure public.admins table exists
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'SUPPORT',
  full_name text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Ensure is_admin() security helper function exists
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$ 
BEGIN 
  RETURN EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()); 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix public INSERT access on inquiries table
DROP POLICY IF EXISTS "Allow public insert inquiries" ON public.inquiries;
CREATE POLICY "Allow public insert inquiries" ON public.inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage inquiries" ON public.inquiries;
CREATE POLICY "Admins can manage inquiries" ON public.inquiries FOR ALL USING (is_admin());

-- 4. Fix public INSERT access on contact_inquiries table
DROP POLICY IF EXISTS "Contact: insert" ON public.contact_inquiries;
CREATE POLICY "Contact: insert" ON public.contact_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage contact inquiries" ON public.contact_inquiries;
CREATE POLICY "Admins can manage contact inquiries" ON public.contact_inquiries FOR ALL USING (is_admin());

-- 5. Create/Alter consultation_requests table
CREATE TABLE IF NOT EXISTS public.consultation_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text NOT NULL,
  destination text,
  budget text,
  preferred_date date,
  preferred_time text,
  notes text,
  status text DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'RESOLVED', 'SPAM')),
  assigned_to uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  follow_up_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Alter to add columns if table existed already
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS destination text;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS budget text;
ALTER TABLE public.consultation_requests ADD COLUMN IF NOT EXISTS preferred_time text;

ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Consultation: insert" ON public.consultation_requests;
CREATE POLICY "Consultation: insert" ON public.consultation_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Consultation: admin" ON public.consultation_requests;
CREATE POLICY "Consultation: admin" ON public.consultation_requests FOR ALL USING (is_admin());

-- 6. Create/Alter callback_requests table
CREATE TABLE IF NOT EXISTS public.callback_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  preferred_time text,
  notes text,
  status text DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'RESOLVED', 'SPAM')),
  assigned_to uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  follow_up_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Alter to add columns if table existed already
ALTER TABLE public.callback_requests ADD COLUMN IF NOT EXISTS preferred_time text;

ALTER TABLE public.callback_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Callback: insert" ON public.callback_requests;
CREATE POLICY "Callback: insert" ON public.callback_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Callback: admin" ON public.callback_requests;
CREATE POLICY "Callback: admin" ON public.callback_requests FOR ALL USING (is_admin());

-- 7. Add CRM columns to contact_inquiries (for admin management)
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.admins(id) ON DELETE SET NULL;
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS follow_up_at timestamptz;
ALTER TABLE public.contact_inquiries ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 8. Automatically register anshjee2024aspirant@gmail.com as SUPER_ADMIN
INSERT INTO public.admins (id, email, role, full_name, is_active)
SELECT id, email, 'SUPER_ADMIN', 'Ansh Super Admin', true
FROM auth.users
WHERE email = 'anshjee2024aspirant@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Done!
SELECT 'Migration complete! All contact tables are now accessible.' AS status;
