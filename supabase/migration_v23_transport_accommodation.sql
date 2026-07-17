-- Migration v23: Transport & Accommodation tables
-- Create transport table
CREATE TABLE IF NOT EXISTS public.transport (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
    vehicle_name TEXT NOT NULL,
    vehicle_type TEXT,
    cover_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    features TEXT[] DEFAULT '{}',
    pickup_points TEXT[] DEFAULT '{}',
    drop_points TEXT[] DEFAULT '{}',
    departure_time TEXT,
    arrival_time TEXT,
    seat_capacity INTEGER DEFAULT 0,
    available_seats INTEGER DEFAULT 0,
    trip_captain BOOLEAN DEFAULT false,
    ac BOOLEAN DEFAULT false,
    music BOOLEAN DEFAULT false,
    charging_ports BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for transport
ALTER TABLE public.transport ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow anyone to view transport details
CREATE POLICY "Allow public read access to transport" ON public.transport
    FOR SELECT USING (true);

-- Admin policies: Allow authenticated admins to do everything
CREATE POLICY "Allow admin full access to transport" ON public.transport
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create accommodation table
CREATE TABLE IF NOT EXISTS public.accommodation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.journeys(id) ON DELETE CASCADE,
    hotel_name TEXT NOT NULL,
    hotel_category TEXT,
    location TEXT,
    cover_image TEXT,
    gallery TEXT[] DEFAULT '{}',
    room_types TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    google_maps TEXT,
    check_in TEXT,
    check_out TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for accommodation
ALTER TABLE public.accommodation ENABLE ROW LEVEL SECURITY;

-- Select policy: Allow anyone to view accommodation details
CREATE POLICY "Allow public read access to accommodation" ON public.accommodation
    FOR SELECT USING (true);

-- Admin policies: Allow authenticated admins to do everything
CREATE POLICY "Allow admin full access to accommodation" ON public.accommodation
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add triggers for updated_at tracking
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_transport_updated_at BEFORE UPDATE ON public.transport
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accommodation_updated_at BEFORE UPDATE ON public.accommodation
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
