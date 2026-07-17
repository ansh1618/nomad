-- Create FAQ Library table
CREATE TABLE IF NOT EXISTS public.faq_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Booking', 'Transport', 'Stay', 'Meals', 'Safety', 'Cancellation', 'Payment', 'Packing', 'Food', 'Weather', 'Activities')),
    featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Package FAQs mapping table
CREATE TABLE IF NOT EXISTS public.package_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
    faq_id UUID NOT NULL REFERENCES public.faq_library(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(package_id, faq_id)
);

-- Create Custom Package FAQs table (for package-specific unique questions)
CREATE TABLE IF NOT EXISTS public.custom_package_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Booking', 'Transport', 'Stay', 'Meals', 'Safety', 'Cancellation', 'Payment', 'Packing', 'Food', 'Weather', 'Activities')),
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_package_faqs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (safe re-run)
DROP POLICY IF EXISTS "Public: read faq_library" ON public.faq_library;
DROP POLICY IF EXISTS "Public: read package_faqs" ON public.package_faqs;
DROP POLICY IF EXISTS "Public: read custom_package_faqs" ON public.custom_package_faqs;
DROP POLICY IF EXISTS "Admins: full access faq_library" ON public.faq_library;
DROP POLICY IF EXISTS "Admins: full access package_faqs" ON public.package_faqs;
DROP POLICY IF EXISTS "Admins: full access custom_package_faqs" ON public.custom_package_faqs;

-- Public read access policies
CREATE POLICY "Public: read faq_library" ON public.faq_library
    FOR SELECT USING (status = 'active');

CREATE POLICY "Public: read package_faqs" ON public.package_faqs
    FOR SELECT USING (true);

CREATE POLICY "Public: read custom_package_faqs" ON public.custom_package_faqs
    FOR SELECT USING (true);

-- Admin read/write policies
CREATE POLICY "Admins: full access faq_library" ON public.faq_library
    FOR ALL USING (true);

CREATE POLICY "Admins: full access package_faqs" ON public.package_faqs
    FOR ALL USING (true);

CREATE POLICY "Admins: full access custom_package_faqs" ON public.custom_package_faqs
    FOR ALL USING (true);
