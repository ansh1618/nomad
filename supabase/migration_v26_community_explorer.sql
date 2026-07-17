-- Migration v26: Community Explorer Program and Referrals

-- 1. Create explorer_applications table
CREATE TABLE IF NOT EXISTS public.explorer_applications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    college text,
    city text NOT NULL,
    roles text[] NOT NULL, -- Array of ['Explorer', 'Creator', 'Ambassador', 'Trip Captain', 'Remote Team']
    instagram text,
    linkedin text,
    portfolio text,
    youtube text,
    why_join text NOT NULL,
    experience text,
    skills text,
    status text DEFAULT 'PENDING' NOT NULL, -- 'PENDING' | 'ACCEPTED' | 'REJECTED'
    internal_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on explorer_applications
ALTER TABLE public.explorer_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public insert applications" ON public.explorer_applications;
DROP POLICY IF EXISTS "Admin select/update/delete applications" ON public.explorer_applications;

-- Create policies
CREATE POLICY "Public insert applications" 
    ON public.explorer_applications FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin select/update/delete applications" 
    ON public.explorer_applications FOR ALL USING (true);

-- 2. Create explorer_referrals table
CREATE TABLE IF NOT EXISTS public.explorer_referrals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
    referred_booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
    reward_points integer DEFAULT 0 NOT NULL,
    cashback_amount numeric DEFAULT 0.00 NOT NULL,
    status text DEFAULT 'PENDING' NOT NULL, -- 'PENDING' | 'CREDITED' | 'CANCELLED'
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on explorer_referrals
ALTER TABLE public.explorer_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public select referrals" ON public.explorer_referrals;
CREATE POLICY "Public select referrals" ON public.explorer_referrals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin modify referrals" ON public.explorer_referrals;
CREATE POLICY "Admin modify referrals" ON public.explorer_referrals FOR ALL USING (true);
