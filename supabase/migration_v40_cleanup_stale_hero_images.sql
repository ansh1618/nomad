-- Migration v40: Cleanup stale test screenshot URLs from destinations and journeys tables

UPDATE destinations 
SET hero_image = '/images/jibhi/jibhi-raghupur-fort-temple.jpg'
WHERE (slug LIKE '%jibhi%' OR name LIKE '%Jibhi%') AND (hero_image LIKE '%media_%' OR hero_image LIKE '%178%' OR hero_image LIKE '%schema%' OR hero_image LIKE '%booking%');

UPDATE destinations 
SET hero_image = '/images/manali/manali-snow-valley.jpg'
WHERE (slug LIKE '%manali%' OR name LIKE '%Manali%') AND (hero_image LIKE '%media_%' OR hero_image LIKE '%178%' OR hero_image LIKE '%schema%' OR hero_image LIKE '%booking%');

UPDATE journeys 
SET hero_banner = '/images/jibhi/jibhi-raghupur-fort-temple.jpg'
WHERE (slug LIKE '%jibhi%' OR name LIKE '%Jibhi%') AND (hero_banner LIKE '%media_%' OR hero_banner LIKE '%178%' OR hero_banner LIKE '%schema%' OR hero_banner LIKE '%booking%');

UPDATE journeys 
SET hero_banner = '/images/manali/manali-snow-valley.jpg'
WHERE (slug LIKE '%manali%' OR name LIKE '%Manali%') AND (hero_banner LIKE '%name%' OR hero_banner LIKE '%media_%' OR hero_banner LIKE '%178%' OR hero_banner LIKE '%schema%' OR hero_banner LIKE '%booking%');
