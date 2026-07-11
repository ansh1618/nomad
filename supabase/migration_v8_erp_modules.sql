-- ============================================================
-- NOMADIK ERP — MIGRATION v8: Missing Modules
-- Self-contained: works regardless of which prior schema ran.
-- No cross-table FK constraints defined inline — all added
-- conditionally via ALTER TABLE after table creation.
-- ============================================================

-- 0. Ensure helper trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. PATCH admins TABLE
-- ============================================================
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS is_active  boolean      DEFAULT true NOT NULL;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS full_name  text;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS phone      text;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS updated_at timestamptz  DEFAULT now();

-- Mark any NULL rows as active
UPDATE public.admins SET is_active = true WHERE is_active IS NULL;

-- To register your first Super Admin, uncomment and fill in the UUID:
-- INSERT INTO public.admins (id, email, role, full_name, is_active)
-- VALUES ('REPLACE_WITH_AUTH_UUID', 'owner@gonomadik.com', 'SUPER_ADMIN', 'Nomadik Owner', true)
-- ON CONFLICT (id) DO UPDATE SET role = 'SUPER_ADMIN', is_active = true;


-- ============================================================
-- 2. EMPLOYEES TABLE (Module 20)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.employee_role AS ENUM (
    'TRIP_CAPTAIN', 'DRIVER', 'GUIDE', 'PHOTOGRAPHER',
    'OPERATIONS', 'SUPPORT', 'SALES', 'HR', 'ACCOUNTANT'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.employment_status AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.employees (
    id                      uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name               text        NOT NULL,
    email                   text        UNIQUE,
    phone                   text        NOT NULL,
    role                    text        NOT NULL DEFAULT 'OPERATIONS',
    employment_status       text        NOT NULL DEFAULT 'ACTIVE',
    -- Identity
    date_of_birth           date,
    gender                  text        CHECK (gender IN ('Male', 'Female', 'Other')),
    address                 text,
    city                    text,
    aadhaar_number          text,
    pan_number              text,
    -- Compensation
    salary                  numeric,
    bank_account            text,
    ifsc_code               text,
    -- Documents
    profile_photo           text,
    aadhaar_url             text,
    -- Emergency
    emergency_contact_name  text,
    emergency_contact_phone text,
    joining_date            date        DEFAULT CURRENT_DATE,
    notes                   text,
    created_at              timestamptz DEFAULT now() NOT NULL,
    updated_at              timestamptz DEFAULT now() NOT NULL
);

DROP TRIGGER IF EXISTS employees_updated_at ON public.employees;
CREATE TRIGGER employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employees: admin full access" ON public.employees;
CREATE POLICY "Employees: admin full access" ON public.employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

CREATE INDEX IF NOT EXISTS idx_employees_role   ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(employment_status);


-- ============================================================
-- 3. EMPLOYEE ATTENDANCE (Module 20)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.attendance_type AS ENUM ('PRESENT', 'ABSENT', 'ON_TRIP', 'LEAVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.employee_attendance (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date        date        NOT NULL,
    status      text        NOT NULL DEFAULT 'PRESENT',
    notes       text,
    created_at  timestamptz DEFAULT now() NOT NULL,
    UNIQUE (employee_id, date)
);

ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Attendance: admin access" ON public.employee_attendance;
CREATE POLICY "Attendance: admin access" ON public.employee_attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );


-- ============================================================
-- 4. EXPENSES TABLE (Module 21 — Finance)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.expense_category AS ENUM (
    'HOTEL', 'BUS_RENTAL', 'DRIVER', 'FUEL', 'TOLL',
    'FOOD', 'GUIDE', 'ACTIVITY', 'MARKETING', 'SALARY',
    'OFFICE', 'INSURANCE', 'MISC'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.expense_status AS ENUM ('PENDING', 'APPROVED', 'PAID', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.expenses (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    title           text        NOT NULL,
    category        text        NOT NULL DEFAULT 'MISC',
    amount          numeric     NOT NULL,
    currency        text        DEFAULT 'INR' NOT NULL,
    expense_date    date        NOT NULL DEFAULT CURRENT_DATE,
    -- Soft links (no inline FK — added conditionally below)
    departure_id    uuid,
    employee_id     uuid,
    -- Payment
    payment_method  text        DEFAULT 'Cash' CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Card')),
    paid_to         text,
    receipt_url     text,
    -- Approval
    status          text        NOT NULL DEFAULT 'PENDING',
    approved_by     text,       -- admin id stored as text (type-safe)
    approved_at     timestamptz,
    notes           text,
    created_by      text,       -- admin id stored as text
    created_at      timestamptz DEFAULT now() NOT NULL,
    updated_at      timestamptz DEFAULT now() NOT NULL
);

-- Attach FK to employees (same file — safe)
DO $$ BEGIN
  ALTER TABLE public.expenses
    ADD CONSTRAINT fk_expenses_employee
    FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Attach FK to departures only if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'departures') THEN
    ALTER TABLE public.expenses
      ADD CONSTRAINT fk_expenses_departure
      FOREIGN KEY (departure_id) REFERENCES public.departures(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS expenses_updated_at ON public.expenses;
CREATE TRIGGER expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Expenses: admin access" ON public.expenses;
CREATE POLICY "Expenses: admin access" ON public.expenses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

CREATE INDEX IF NOT EXISTS idx_expenses_departure ON public.expenses(departure_id);
CREATE INDEX IF NOT EXISTS idx_expenses_employee  ON public.expenses(employee_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category  ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date      ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status    ON public.expenses(status);


-- ============================================================
-- 5. INVOICES TABLE (Module 12)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_invoice_number_v2()
RETURNS TRIGGER AS $$
BEGIN
    NEW.invoice_number := 'NM-INV-' || to_char(now(), 'YYYY') || '-'
                       || lpad(nextval('invoice_number_seq')::text, 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.invoices (
    id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number   text        UNIQUE,
    booking_id       uuid,       -- FK added conditionally below
    -- Customer snapshot (denormalized for permanence)
    customer_name    text        NOT NULL,
    customer_email   text,
    customer_phone   text,
    customer_address text,
    -- Trip snapshot
    trip_name        text,
    departure_date   date,
    -- Amounts
    base_amount      numeric     NOT NULL,
    discount_amount  numeric     DEFAULT 0,
    gst_rate         numeric     DEFAULT 5,
    gst_amount       numeric     DEFAULT 0,
    total_amount     numeric     NOT NULL,
    amount_paid      numeric     DEFAULT 0,
    balance_due      numeric     DEFAULT 0,
    -- GST
    gstin            text,
    hsn_code         text        DEFAULT '998551',
    -- Status
    status           text        NOT NULL DEFAULT 'DRAFT',
    issued_at        timestamptz,
    due_date         date,
    paid_at          timestamptz,
    -- PDF
    pdf_url          text,
    notes            text,
    created_by       text,       -- admin id as text
    created_at       timestamptz DEFAULT now() NOT NULL,
    updated_at       timestamptz DEFAULT now() NOT NULL
);

-- Attach FK to bookings if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    ALTER TABLE public.invoices
      ADD CONSTRAINT fk_invoices_booking
      FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS invoices_generate_number ON public.invoices;
CREATE TRIGGER invoices_generate_number
    BEFORE INSERT ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number_v2();

DROP TRIGGER IF EXISTS invoices_updated_at ON public.invoices;
CREATE TRIGGER invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Invoices: admin access" ON public.invoices;
CREATE POLICY "Invoices: admin access" ON public.invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

CREATE INDEX IF NOT EXISTS idx_invoices_booking ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status  ON public.invoices(status);


-- ============================================================
-- 6. TICKETS TABLE (Module 11 — Boarding Passes)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ticket_number := 'NM-TKT-' || to_char(now(), 'YYYYMM') || '-'
                      || lpad(nextval('ticket_number_seq')::text, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.tickets (
    id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_number  text        UNIQUE,
    booking_id     uuid        NOT NULL,   -- FK added conditionally below
    -- Traveler snapshot
    traveler_name  text        NOT NULL,
    traveler_phone text,
    -- Trip snapshot for PDF
    trip_name      text,
    departure_date date,
    return_date    date,
    pickup_point   text,
    drop_point     text,
    bus_number     text,
    captain_name   text,
    captain_phone  text,
    hotel_name     text,
    seat_number    text,
    room_type      text,
    -- QR & PDF
    qr_data        text,
    pdf_url        text,
    issued_at      timestamptz DEFAULT now(),
    is_void        boolean     DEFAULT false,
    created_at     timestamptz DEFAULT now() NOT NULL
);

-- Attach FK to bookings if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT fk_tickets_booking
      FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE RESTRICT;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS tickets_generate_number ON public.tickets;
CREATE TRIGGER tickets_generate_number
    BEFORE INSERT ON public.tickets
    FOR EACH ROW EXECUTE FUNCTION public.generate_ticket_number();

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tickets: admin access" ON public.tickets;
CREATE POLICY "Tickets: admin access" ON public.tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );

CREATE INDEX IF NOT EXISTS idx_tickets_booking ON public.tickets(booking_id);


-- ============================================================
-- 7. AUDIT LOGS TABLE (Module 24 — Super Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id    text,               -- stored as text — no FK (type-safe)
    admin_email text,
    action      text        NOT NULL,
    table_name  text,
    record_id   text,
    old_data    jsonb,
    new_data    jsonb,
    ip_address  text,
    user_agent  text,
    created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Audit: super admin only" ON public.audit_logs;
CREATE POLICY "Audit: super admin only" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id::text = auth.uid()::text
              AND role = 'SUPER_ADMIN'
              AND is_active = true
        )
    );
DROP POLICY IF EXISTS "Audit: system insert" ON public.audit_logs;
CREATE POLICY "Audit: system insert" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin   ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table   ON public.audit_logs(table_name);


-- ============================================================
-- 8. REFUNDS TABLE (Module 10)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.refund_status AS ENUM (
    'REQUESTED', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.refunds (
    id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id        uuid        NOT NULL,   -- FK added conditionally below
    amount            numeric     NOT NULL,
    reason            text        NOT NULL,
    status            text        NOT NULL DEFAULT 'REQUESTED',
    refund_method     text        DEFAULT 'Original Payment Method',
    gateway_refund_id text,
    processed_by      text,       -- admin id as text
    processed_at      timestamptz,
    customer_name     text,
    customer_phone    text,
    notes             text,
    created_at        timestamptz DEFAULT now() NOT NULL,
    updated_at        timestamptz DEFAULT now() NOT NULL
);

-- Attach FK to bookings if it exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'bookings') THEN
    ALTER TABLE public.refunds
      ADD CONSTRAINT fk_refunds_booking
      FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE RESTRICT;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP TRIGGER IF EXISTS refunds_updated_at ON public.refunds;
CREATE TRIGGER refunds_updated_at
    BEFORE UPDATE ON public.refunds
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Refunds: admin access" ON public.refunds;
CREATE POLICY "Refunds: admin access" ON public.refunds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id::text = auth.uid()::text AND is_active = true
        )
    );
DROP POLICY IF EXISTS "Refunds: public insert" ON public.refunds;
CREATE POLICY "Refunds: public insert" ON public.refunds
    FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_refunds_booking ON public.refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status  ON public.refunds(status);


-- ============================================================
-- VIEWS — Skipped here to avoid column name assumptions.
-- Run these MANUALLY in Supabase after confirming your bookings
-- table column names match.
--
-- Example monthly_revenue_summary (adjust column names as needed):
--
-- CREATE OR REPLACE VIEW public.monthly_revenue_summary AS
-- SELECT
--     date_trunc('month', created_at) AS month,
--     COUNT(*) AS total_bookings,
--     SUM(total_payable) FILTER (WHERE payment_status = 'Successful') AS confirmed_revenue,
--     SUM(total_payable) FILTER (WHERE payment_status = 'Pending')    AS pending_revenue,
--     SUM(discount_amount) AS total_discounts
-- FROM public.bookings
-- GROUP BY 1
-- ORDER BY 1 DESC;
-- ============================================================
-- BLOGS UPGRADE (safety addition)
-- ============================================================
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS gallery jsonb DEFAULT '[]';
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS category text DEFAULT 'Travel';
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS destination_id uuid;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS journey_id uuid;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS seo jsonb;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS read_time_minutes integer DEFAULT 5;

-- ============================================================
-- ✅ Migration v8 Complete
-- Tables created: employees, employee_attendance, expenses,
--                 invoices, tickets, audit_logs, refunds
-- ============================================================

