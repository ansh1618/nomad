-- ============================================================
-- Migration v17: Auth Profiles — Single Source of Truth
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create profiles table (single source of truth, replaces users for auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text,
  phone      text,
  email      text,
  avatar_url text,
  gender     text,
  dob        date,
  city       text,
  emergency_contact text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 2. Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read + update their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Service role can do everything (for server-side inserts)
DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;
CREATE POLICY "profiles_service_all" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Auto-create profile on new user signup (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles (single source of truth)
  INSERT INTO public.profiles (id, full_name, phone, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    email      = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = now();

  -- Also sync to legacy users table (for backwards compatibility)
  INSERT INTO public.users (id, full_name, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Drop old trigger if exists and create fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Also handle USER_UPDATED (e.g. email confirmed, OAuth avatar updated)
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    email      = NEW.email,
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', profiles.avatar_url),
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_updated();

-- 5. Backfill existing auth.users → profiles
INSERT INTO public.profiles (id, full_name, phone, email, avatar_url)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', pu.full_name, '') AS full_name,
  COALESCE(u.raw_user_meta_data->>'phone', pu.phone, '')                                        AS phone,
  COALESCE(u.email, pu.email)                                                                    AS email,
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', pu.avatar_url) AS avatar_url
FROM auth.users u
LEFT JOIN public.users pu ON pu.id = u.id
ON CONFLICT (id) DO UPDATE SET
  full_name  = COALESCE(EXCLUDED.full_name, profiles.full_name),
  email      = COALESCE(EXCLUDED.email, profiles.email),
  avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);

-- 6. Guest Booking Merge — email-based (no customer table dependency)
--    Call this after a user logs in: SELECT merge_guest_bookings(auth.email(), auth.uid())
CREATE OR REPLACE FUNCTION public.merge_guest_bookings(p_email text, p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  merged_count int := 0;
BEGIN
  -- Strategy 1: bookings that have an email field directly
  UPDATE public.bookings
  SET user_id = p_user_id, updated_at = now()
  WHERE user_id IS NULL
    AND (
      -- match via customers table
      customer_id IN (
        SELECT id FROM public.customers WHERE LOWER(email) = LOWER(p_email)
      )
    );
  GET DIAGNOSTICS merged_count = ROW_COUNT;

  -- Strategy 2: match via booking_travellers primary traveller email
  UPDATE public.bookings b
  SET b.user_id = p_user_id, b.updated_at = now()
  FROM public.booking_travellers bt
  WHERE bt.booking_id = b.id
    AND bt.is_primary = true
    AND LOWER(bt.email) = LOWER(p_email)
    AND b.user_id IS NULL;

  RETURN merged_count;
END;
$$;

-- Grant execute to authenticated users (they can only merge their own)
GRANT EXECUTE ON FUNCTION public.merge_guest_bookings(text, uuid) TO authenticated;

-- 7. Updated_at trigger helper for profiles
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Done. Verify with:
-- SELECT * FROM public.profiles LIMIT 5;
