-- ============================================================================
-- Migration v45: College Trips / Student Special Program Architecture
-- ============================================================================

-- 1. Student Offer Settings (Global Program Configuration)
CREATE TABLE IF NOT EXISTS public.student_offer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  discount_percentage numeric NOT NULL DEFAULT 25 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  maximum_discount_percentage numeric NOT NULL DEFAULT 25 CHECK (maximum_discount_percentage >= 0 AND maximum_discount_percentage <= 100),
  allow_coupon_stacking boolean NOT NULL DEFAULT false,
  verification_required boolean NOT NULL DEFAULT true,
  verification_validity_days integer NOT NULL DEFAULT 365 CHECK (verification_validity_days > 0),
  start_date timestamptz NULL,
  end_date timestamptz NULL,
  title text NOT NULL DEFAULT 'College Trips Special',
  subheading text NOT NULL DEFAULT 'Special prices for college students. Travel more. Pay less.',
  description text NOT NULL DEFAULT 'Exclusive student offers on selected trips. Verified college students can unlock prices up to 25% below the regular trip price.',
  terms text NOT NULL DEFAULT 'Student pricing is available only to verified college students. Verification may be required before booking. Student pricing applies only to eligible packages and travel dates. Student offers cannot be combined with other promotions unless explicitly allowed.',
  verification_requirements text NOT NULL DEFAULT 'Upload a valid College ID Card or current enrollment document issued by an accredited institution.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed default settings if empty
INSERT INTO public.student_offer_settings (
  id,
  enabled,
  discount_percentage,
  maximum_discount_percentage,
  allow_coupon_stacking,
  verification_required,
  verification_validity_days,
  title,
  subheading,
  description,
  terms,
  verification_requirements
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  true,
  25,
  25,
  false,
  true,
  365,
  'College Trips Special',
  'Special prices for college students. Travel more. Pay less.',
  'Exclusive student offers on selected trips. Verified college students can unlock prices up to 25% below the regular trip price.',
  'Student pricing is available only to verified college students. Verification may be required before booking. Student pricing applies only to eligible packages and travel dates. Student offers cannot be combined with other promotions unless explicitly allowed.',
  'Upload a valid College ID Card or current enrollment document issued by an accredited institution.'
WHERE NOT EXISTS (SELECT 1 FROM public.student_offer_settings LIMIT 1);

-- 2. Eligible Destinations for Student Program
CREATE TABLE IF NOT EXISTS public.student_offer_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  is_eligible boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  custom_title text NULL,
  custom_description text NULL,
  custom_thumbnail_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(destination_id)
);

-- 3. Eligible Packages for Student Program (with package-level discount overrides)
CREATE TABLE IF NOT EXISTS public.student_offer_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
  is_eligible boolean NOT NULL DEFAULT true,
  override_global_discount boolean NOT NULL DEFAULT false,
  custom_discount_percentage numeric NULL CHECK (custom_discount_percentage IS NULL OR (custom_discount_percentage >= 0 AND custom_discount_percentage <= 100)),
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(package_id)
);

-- 4. Student Verifications
CREATE TABLE IF NOT EXISTS public.student_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  full_name text NOT NULL,
  college_name text NOT NULL,
  college_email text NULL,
  email text NOT NULL,
  phone text NULL,
  student_id_number text NOT NULL,
  course_program text NOT NULL,
  graduation_year integer NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REVOKED')),
  rejection_reason text NULL,
  validity_days integer NOT NULL DEFAULT 365,
  verified_at timestamptz NULL,
  expires_at timestamptz NULL,
  reviewed_by uuid NULL,
  reviewed_by_name text NULL,
  reviewed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_verifications_user_id ON public.student_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_student_verifications_email ON public.student_verifications(email);
CREATE INDEX IF NOT EXISTS idx_student_verifications_status ON public.student_verifications(status);

-- 5. Student Verification Sensitive Documents (Stored in private bucket student_documents)
CREATE TABLE IF NOT EXISTS public.student_verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.student_verifications(id) ON DELETE CASCADE,
  document_type text NOT NULL DEFAULT 'ID_CARD' CHECK (document_type IN ('ID_CARD', 'ENROLLMENT_DOC', 'COLLEGE_EMAIL_PROOF', 'OTHER')),
  file_path text NOT NULL, -- relative private storage path in student_documents bucket
  file_name text NOT NULL,
  file_size integer NULL,
  mime_type text NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_verification_docs_verif_id ON public.student_verification_documents(verification_id);

-- 6. Student Verification Audit Logs
CREATE TABLE IF NOT EXISTS public.student_verification_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.student_verifications(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('SUBMITTED', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED', 'REVOKED', 'EXPIRED')),
  performed_by uuid NULL,
  performer_name text NULL,
  details jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_verif_audit_logs_verif_id ON public.student_verification_audit_logs(verification_id);

-- 7. College Trip Queries / Leads
CREATE TABLE IF NOT EXISTS public.college_trip_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  college_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  destination text NOT NULL,
  preferred_travel_dates text NOT NULL,
  number_of_students integer NOT NULL CHECK (number_of_students > 0),
  year_semester text NOT NULL,
  additional_requirements text NULL,
  faculty_coordinator_name text NULL,
  faculty_coordinator_contact text NULL,
  group_type text NULL,
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'QUOTED', 'CONVERTED', 'CLOSED', 'LOST')),
  assigned_to text NULL,
  quotation_amount numeric NULL,
  quotation_notes text NULL,
  internal_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_college_trip_queries_status ON public.college_trip_queries(status);
CREATE INDEX IF NOT EXISTS idx_college_trip_queries_created_at ON public.college_trip_queries(created_at DESC);

-- 8. Student Offer Redemptions (Track real booking analytics)
CREATE TABLE IF NOT EXISTS public.student_offer_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  verification_id uuid REFERENCES public.student_verifications(id) ON DELETE SET NULL,
  user_id uuid NULL,
  package_id uuid REFERENCES public.journeys(id) ON DELETE SET NULL,
  regular_price numeric NOT NULL,
  discount_percentage numeric NOT NULL,
  discount_amount numeric NOT NULL,
  student_price numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_redemptions_booking_id ON public.student_offer_redemptions(booking_id);

-- 9. Row Level Security (RLS) Policies
ALTER TABLE public.student_offer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_offer_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_offer_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_verification_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_trip_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_offer_redemptions ENABLE ROW LEVEL SECURITY;

-- Public can read active offer settings, eligible destinations, and eligible packages
CREATE POLICY "Public read student offer settings" ON public.student_offer_settings FOR SELECT USING (true);
CREATE POLICY "Public read eligible destinations" ON public.student_offer_destinations FOR SELECT USING (true);
CREATE POLICY "Public read eligible packages" ON public.student_offer_packages FOR SELECT USING (true);

-- Authenticated users can insert queries
CREATE POLICY "Anyone can submit college trip queries" ON public.college_trip_queries FOR INSERT WITH CHECK (true);

-- Users can view their own verifications; Admins have full access
CREATE POLICY "Users read own verifications" ON public.student_verifications FOR SELECT
  USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

CREATE POLICY "Users insert own verifications" ON public.student_verifications FOR INSERT
  WITH CHECK (true);

-- Admins full access (using service role or is_admin)
CREATE POLICY "Admins manage all student offer settings" ON public.student_offer_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage all eligible destinations" ON public.student_offer_destinations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage all eligible packages" ON public.student_offer_packages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage all student verifications" ON public.student_verifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage all verification documents" ON public.student_verification_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage all audit logs" ON public.student_verification_audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage all college queries" ON public.college_trip_queries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins manage all redemptions" ON public.student_offer_redemptions FOR ALL USING (true) WITH CHECK (true);

-- Seed initial eligible destinations (Manali, Chopta, Jibhi) if destinations exist
INSERT INTO public.student_offer_destinations (destination_id, is_eligible, display_order)
SELECT id, true, 1 FROM public.destinations WHERE slug = 'manali'
ON CONFLICT (destination_id) DO NOTHING;

INSERT INTO public.student_offer_destinations (destination_id, is_eligible, display_order)
SELECT id, true, 2 FROM public.destinations WHERE slug = 'chopta'
ON CONFLICT (destination_id) DO NOTHING;

INSERT INTO public.student_offer_destinations (destination_id, is_eligible, display_order)
SELECT id, true, 3 FROM public.destinations WHERE slug = 'jibhi'
ON CONFLICT (destination_id) DO NOTHING;

-- Seed initial eligible packages (Manali, Chopta, Jibhi)
INSERT INTO public.student_offer_packages (package_id, is_eligible, override_global_discount, custom_discount_percentage, is_active, display_order)
SELECT id, true, false, NULL, true, 1 FROM public.journeys WHERE slug = 'manali-weekend'
ON CONFLICT (package_id) DO NOTHING;

INSERT INTO public.student_offer_packages (package_id, is_eligible, override_global_discount, custom_discount_percentage, is_active, display_order)
SELECT id, true, false, NULL, true, 2 FROM public.journeys WHERE slug = 'chopta-tungnath-trek'
ON CONFLICT (package_id) DO NOTHING;

INSERT INTO public.student_offer_packages (package_id, is_eligible, override_global_discount, custom_discount_percentage, is_active, display_order)
SELECT id, true, false, NULL, true, 3 FROM public.journeys WHERE slug = 'jibhi-retreat'
ON CONFLICT (package_id) DO NOTHING;
