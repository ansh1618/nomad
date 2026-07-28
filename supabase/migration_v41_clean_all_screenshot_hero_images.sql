-- Migration v41: Purge stale screenshot URLs from destinations & journeys tables

-- 1. Manali
UPDATE destinations
SET 
  hero_image = '/images/manali/manali-snow-valley.jpg',
  thumbnail = '/images/manali/manali-snow-valley.jpg',
  cover_image = '/images/manali/manali-snow-valley.jpg'
WHERE slug LIKE '%manali%' OR name LIKE '%Manali%';

UPDATE journeys
SET 
  hero_banner = '/images/manali/manali-snow-valley.jpg',
  thumbnail = '/images/manali/manali-snow-valley.jpg',
  cover_image = '/images/manali/manali-snow-valley.jpg'
WHERE slug LIKE '%manali%' OR name LIKE '%Manali%';

-- 2. Jibhi & Tirthan
UPDATE destinations
SET 
  hero_image = '/images/jibhi/jibhi-raghupur-fort-temple.jpg',
  thumbnail = '/images/jibhi/jibhi-raghupur-fort-temple.jpg',
  cover_image = '/images/jibhi/jibhi-raghupur-fort-temple.jpg'
WHERE slug LIKE '%jibhi%' OR name LIKE '%Jibhi%';

UPDATE journeys
SET 
  hero_banner = '/images/jibhi/jibhi-raghupur-fort-temple.jpg',
  thumbnail = '/images/jibhi/jibhi-raghupur-fort-temple.jpg',
  cover_image = '/images/jibhi/jibhi-raghupur-fort-temple.jpg'
WHERE slug LIKE '%jibhi%' OR name LIKE '%Jibhi%';

-- 3. McLeod Ganj & Dharamshala
UPDATE destinations
SET 
  hero_image = '/images/mcleodganj/mcleodganj-town-view.jpg',
  thumbnail = '/images/mcleodganj/mcleodganj-town-view.jpg',
  cover_image = '/images/mcleodganj/mcleodganj-town-view.jpg'
WHERE slug LIKE '%mcleod%' OR name LIKE '%McLeod%' OR slug LIKE '%dharamshala%' OR name LIKE '%Dharamshala%';

UPDATE journeys
SET 
  hero_banner = '/images/mcleodganj/mcleodganj-town-view.jpg',
  thumbnail = '/images/mcleodganj/mcleodganj-town-view.jpg',
  cover_image = '/images/mcleodganj/mcleodganj-town-view.jpg'
WHERE slug LIKE '%mcleod%' OR name LIKE '%McLeod%' OR slug LIKE '%dharamshala%' OR name LIKE '%Dharamshala%';

-- 4. Udaipur
UPDATE destinations
SET 
  hero_image = '/images/udaipur-palace.png',
  thumbnail = '/images/udaipur-palace.png',
  cover_image = '/images/udaipur-palace.png'
WHERE slug LIKE '%udaipur%' OR name LIKE '%Udaipur%';

UPDATE journeys
SET 
  hero_banner = '/images/udaipur-palace.png',
  thumbnail = '/images/udaipur-palace.png',
  cover_image = '/images/udaipur-palace.png'
WHERE slug LIKE '%udaipur%' OR name LIKE '%Udaipur%';

-- 5. Chopta & Tungnath
UPDATE destinations
SET 
  hero_image = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
  thumbnail = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
  cover_image = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80'
WHERE slug LIKE '%chopta%' OR name LIKE '%Chopta%';

UPDATE journeys
SET 
  hero_banner = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
  thumbnail = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80',
  cover_image = 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80'
WHERE slug LIKE '%chopta%' OR name LIKE '%Chopta%';
