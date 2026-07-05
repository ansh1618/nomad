-- ==========================================
-- NOMADIK V3 — TRAVEL ERP PRODUCTION SCHEMA
-- ==========================================

-- STEP 0: Cleanup Old Tables (Run with caution in production)
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.booking_travellers CASCADE;
DROP TABLE IF EXISTS public.coupon_usages CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.departure_inventory CASCADE;
DROP TABLE IF EXISTS public.departure_rooms CASCADE;
DROP TABLE IF EXISTS public.departure_transport CASCADE;
DROP TABLE IF EXISTS public.bus_seats CASCADE;
DROP TABLE IF EXISTS public.hotel_rooms CASCADE;
DROP TABLE IF EXISTS public.hotels CASCADE;
DROP TABLE IF EXISTS public.buses CASCADE;
DROP TABLE IF EXISTS public.departures CASCADE;
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.blogs CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.gallery CASCADE;
DROP TABLE IF EXISTS public.journeys CASCADE;
DROP TABLE IF EXISTS public.destinations CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- Drop old types
DROP TYPE IF EXISTS public.booking_state_enum CASCADE;
DROP TYPE IF EXISTS public.payment_status_enum CASCADE;
DROP TYPE IF EXISTS public.admin_role_enum CASCADE;
DROP TYPE IF EXISTS public.notification_type_enum CASCADE;
DROP TYPE IF EXISTS public.notification_status_enum CASCADE;

-- ==========================================
-- STEP 1: EXTENSIONS & CUSTOM TYPES
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE public.booking_state_enum AS ENUM (
    'CREATED', 'SEAT_LOCKED', 'PAYMENT_PENDING', 'PARTIAL_PAID', 
    'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'REFUNDED'
);

CREATE TYPE public.payment_status_enum AS ENUM (
    'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
);

CREATE TYPE public.admin_role_enum AS ENUM (
    'SUPER_ADMIN', 'ADMIN', 'TRIP_MANAGER', 'HOTEL_MANAGER', 'SUPPORT', 'ACCOUNTANT'
);

CREATE TYPE public.notification_type_enum AS ENUM (
    'EMAIL', 'WHATSAPP', 'SMS', 'PUSH'
);

CREATE TYPE public.notification_status_enum AS ENUM (
    'PENDING', 'SENT', 'FAILED'
);

-- Helper function to auto-update `updated_at`
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Booking ID Generator
CREATE SEQUENCE IF NOT EXISTS booking_id_seq START 1;
CREATE OR REPLACE FUNCTION generate_booking_id()
RETURNS TRIGGER AS $$
BEGIN
    NEW.booking_id := 'NOM-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('booking_id_seq')::text, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check Admin Access
CREATE OR REPLACE FUNCTION has_role(required_roles public.admin_role_enum[])
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins 
        WHERE id = auth.uid() AND role = ANY(required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- STEP 2: CORE PLATFORM TABLES
-- ==========================================

-- Settings
CREATE TABLE public.settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    category text NOT NULL,
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Users & Admins
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text UNIQUE NOT NULL,
    email text UNIQUE,
    wallet_balance numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.admins (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    role public.admin_role_enum NOT NULL DEFAULT 'SUPPORT',
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Destinations & Journeys
CREATE TABLE public.destinations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    subtitle text,
    hero_image text,
    hero_video text,
    description text,
    seo jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.journeys (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    destination_id uuid REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL,
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    duration text NOT NULL,
    difficulty text,
    distance text,
    best_season text,
    pickup_point text,
    drop_point text,
    itinerary jsonb, -- [{day: 1, title: "", desc: ""}]
    inclusions jsonb,
    exclusions jsonb,
    packing_list jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


-- ==========================================
-- STEP 3: VENDORS (Buses & Hotels)
-- ==========================================

CREATE TABLE public.buses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    registration_number text UNIQUE,
    total_seats integer NOT NULL,
    layout_type text, -- e.g., '2x2', 'sleeper'
    amenities jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.bus_seats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    bus_id uuid REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
    seat_number text NOT NULL, -- e.g., '1A', '1B'
    is_sleeper boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(bus_id, seat_number)
);

CREATE TABLE public.hotels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
    name text NOT NULL,
    location text,
    rating numeric,
    amenities jsonb,
    gallery jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.hotel_rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    hotel_id uuid REFERENCES public.hotels(id) ON DELETE CASCADE NOT NULL,
    room_type text NOT NULL, -- e.g., 'Deluxe', 'Suite'
    capacity integer NOT NULL,
    amenities jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- ==========================================
-- STEP 4: DEPARTURES & INVENTORY
-- ==========================================

CREATE TABLE public.departures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
    departure_date date NOT NULL,
    return_date date NOT NULL,
    base_price numeric NOT NULL,
    dynamic_pricing_modifier numeric DEFAULT 1.0, -- Used for early bird or peak pricing
    status text DEFAULT 'UPCOMING', -- UPCOMING, ONGOING, COMPLETED, CANCELLED
    trip_captain_id uuid REFERENCES public.admins(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Which bus is assigned to this departure?
CREATE TABLE public.departure_transport (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
    bus_id uuid REFERENCES public.buses(id) ON DELETE RESTRICT NOT NULL,
    driver_name text,
    driver_phone text,
    pickup_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Which rooms in which hotels are allocated to this departure?
CREATE TABLE public.departure_rooms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
    hotel_room_id uuid REFERENCES public.hotel_rooms(id) ON DELETE RESTRICT NOT NULL,
    allocated_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- The actual ledger for seats/rooms for locking and booking
CREATE TABLE public.departure_inventory (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    departure_id uuid REFERENCES public.departures(id) ON DELETE CASCADE NOT NULL,
    seat_id uuid REFERENCES public.bus_seats(id), -- If it's a seat
    room_id uuid REFERENCES public.hotel_rooms(id), -- If it's a room bed
    inventory_type text NOT NULL, -- 'SEAT', 'ROOM_BED'
    status text DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'LOCKED', 'BOOKED'
    locked_by uuid REFERENCES auth.users(id),
    locked_at timestamp with time zone,
    booking_id uuid, -- Will be set when booked
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


-- ==========================================
-- STEP 5: COUPONS
-- ==========================================

CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    code text UNIQUE NOT NULL,
    discount_type text NOT NULL, -- 'PERCENTAGE', 'FLAT'
    discount_value numeric NOT NULL,
    min_order_amount numeric DEFAULT 0,
    max_discount_amount numeric,
    valid_from timestamp with time zone NOT NULL,
    valid_until timestamp with time zone,
    max_redemptions integer,
    current_redemptions integer DEFAULT 0,
    first_booking_only boolean DEFAULT false,
    destination_id uuid REFERENCES public.destinations(id), -- Specific to a destination
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- ==========================================
-- STEP 6: BOOKINGS & TRANSACTIONS
-- ==========================================

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id text UNIQUE, -- NOM-2026-0001
    user_id uuid REFERENCES public.users(id) ON DELETE RESTRICT NOT NULL,
    departure_id uuid REFERENCES public.departures(id) ON DELETE RESTRICT NOT NULL,
    
    status public.booking_state_enum DEFAULT 'CREATED',
    
    traveller_count integer NOT NULL,
    base_amount numeric NOT NULL,
    addon_amount numeric DEFAULT 0,
    gst_amount numeric NOT NULL,
    coupon_id uuid REFERENCES public.coupons(id),
    discount_amount numeric DEFAULT 0,
    total_amount numeric NOT NULL, -- (base + addon - discount) + gst
    amount_paid numeric DEFAULT 0,
    
    razorpay_order_id text,
    razorpay_payment_id text,
    razorpay_signature text,
    
    cancellation_reason text,
    
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.booking_travellers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    is_primary boolean DEFAULT false,
    full_name text NOT NULL,
    gender text,
    dob date,
    phone text,
    email text,
    aadhaar_number text,
    passport_number text,
    food_preference text,
    medical_conditions text,
    emergency_contact_name text,
    emergency_contact_phone text,
    pickup_point text,
    assigned_seat_id uuid REFERENCES public.departure_inventory(id),
    assigned_room_id uuid REFERENCES public.departure_inventory(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL,
    status public.payment_status_enum DEFAULT 'PENDING',
    payment_gateway text DEFAULT 'RAZORPAY',
    transaction_id text UNIQUE,
    receipt_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.invoices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    invoice_number text UNIQUE NOT NULL,
    pdf_url text,
    amount numeric NOT NULL,
    issued_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.coupon_usages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id uuid REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
    booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    discount_applied numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- ==========================================
-- STEP 7: MARKETING & OPERATIONS
-- ==========================================

CREATE TABLE public.wishlist (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    journey_id uuid REFERENCES public.journeys(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, journey_id)
);

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type public.notification_type_enum NOT NULL,
    status public.notification_status_enum DEFAULT 'PENDING',
    subject text,
    content text NOT NULL,
    scheduled_for timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.blogs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    author_id uuid REFERENCES public.admins(id),
    content text NOT NULL, -- Markdown
    featured_image text,
    is_published boolean DEFAULT false,
    seo jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


-- ==========================================
-- STEP 8: TRIGGERS & INDEXES
-- ==========================================

CREATE TRIGGER generate_booking_id_trigger
    BEFORE INSERT ON public.bookings
    FOR EACH ROW WHEN (NEW.booking_id IS NULL)
    EXECUTE FUNCTION generate_booking_id();

-- Indexes for performance on 50k+ bookings
CREATE INDEX idx_departures_journey ON public.departures(journey_id);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_departure ON public.bookings(departure_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_departure_inv_status ON public.departure_inventory(status);
CREATE INDEX idx_payments_booking ON public.payments(booking_id);

-- Update Triggers
CREATE TRIGGER update_settings_mod BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_destinations_mod BEFORE UPDATE ON public.destinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journeys_mod BEFORE UPDATE ON public.journeys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departures_mod BEFORE UPDATE ON public.departures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_departure_inventory_mod BEFORE UPDATE ON public.departure_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_mod BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_mod BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_mod BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blogs_mod BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ==========================================
-- STEP 9: ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Default block all
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departure_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_travellers ENABLE ROW LEVEL SECURITY;

-- Public read access for marketing pages
CREATE POLICY "Public: Read destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Public: Read journeys" ON public.journeys FOR SELECT USING (true);
CREATE POLICY "Public: Read active departures" ON public.departures FOR SELECT USING (status IN ('UPCOMING', 'ONGOING'));
CREATE POLICY "Public: Read inventory availability" ON public.departure_inventory FOR SELECT USING (true);
CREATE POLICY "Public: Read settings" ON public.settings FOR SELECT USING (category <> 'private');

-- User restricted access
CREATE POLICY "Users: Read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users: Update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users: Read own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users: Insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users: Read own travellers" ON public.booking_travellers FOR SELECT USING (
    booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
);
CREATE POLICY "Users: Insert own travellers" ON public.booking_travellers FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM public.bookings WHERE user_id = auth.uid())
);

-- Admins get full access (Simplified for brevity, can be expanded to granular roles later)
CREATE POLICY "Admins: Full access" ON public.bookings FOR ALL USING (has_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'TRIP_MANAGER']::public.admin_role_enum[]));
CREATE POLICY "Admins: Inventory access" ON public.departure_inventory FOR ALL USING (has_role(ARRAY['SUPER_ADMIN', 'ADMIN', 'TRIP_MANAGER']::public.admin_role_enum[]));

