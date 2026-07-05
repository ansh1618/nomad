-- ==========================================
-- NOMADIK V2 — PHASE 1 SEED DATA
-- Run AFTER schema_v2.sql
-- Only Phase 1 destinations are seeded
-- ==========================================

-- ============ DESTINATIONS ============

INSERT INTO public.destinations (slug, name, subtitle, hero_image, description, weather, how_to_reach, seo) VALUES
(
    'manali',
    'Manali',
    'Gateway to the majestic Solang Valley and Rohtang Pass',
    '/assets/dest-manali.jpg',
    'Nestled in the Beas River valley, Manali is a premium high-altitude Himalayan resort town. It is a magnet for road travelers, backpackers, and adventure enthusiasts seeking gorgeous pine forests, snow-clad peaks, and co-traveler connections.',
    '{"summer":"15°C to 25°C · Pleasant and clear skies.","monsoon":"10°C to 18°C · Heavy rainfall; landslides possible, caution advised.","winter":"-2°C to 10°C · Sub-zero temperatures with heavy snowfall."}'::jsonb,
    '{"road":"Direct overnight semi-sleeper Volvo buses run daily from Delhi NCR (approx 12-14 hours, 540 KM).","rail":"Nearest broad gauge railhead is Ambala Cantt (340 km) or Chandigarh (310 km).","air":"Nearest domestic airport is Bhuntar (Kullu), located 50 km south of Manali."}'::jsonb,
    '{"title":"Manali Road Trip | Nomadik","description":"Gateway to the majestic Solang Valley and Rohtang Pass"}'::jsonb
),
(
    'jibhi',
    'Jibhi',
    'An untouched fairytale hamlet in the Tirthan Valley',
    '/assets/dest-jibhi.jpg',
    'Jibhi is a serene, scenic hamlet nestled in the lush green pine forests of Himachal''s Tirthan Valley. Renowned for its traditional wooden architecture, crystal-clear streams, and cozy treehouses, it is the ultimate retreat for slow travelers and nature lovers.',
    '{"summer":"12°C to 22°C · Warm days, cool nights; ideal for trekking.","monsoon":"8°C to 15°C · High humidity, heavy rain showers; lush greenery.","winter":"-1°C to 12°C · Very cold, occasional snowfall in nearby Jalori Pass."}'::jsonb,
    '{"road":"Delhi to Aut tunnel via bus (11 hours), followed by a local cab to Jibhi (approx 1 hour, 35 KM).","rail":"Nearest railway station is Shimla (150 km) or Joginder Nagar (120 km).","air":"Nearest airport is Bhuntar (Kullu), which is 60 km from Jibhi."}'::jsonb,
    '{"title":"Jibhi Trip | Nomadik","description":"An untouched fairytale hamlet in the Tirthan Valley"}'::jsonb
),
(
    'chopta-tungnath',
    'Chopta & Tungnath',
    'The Meadows of Uttarakhand and the World''s Highest Shiva Temple',
    '/assets/dest-chopta.jpg',
    'Chopta is often called the ''Mini Switzerland of Uttarakhand'' and serves as the base for the Tungnath-Chandrashila trek — the highest Shiva temple in the world. Its rolling meadows, dense rhododendron forests, and dramatic Himalayan vistas make it a spiritual and natural paradise.',
    '{"summer":"8°C to 20°C · Pleasant; ideal for the Tungnath trek.","monsoon":"5°C to 15°C · Lush greenery; light rains, leeches possible on trek.","winter":"-10°C to 5°C · Heavy snowfall; Tungnath temple closes; not recommended."}'::jsonb,
    '{"road":"Haridwar to Ukhimath via bus, then local cab to Chopta (total approx 10 hours from Delhi).","rail":"Nearest railway station is Haridwar (220 km) or Rishikesh (210 km).","air":"Nearest airport is Jolly Grant (Dehradun), which is 220 km from Chopta."}'::jsonb,
    '{"title":"Chopta & Tungnath Trek | Nomadik","description":"The World''s Highest Shiva Temple Trek"}'::jsonb
),
(
    'mcleodganj',
    'McLeod Ganj',
    'The vibrant home of His Holiness the Dalai Lama',
    '/assets/dest-mcleodganj.jpg',
    'McLeod Ganj, a suburb of Dharamshala in Himachal Pradesh, is affectionately known as ''Little Lhasa''. Nestled in the Dhauladhar range, it boasts a unique blend of Tibetan culture, spiritual monasteries, breathtaking cafes, and classic trails like Triund.',
    '{"summer":"18°C to 28°C · Sunny and breezy; ideal for outdoor exploration.","monsoon":"12°C to 20°C · Very heavy rainfall; mist covers the mountains.","winter":"2°C to 12°C · Chilly, with freezing winds and occasional snow at Triund."}'::jsonb,
    '{"road":"Direct overnight buses run from Delhi Kashmiri Gate (approx 10-12 hours, 480 KM).","rail":"Nearest broad gauge rail station is Pathankot (85 km away).","air":"Nearest airport is Gaggal Airport (Kangra), located 20 km from McLeod Ganj."}'::jsonb,
    '{"title":"McLeod Ganj Trip | Nomadik","description":"The vibrant home of His Holiness the Dalai Lama"}'::jsonb
),
(
    'udaipur',
    'Udaipur',
    'The majestic City of Lakes and royal Mewar history',
    '/assets/dest-udaipur.jpg',
    'Udaipur, the historic capital of the kingdom of Mewar, is a premium cultural destination in Rajasthan. Famous for its pristine lakes, grand palaces, heritage Havelis, and scenic Aravali roads, it is the perfect weekend escape for heritage and art lovers.',
    '{"summer":"28°C to 40°C · Hot and dry days; pleasant evenings by the lake.","monsoon":"24°C to 32°C · Rain turns the surrounding Aravali hills green.","winter":"10°C to 25°C · Cozy, pleasant weather; ideal for street walking."}'::jsonb,
    '{"road":"Direct highway connectivity via NH 48 from Ahmedabad (4 hours) or Delhi/NCR (11 hours).","rail":"Udaipur City Railway Station is well connected to all major Indian metros.","air":"Maharana Pratap Airport is 22 km from the city center, with daily direct flights."}'::jsonb,
    '{"title":"Udaipur Weekend Trip | Nomadik","description":"The majestic City of Lakes and royal Mewar history"}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;


-- ============ JOURNEYS ============

INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, pickup_point, drop_point, max_capacity, remaining_seats, itinerary, hotel, food, gallery)
SELECT
    id,
    'manali-weekend',
    'Manali Weekend Escape',
    8999,
    '3 Nights / 4 Days',
    'Tempo Traveller / Self Drive Option',
    'Easy',
    '540 KM',
    'Year-Round',
    '12-18 Explorers',
    'Delhi (Majnu Ka Tila Bus Stand)',
    'Delhi (Majnu Ka Tila)',
    18,
    18,
    '[
        {"day": 1, "title": "Delhi → Manali (Overnight Drive)", "description": "Depart from Delhi in the evening via Volvo/Tempo Traveller. Travel overnight through the scenic Himalayan foothills."},
        {"day": 2, "title": "Arrive Manali — Explore Old Manali", "description": "Arrive morning. Check-in, freshen up. Visit Hadimba Devi Temple, stroll through Van Vihar, explore Old Manali cafes and Manu Market."},
        {"day": 3, "title": "Solang Valley / Rohtang Pass Adventure", "description": "Full day excursion to Solang Valley (skiing, paragliding, ropeway) or Rohtang Pass (seasonal). Evening bonfire at camp."},
        {"day": 4, "title": "Manali → Delhi (Return)", "description": "Post breakfast, depart for Delhi. Arrive late night."}
    ]'::jsonb,
    'Cozy Boutique Guesthouses / Riverside Camps',
    'Breakfast + Dinner Included',
    '["/assets/dest-manali.jpg"]'::jsonb
FROM public.destinations WHERE slug = 'manali'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, pickup_point, drop_point, max_capacity, remaining_seats, itinerary, hotel, food, gallery)
SELECT
    id,
    'jibhi-retreat',
    'Jibhi Forest Retreat',
    7499,
    '2 Nights / 3 Days',
    'Tempo Traveller',
    'Easy',
    '520 KM',
    'March – November',
    '10-16 Explorers',
    'Delhi (Majnu Ka Tila Bus Stand)',
    'Delhi (Majnu Ka Tila)',
    16,
    16,
    '[
        {"day": 1, "title": "Delhi → Jibhi (Overnight Drive)", "description": "Depart Delhi evening. Drive through Chandigarh, Bilaspur, Mandi, and Aut tunnel into the lush Tirthan Valley."},
        {"day": 2, "title": "Jibhi — Forest Walks & Waterfall", "description": "Morning nature walk to Jibhi waterfall. Afternoon free for treehouse exploration, stream dipping, and cafe hopping. Evening bonfire."},
        {"day": 3, "title": "Jalori Pass → Delhi Return", "description": "Morning hike to Jalori Pass (seasonal) for panoramic views. Post lunch, drive back to Delhi."}
    ]'::jsonb,
    'Treehouse Stays / Forest Cottages',
    'Breakfast + Dinner Included',
    '["/assets/dest-jibhi.jpg"]'::jsonb
FROM public.destinations WHERE slug = 'jibhi'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, pickup_point, drop_point, max_capacity, remaining_seats, itinerary, hotel, food, gallery)
SELECT
    id,
    'chopta-tungnath-trek',
    'Chopta & Tungnath Trek',
    6999,
    '3 Nights / 4 Days',
    'Tempo Traveller',
    'Moderate',
    '450 KM',
    'April – June, Sept – Nov',
    '12-16 Explorers',
    'Delhi (Kashmiri Gate ISBT)',
    'Delhi (Kashmiri Gate ISBT)',
    16,
    16,
    '[
        {"day": 1, "title": "Delhi → Haridwar → Chopta (Drive)", "description": "Early morning depart. Drive via Haridwar, Rishikesh, Devprayag, Rudraprayag, Ukhimath into Chopta meadows. Overnight camp."},
        {"day": 2, "title": "Tungnath & Chandrashila Summit", "description": "Pre-dawn trek to Tungnath Temple (3680m) and Chandrashila Peak (4090m). 360° Himalayan panorama — Nanda Devi, Trishul, Kedarnath range. Descend by afternoon."},
        {"day": 3, "title": "Deoria Tal — Reflection Lake", "description": "Morning drive to Sari village. Trek to Deoria Tal — mirror lake reflecting the Chaukhamba peaks. Evening leisure in Ukhimath."},
        {"day": 4, "title": "Chopta → Delhi Return", "description": "Post breakfast, drive back to Delhi via Haridwar. Arrive late night."}
    ]'::jsonb,
    'Forest Rest House / Tented Camps',
    'All Meals Included (Camp Food)',
    '["/assets/dest-chopta.jpg"]'::jsonb
FROM public.destinations WHERE slug = 'chopta-tungnath'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, pickup_point, drop_point, max_capacity, remaining_seats, itinerary, hotel, food, gallery)
SELECT
    id,
    'mcleodganj-dharamshala',
    'McLeod Ganj & Dharamshala Experience',
    7999,
    '3 Nights / 4 Days',
    'Volvo Bus + Local Cabs',
    'Easy',
    '480 KM',
    'Year-Round',
    '12-18 Explorers',
    'Delhi (Kashmiri Gate ISBT)',
    'Delhi (Kashmiri Gate ISBT)',
    18,
    18,
    '[
        {"day": 1, "title": "Delhi → McLeod Ganj (Overnight Bus)", "description": "Evening departure from Delhi. Arrive McLeod Ganj by early morning."},
        {"day": 2, "title": "McLeod Ganj — Tibetan Culture & Cafes", "description": "Visit Namgyal Monastery, Tibet Museum, Bhagsu Nag Waterfall. Explore the famous Israeli-Tibetan cafe strip of Bhagsu Road."},
        {"day": 3, "title": "Triund Trek (Optional) + Dharamshala Cricket Stadium", "description": "Optional half-day Triund trek (5 km, moderate). Afternoon visit to HPCA Cricket Stadium. Evening in Dharamshala market."},
        {"day": 4, "title": "McLeod Ganj → Delhi Return", "description": "Post breakfast, board return Volvo. Arrive Delhi late night."}
    ]'::jsonb,
    'Boutique Stays in Bhagsu / McLeod Ganj',
    'Breakfast Included',
    '["/assets/dest-mcleodganj.jpg"]'::jsonb
FROM public.destinations WHERE slug = 'mcleodganj'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, pickup_point, drop_point, max_capacity, remaining_seats, itinerary, hotel, food, gallery)
SELECT
    id,
    'udaipur-weekend',
    'Udaipur Royal Weekend',
    9499,
    '2 Nights / 3 Days',
    'Sleeper Bus / Flight',
    'Easy',
    '660 KM',
    'October – March',
    '12-18 Explorers',
    'Delhi (Sarai Kale Khan ISBT)',
    'Delhi (Sarai Kale Khan ISBT)',
    18,
    18,
    '[
        {"day": 1, "title": "Delhi → Udaipur (Overnight Travel)", "description": "Overnight sleeper bus or early morning flight to Udaipur. Check-in at lake-view heritage property."},
        {"day": 2, "title": "City Palace, Lake Pichola & Vintage Car Museum", "description": "Morning visit to City Palace (UNESCO listed). Afternoon boat ride on Lake Pichola to Jag Mandir. Visit Vintage Car Museum. Sunset at Sajjangarh (Monsoon Palace)."},
        {"day": 3, "title": "Saheliyon Ki Bari + Bagor Ki Haveli → Return", "description": "Morning visit to Saheliyon Ki Bari and Fateh Sagar Lake. Cultural show at Bagor Ki Haveli. Depart for return journey."}
    ]'::jsonb,
    'Lake-View Heritage Hotels',
    'Breakfast Included',
    '["/assets/dest-udaipur.jpg"]'::jsonb
FROM public.destinations WHERE slug = 'udaipur'
ON CONFLICT (slug) DO NOTHING;


-- ============ TRIP BATCHES ============
-- Sample upcoming batches for July-August 2026

INSERT INTO public.trip_batches (journey_id, departure_date, return_date, pickup_point, capacity, available_seats, status)
SELECT id, '2026-07-12', '2026-07-15', 'Delhi (Majnu Ka Tila Bus Stand)', 18, 18, 'UPCOMING'
FROM public.journeys WHERE slug = 'manali-weekend' ON CONFLICT DO NOTHING;

INSERT INTO public.trip_batches (journey_id, departure_date, return_date, pickup_point, capacity, available_seats, status)
SELECT id, '2026-07-19', '2026-07-22', 'Delhi (Majnu Ka Tila Bus Stand)', 18, 18, 'UPCOMING'
FROM public.journeys WHERE slug = 'manali-weekend' ON CONFLICT DO NOTHING;

INSERT INTO public.trip_batches (journey_id, departure_date, return_date, pickup_point, capacity, available_seats, status)
SELECT id, '2026-07-26', '2026-07-29', 'Delhi (Majnu Ka Tila Bus Stand)', 18, 18, 'UPCOMING'
FROM public.journeys WHERE slug = 'manali-weekend' ON CONFLICT DO NOTHING;

INSERT INTO public.trip_batches (journey_id, departure_date, return_date, pickup_point, capacity, available_seats, status)
SELECT id, '2026-07-18', '2026-07-20', 'Delhi (Majnu Ka Tila Bus Stand)', 16, 16, 'UPCOMING'
FROM public.journeys WHERE slug = 'jibhi-retreat' ON CONFLICT DO NOTHING;

INSERT INTO public.trip_batches (journey_id, departure_date, return_date, pickup_point, capacity, available_seats, status)
SELECT id, '2026-08-01', '2026-08-03', 'Delhi (Majnu Ka Tila Bus Stand)', 16, 16, 'UPCOMING'
FROM public.journeys WHERE slug = 'jibhi-retreat' ON CONFLICT DO NOTHING;

INSERT INTO public.trip_batches (journey_id, departure_date, return_date, pickup_point, capacity, available_seats, status)
SELECT id, '2026-07-24', '2026-07-27', 'Delhi (Kashmiri Gate ISBT)', 16, 16, 'UPCOMING'
FROM public.journeys WHERE slug = 'chopta-tungnath-trek' ON CONFLICT DO NOTHING;

INSERT INTO public.trip_batches (journey_id, departure_date, return_date, pickup_point, capacity, available_seats, status)
SELECT id, '2026-07-25', '2026-07-28', 'Delhi (Kashmiri Gate ISBT)', 18, 18, 'UPCOMING'
FROM public.journeys WHERE slug = 'mcleodganj-dharamshala' ON CONFLICT DO NOTHING;

INSERT INTO public.trip_batches (journey_id, departure_date, return_date, pickup_point, capacity, available_seats, status)
SELECT id, '2026-08-15', '2026-08-17', 'Delhi (Sarai Kale Khan ISBT)', 18, 18, 'UPCOMING'
FROM public.journeys WHERE slug = 'udaipur-weekend' ON CONFLICT DO NOTHING;

