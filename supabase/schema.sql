-- Create inquiries table
CREATE TABLE public.inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  destination text NOT NULL,
  journey text NOT NULL,
  travel_date text NOT NULL,
  travellers integer NOT NULL,
  message text,
  source text,
  status text DEFAULT 'New'::text,
  notes text
);

-- Create destinations table
CREATE TABLE public.destinations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  subtitle text,
  hero_image text,
  hero_video text,
  description text,
  weather jsonb,
  how_to_reach jsonb,
  gallery jsonb,
  seo jsonb
);

-- Create journeys table
CREATE TABLE public.journeys (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  destination_id uuid REFERENCES public.destinations(id),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  price integer NOT NULL,
  duration text NOT NULL,
  transport text,
  difficulty text,
  distance text,
  season text,
  group_size text,
  itinerary jsonb,
  hotel text,
  food text,
  gallery jsonb
);

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  destination text NOT NULL,
  rating integer NOT NULL,
  review text NOT NULL,
  photo text,
  approved boolean DEFAULT false
);

-- Create gallery table
CREATE TABLE public.gallery (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  destination text NOT NULL,
  image text NOT NULL,
  type text
);

-- RLS Setup (Optional but recommended for public facing app)
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

-- Allow public inserts into inquiries
CREATE POLICY "Allow public insert inquiries" ON public.inquiries FOR INSERT WITH CHECK (true);

-- Allow public read access to active entities
CREATE POLICY "Allow public read destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Allow public read journeys" ON public.journeys FOR SELECT USING (true);
CREATE POLICY "Allow public read approved reviews" ON public.reviews FOR SELECT USING (approved = true);
CREATE POLICY "Allow public read gallery" ON public.gallery FOR SELECT USING (true);
