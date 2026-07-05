-- ====================================================
-- NOMADIK V2 — AUTHENTICATION & DATA ENGINE EXPANSION
-- Run this SQL in your Supabase SQL Editor
-- ====================================================

-- 1. Expand public.users table with detailed profile attributes
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. Add user_id reference to bookings for user-centric tracking
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Create public.wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, journey_id)
);

-- 4. Create public.travellers table for Saved Travellers feature
CREATE TABLE IF NOT EXISTS public.travellers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    age integer NOT NULL,
    gender text NOT NULL,
    id_proof text,
    phone text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travellers ENABLE ROW LEVEL SECURITY;

-- 6. Setup RLS Policies for user profile management
DROP POLICY IF EXISTS "Users: Insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users: Read own profile" ON public.users;
DROP POLICY IF EXISTS "Users: Update own profile" ON public.users;

CREATE POLICY "Users: Insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users: Read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users: Update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 7. Setup RLS Policies for wishlist
DROP POLICY IF EXISTS "Users: View own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users: Modify own wishlist" ON public.wishlist;

CREATE POLICY "Users: View own wishlist" ON public.wishlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users: Modify own wishlist" ON public.wishlist FOR ALL USING (auth.uid() = user_id);

-- 8. Setup RLS Policies for saved travellers
DROP POLICY IF EXISTS "Users: View own saved travellers" ON public.travellers;
DROP POLICY IF EXISTS "Users: Modify own saved travellers" ON public.travellers;

CREATE POLICY "Users: View own saved travellers" ON public.travellers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users: Modify own saved travellers" ON public.travellers FOR ALL USING (auth.uid() = user_id);

-- 9. Update Bookings RLS policies for user level access
DROP POLICY IF EXISTS "Users: View own bookings" ON public.bookings;
CREATE POLICY "Users: View own bookings" ON public.bookings FOR SELECT USING (
  auth.uid() = user_id OR
  email = (SELECT email FROM public.users WHERE id = auth.uid()) OR
  phone = (SELECT phone FROM public.users WHERE id = auth.uid())
);
