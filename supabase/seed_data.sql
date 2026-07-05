-- Seed Destinations
INSERT INTO public.destinations (slug, name, subtitle, hero_image, description, weather, how_to_reach, seo) VALUES (
    'manali',
    'Manali',
    'Gateway to the majestic Solang Valley and Rohtang Pass',
    '/assets/dest-manali.jpg',
    'Nestled in the Beas River valley, Manali is a premium high-altitude Himalayan resort town. It is a magnet for road travelers, backpackers, and adventure enthusiasts seeking gorgeous pine forests, snow-clad peaks, and co-traveler connections.',
    '{"summer":"15°C to 25°C · Pleasant and clear skies.","monsoon":"10°C to 18°C · Heavy rainfall; landslides possible, caution advised.","winter":"-2°C to 10°C · Sub-zero temperatures with heavy snowfall."}'::jsonb,
    '{"road":"Direct overnight semi-sleeper Volvo buses run daily from Delhi NCR (approx 12-14 hours, 540 KM).","rail":"Nearest broad gauge railhead is Ambala Cantt (340 km) or Chandigarh (310 km).","air":"Nearest domestic airport is Bhuntar (Kullu), located 50 km south of Manali."}'::jsonb,
    '{"title":"Manali Tour Packages | Nomadik","description":"Gateway to the majestic Solang Valley and Rohtang Pass"}'::jsonb
  ) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.destinations (slug, name, subtitle, hero_image, description, weather, how_to_reach, seo) VALUES (
    'jibhi',
    'Jibhi',
    'An untouched fairytale hamlet in the Tirthan Valley',
    '/assets/dest-jibhi.jpg',
    'Jibhi is a serene, scenic hamlet nestled in the lush green pine forests of Himachal''s Tirthan Valley. Renowned for its traditional wooden architecture, crystal-clear streams, and cozy treehouses, it is the ultimate retreat for slow travelers and nature lovers.',
    '{"summer":"12°C to 22°C · Warm days, cool nights; ideal for trekking.","monsoon":"8°C to 15°C · High humidity, heavy rain showers; lush greenery.","winter":"-1°C to 12°C · Very cold, occasional snowfall in nearby Jalori Pass."}'::jsonb,
    '{"road":"Delhi to Aut tunnel via bus (11 hours), followed by a local cab to Jibhi (approx 1 hour, 35 KM).","rail":"Nearest railway station is Shimla (150 km) or Joginder Nagar (120 km).","air":"Nearest airport is Bhuntar (Kullu), which is 60 km from Jibhi."}'::jsonb,
    '{"title":"Jibhi Tour Packages | Nomadik","description":"An untouched fairytale hamlet in the Tirthan Valley"}'::jsonb
  ) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.destinations (slug, name, subtitle, hero_image, description, weather, how_to_reach, seo) VALUES (
    'chopta-tungnath',
    'Chopta & Tungnath',
    'The Mini Switzerland of Uttarakhand and the highest Shiva temple',
    '/assets/pkg-adventure.jpg',
    'Chopta is an unspoiled natural destination lying in the laps of the Uttarakhand Himalayas. Serving as the base for the Tungnath temple and Chandrashila peak trek, it offers stunning alpine meadows (Bugyals) and 360-degree views of majestic snow-peaks.',
    '{"summer":"10°C to 20°C · Extremely pleasant; lush green meadows.","monsoon":"6°C to 14°C · Misty atmosphere, heavy rains; landslides common.","winter":"-5°C to 8°C · Frozen landscape, temple doors close; heavy snow."}'::jsonb,
    '{"road":"Well connected by road to Rishikesh/Haridwar (approx 7-8 hours drive, 200 KM). All group departures start from Rishikesh.","rail":"Nearest railhead is Rishikesh railway station, which is 200 km away.","air":"Nearest airport is Jolly Grant Airport, Dehradun (220 km)."}'::jsonb,
    '{"title":"Chopta & Tungnath Tour Packages | Nomadik","description":"The Mini Switzerland of Uttarakhand and the highest Shiva temple"}'::jsonb
  ) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.destinations (slug, name, subtitle, hero_image, description, weather, how_to_reach, seo) VALUES (
    'mcleodganj',
    'McLeod Ganj',
    'The vibrant home of His Holiness the Dalai Lama',
    '/assets/dest-kashmir.jpg',
    'McLeod Ganj, a suburb of Dharamshala in Himachal Pradesh, is affectionately known as ''Little Lhasa''. Nestled in the Dhauladhar range, it boasts a unique blend of Tibetan culture, spiritual monasteries, breathtaking cafes, and classic trails like Triund.',
    '{"summer":"18°C to 28°C · Sunny and breezy; ideal for outdoor exploration.","monsoon":"12°C to 20°C · Very heavy rainfall; mist covers the mountains.","winter":"2°C to 12°C · Chilly, with freezing winds and occasional snow at Triund."}'::jsonb,
    '{"road":"Direct overnight buses run from Delhi Kashmiri Gate (approx 10-12 hours, 480 KM).","rail":"Nearest broad gauge rail station is Pathankot (85 km away).","air":"Nearest airport is Gaggal Airport (Kangra), located 20 km from McLeod Ganj."}'::jsonb,
    '{"title":"McLeod Ganj Tour Packages | Nomadik","description":"The vibrant home of His Holiness the Dalai Lama"}'::jsonb
  ) ON CONFLICT (slug) DO NOTHING;
INSERT INTO public.destinations (slug, name, subtitle, hero_image, description, weather, how_to_reach, seo) VALUES (
    'udaipur',
    'Udaipur',
    'The majestic City of Lakes and royal Mewar history',
    '/assets/dest-udaipur.jpg',
    'Udaipur, the historic capital of the kingdom of Mewar, is a premium cultural destination in Rajasthan. Famous for its pristine lakes, grand palaces, heritage Havelis, and scenic Aravali roads, it is the perfect weekend escape for heritage and art lovers.',
    '{"summer":"28°C to 40°C · Hot and dry days; pleasant evenings by the lake.","monsoon":"24°C to 32°C · Rain turns the surrounding Aravali hills green.","winter":"10°C to 25°C · Cozy, pleasant weather; ideal for street walking."}'::jsonb,
    '{"road":"Direct highway connectivity via NH 48 from Ahmedabad (4 hours) or Delhi/NCR (11 hours).","rail":"Udaipur City Railway Station is well connected to all major Indian metros.","air":"Maharana Pratap Airport is 22 km from the city center, with daily direct flights."}'::jsonb,
    '{"title":"Udaipur Tour Packages | Nomadik","description":"The majestic City of Lakes and royal Mewar history"}'::jsonb
  ) ON CONFLICT (slug) DO NOTHING;

-- Seed Journeys

  INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, itinerary, hotel, food, gallery)
  SELECT id, 'manali-weekend', 'Manali Weekend Escape', 8999, '3 Nights / 4 Days', 'Tempo Traveller / Self Drive Option', 'Easy', '540 KM', 'Year-Round', '12-18 Explorers', NULL, 'Premium Stays / Camps', 'Meals Included as per Itinerary', '["/assets/dest-manali.jpg"]'::jsonb
  FROM public.destinations WHERE slug = 'manali'
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, itinerary, hotel, food, gallery)
  SELECT id, 'jibhi-tirthan', 'Jibhi & Tirthan Valley Expedition', 10999, '4 Nights / 5 Days', 'Premium Force Traveller', 'Moderate', '490 KM', 'March–November', '12-16 Explorers', NULL, 'Premium Stays / Camps', 'Meals Included as per Itinerary', '["/assets/dest-jibhi.jpg"]'::jsonb
  FROM public.destinations WHERE slug = 'jibhi'
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, itinerary, hotel, food, gallery)
  SELECT id, 'chopta-tungnath-trek', 'Chopta Tungnath Trek & Camp', 6999, '3 Nights / 4 Days', 'AC Traveller from Rishikesh', 'Moderate', '200 KM (From Rishikesh)', 'April–December', '14-20 Explorers', NULL, 'Premium Stays / Camps', 'Meals Included as per Itinerary', '["/assets/pkg-adventure.jpg"]'::jsonb
  FROM public.destinations WHERE slug = 'chopta-tungnath'
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, itinerary, hotel, food, gallery)
  SELECT id, 'mcleod-bir', 'McLeod Ganj & Bir Billing Adventure', 9499, '4 Nights / 5 Days', 'AC Semi-Sleeper Coach', 'Moderate', '480 KM', 'September–June', '15-22 Explorers', NULL, 'Premium Stays / Camps', 'Meals Included as per Itinerary', '["/assets/dest-kashmir.jpg"]'::jsonb
  FROM public.destinations WHERE slug = 'mcleodganj'
  ON CONFLICT (slug) DO NOTHING;

  INSERT INTO public.journeys (destination_id, slug, name, price, duration, transport, difficulty, distance, season, group_size, itinerary, hotel, food, gallery)
  SELECT id, 'udaipur-weekend', 'Udaipur Oasis Weekend Journey', 7999, '3 Nights / 4 Days', 'AC Sedan / SUV Convoy', 'Easy', '660 KM', 'September–March', '10-14 Explorers', NULL, 'Premium Stays / Camps', 'Meals Included as per Itinerary', '["/assets/dest-udaipur.jpg"]'::jsonb
  FROM public.destinations WHERE slug = 'udaipur'
  ON CONFLICT (slug) DO NOTHING;
