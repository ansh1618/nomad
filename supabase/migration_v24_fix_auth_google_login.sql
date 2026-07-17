-- Migration v24: Fix Google Login constraints
-- Drop UNIQUE and NOT NULL constraints on public.users.phone to prevent crashes on multiple social logins

ALTER TABLE public.users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_phone_key;

-- Also update the handle_new_user trigger to insert NULL if phone is empty/null,
-- allowing multiple nulls under standard Postgres columns.
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
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
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
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'phone', ''), ''),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
