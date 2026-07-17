-- ============================================================
-- Migration v18: Fix Media Assets RLS policies
-- ============================================================

-- 1. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Admins: Full access to media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "Public: Read media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "Admins: Insert media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "Admins: Update media_assets" ON public.media_assets;
DROP POLICY IF EXISTS "Admins: Delete media_assets" ON public.media_assets;

-- 2. Make sure RLS is enabled
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- 3. Create explicit policies for media_assets

-- Allow everyone to read media assets (so public site displays banners, images, etc.)
CREATE POLICY "Public: Read media_assets" 
  ON public.media_assets 
  FOR SELECT 
  USING (true);

-- Allow admins full access to insert, update, and delete media assets
CREATE POLICY "Admins: Insert media_assets" 
  ON public.media_assets 
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "Admins: Update media_assets" 
  ON public.media_assets 
  FOR UPDATE 
  USING (is_admin());

CREATE POLICY "Admins: Delete media_assets" 
  ON public.media_assets 
  FOR DELETE 
  USING (is_admin());
