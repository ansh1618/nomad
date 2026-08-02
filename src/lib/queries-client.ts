import { supabase } from "@/lib/supabase";
import { getPublishedDestinations, getDestinationBySlug as sharedGetDestinationBySlug } from "./queries/destinations";
import { getPublishedPackages, getPackageBySlug } from "./queries/packages";
import { getApprovedReviews as sharedGetApprovedReviews } from "./queries/admin";
import { resolveDestinationHero, resolveJourneyHero, isValidMediaUrl } from "./media-resolver";
import { withTimeout } from "@/lib/promise-timeout";

export function formatPriceDisplay(price: any): string {
  if (price === null || price === undefined) return "₹6,499";
  
  if (typeof price === "number") {
    if (isNaN(price) || price <= 0) return "₹6,499";
    if (price > 0 && price < 100) return `₹${Math.round(price * 10000).toLocaleString('en-IN')}`;
    return `₹${Math.round(price).toLocaleString('en-IN')}`;
  }

  const str = String(price).trim();
  if (!str || str.toLowerCase() === "nan" || str.toLowerCase() === "null") return "₹6,499";

  let cleaned = str.replace(/rs\.?/gi, "").replace(/₹/g, "").replace(/inr/gi, "").replace(/,/g, "").trim();
  
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 0) {
    if (num < 100) {
      return `₹${Math.round(num * 10000).toLocaleString('en-IN')}`;
    }
    return `₹${Math.round(num).toLocaleString('en-IN')}`;
  }

  return "₹6,499";
}

export function getRealDestinationImage(
  slug: string,
  heroImage?: string | null,
  thumbnail?: string | null,
  coverImage?: string | null,
  galleryImage?: string | null
): string {
  const candidate = [heroImage, thumbnail, coverImage, galleryImage].find(isValidMediaUrl);
  return resolveDestinationHero(slug, candidate);
}

export const STATIC_FALLBACK_DESTINATIONS: any[] = [
  {
    slug: "manali",
    name: "Manali",
    subtitle: "Valley of Gods & High Mountain Passes",
    image: "/images/manali/manali-snow-valley.jpg",
    overview: "Experience serene snow valleys, Solang adventures, and vibrant Old Manali cafes.",
    weather: "Pleasant (-2°C to 20°C)",
    howToReach: "AC Volvo Bus from Delhi / Chandigarh",
    bestTime: "Year-round (Best for Snow: Dec-Feb)",
    topPlaces: ["Solang Valley", "Atal Tunnel", "Old Manali", "Hadimba Temple"],
    faqs: [],
    reviews: []
  },
  {
    slug: "jibhi",
    name: "Jibhi",
    subtitle: "Hidden Himalayan Hamlet in Tirthan Valley",
    image: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
    overview: "Pristine pine forests, wooden chalets, waterfall treks, and tranquil river trails.",
    weather: "Cool & Crisp (5°C to 22°C)",
    howToReach: "Volvo Bus to Aut + Cab transfer",
    bestTime: "March to November",
    topPlaces: ["Jibhi Waterfalls", "Raghupur Fort", "Chehni Kothi", "Jalori Pass"],
    faqs: [],
    reviews: []
  },
  {
    slug: "udaipur",
    name: "Udaipur",
    subtitle: "City of Lakes & Royal Rajputana Heritage",
    image: "/images/udaipur-palace.png",
    overview: "Golden sunsets over Lake Pichola, royal palaces, heritage cafes, and fort trails.",
    weather: "Warm & Sunlit (12°C to 30°C)",
    howToReach: "Direct Train / Flight / Overnight Bus from Delhi / Jaipur",
    bestTime: "September to March",
    topPlaces: ["City Palace", "Lake Pichola", "Fateh Sagar", "Monsoon Palace"],
    faqs: [],
    reviews: []
  },
  {
    slug: "chopta",
    name: "Chopta",
    subtitle: "Mini Switzerland of Uttarakhand & Tungnath Trek",
    image: "/assets/pkg-adventure.jpg",
    overview: "Trek to the highest Shiva temple in the world at Tungnath & summit Chandrashila Peak.",
    weather: "Crisp Alpine Climate (-5°C to 18°C)",
    howToReach: "Private Conveyance / Volvo via Haridwar & Rishikesh",
    bestTime: "April to November & Snow Treks in Winter",
    topPlaces: ["Tungnath Temple", "Chandrashila Peak", "Deoriatal Lake", "Baniyakund Meadows"],
    faqs: [],
    reviews: []
  },
  {
    slug: "mcleodganj",
    name: "McLeod Ganj",
    subtitle: "Little Lhasa & Dhauladhar Mountain Trails",
    image: "/images/mcleodganj/mcleodganj-ropeway.jpg",
    overview: "Tibetan monasteries, Triund trek, cafes in Dharamkot, and majestic Dhauladhar views.",
    weather: "Pleasant Mountain Breeze (8°C to 24°C)",
    howToReach: "AC Volvo Bus from Delhi (Overnight)",
    bestTime: "Year-Round",
    topPlaces: ["Dalai Lama Temple", "Triund Trek", "Bhagsunag Falls", "Dharamkot"],
    faqs: [],
    reviews: []
  }
];

export const STATIC_FALLBACK_JOURNEYS: any[] = [
  {
    id: "manali-weekend",
    slug: "manali-weekend",
    destinationSlug: "manali",
    destinationName: "Manali",
    category: "Weekend Escapes",
    name: "Manali Solang & Kasol Road Expedition",
    hero_banner: "/images/manali/manali-snow-valley.jpg",
    image: "/images/manali/manali-snow-valley.jpg",
    duration: "3 Nights / 4 Days",
    transport: "AC Luxury Volvo / Tempo Traveller",
    difficulty: "Easy",
    distance: "540 KM",
    bestSeason: "Year-Round",
    groupSize: "12-18 Explorers",
    price: "₹8,999",
    priceNumber: 8999,
    maxCapacity: 18,
    remainingSeats: 12,
    pickupPoint: "Majnu Ka Tilla, Delhi",
    dropPoint: "Majnu Ka Tilla, Delhi",
    itinerary: [],
    overview: "Experience serene snow valleys, Solang adventures, Atal Tunnel & Kasol Riverside cafes.",
    highlights: ["Solang Valley Adventure", "Atal Tunnel Drive", "Kasol Riverside Cafe Hopping"],
    inclusions: ["Delhi-Manali Volvo", "3-Star Hotel Stay", "Breakfast & Dinner", "Trip Captain"],
    exclusions: ["Personal Expenses", "GST"]
  },
  {
    id: "udaipur-weekend",
    slug: "udaipur-weekend",
    destinationSlug: "udaipur",
    destinationName: "Udaipur",
    category: "Luxury Escapades",
    name: "Udaipur Royal Lakes & Sunset Cruise",
    hero_banner: "/images/udaipur-palace.png",
    image: "/images/udaipur-palace.png",
    duration: "2 Nights / 3 Days",
    transport: "AC Sleeper Bus / Private AC Traveler",
    difficulty: "Easy",
    distance: "660 KM",
    bestSeason: "September to March",
    groupSize: "12-16 Explorers",
    price: "₹7,499",
    priceNumber: 7499,
    maxCapacity: 16,
    remainingSeats: 10,
    pickupPoint: "Delhi / Jaipur",
    dropPoint: "Delhi / Jaipur",
    itinerary: [],
    overview: "Golden sunsets over Lake Pichola, heritage city tours, boat cruises & rooftop dinners.",
    highlights: ["Lake Pichola Sunset Boat Cruise", "City Palace Heritage Tour", "Monsoon Palace Sunset"],
    inclusions: ["Luxury Bus Transfers", "Heritage Hotel Stay", "Breakfast & Dinner", "Tour Captain"],
    exclusions: ["Personal Expenses", "GST"]
  },
  {
    id: "chopta-tungnath",
    slug: "chopta-tungnath",
    destinationSlug: "chopta",
    destinationName: "Chopta",
    category: "Spiritual Trips",
    name: "Chopta Tungnath & Chandrashila Peak Trek",
    hero_banner: "/assets/pkg-adventure.jpg",
    image: "/assets/pkg-adventure.jpg",
    duration: "3 Nights / 4 Days",
    transport: "Private Tempo Traveller",
    difficulty: "Moderate",
    distance: "450 KM",
    bestSeason: "April to November",
    groupSize: "12-16 Explorers",
    price: "₹8,499",
    priceNumber: 8499,
    maxCapacity: 16,
    remainingSeats: 8,
    pickupPoint: "Akshardham Metro, Delhi",
    dropPoint: "Akshardham Metro, Delhi",
    itinerary: [],
    overview: "Trek to the highest Shiva temple in the world at Tungnath & summit Chandrashila Peak.",
    highlights: ["Highest Shiva Temple Trek", "Chandrashila 360 Himalayan View", "Deoriatal Lake Camping"],
    inclusions: ["Delhi-Chopta Transfers", "Boutique Camps & Stays", "Breakfast & Dinner", "Trek Leader"],
    exclusions: ["Personal Expenses", "GST"]
  },
  {
    id: "jibhi-tirthan",
    slug: "jibhi-tirthan",
    destinationSlug: "jibhi",
    destinationName: "Jibhi",
    category: "Backpacking",
    name: "Jibhi & Jalori Pass Secret Waterfall Escape",
    hero_banner: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
    image: "/images/jibhi/jibhi-raghupur-fort-temple.jpg",
    duration: "3 Nights / 4 Days",
    transport: "AC Volvo + Private Cab",
    difficulty: "Easy",
    distance: "500 KM",
    bestSeason: "March to November",
    groupSize: "12-18 Explorers",
    price: "₹8,799",
    priceNumber: 8799,
    maxCapacity: 18,
    remainingSeats: 14,
    pickupPoint: "Kashmere Gate, Delhi",
    dropPoint: "Kashmere Gate, Delhi",
    itinerary: [],
    overview: "Unwind in wooden chalets, hike to Raghupur Fort ruins, and explore hidden Jibhi waterfalls.",
    highlights: ["Raghupur Fort 360 Viewpoint", "Jibhi Waterfall Walk", "Jalori Pass Trek"],
    inclusions: ["Volvo Bus Transfers", "Wooden Chalet Stay", "Breakfast & Dinner", "Trip Captain"],
    exclusions: ["Personal Expenses", "GST"]
  }
];

export async function getDestinations() {
  try {
    const data = await getPublishedDestinations();
    if (!data || data.length === 0) return STATIC_FALLBACK_DESTINATIONS;

    return data.map((d: any) => {
      const galleryFirst = (d.gallery as any)?.[0]?.url || (d.gallery as any)?.[0] || null;
      return {
        slug: d.slug,
        name: d.name,
        subtitle: d.subtitle,
        hero_image: d.hero_image,
        thumbnail: d.thumbnail,
        cover_image: d.cover_image,
        image: getRealDestinationImage(d.slug, d.hero_image, d.thumbnail, d.cover_image, galleryFirst),
        gallery: d.gallery || [],
        overview: d.description,
        weather: d.weather,
        howToReach: d.how_to_reach,
        bestTime: d.best_time || "Best time to visit",
        topPlaces: d.things_to_do || [],
        faqs: d.faqs || [],
        reviews: []
      };
    });
  } catch (err) {
    console.warn("[getDestinations] Failed to load from DB, returning static fallbacks:", err);
    return STATIC_FALLBACK_DESTINATIONS;
  }
}

export const getDestinationsList = getDestinations;

export async function getDestinationBySlug(slug: string) {
  const cleanSlug = slug.toLowerCase().trim();
  const data = await sharedGetDestinationBySlug(cleanSlug).catch(() => null);
  
  if (!data) return null;

  const dbReviews = await sharedGetApprovedReviews(data.id, 6).catch(() => []);
  const reviewsList = (dbReviews || []).map((r: any) => ({
    name: r.author_name || "Verified Traveler",
    avatar: (r.author_name || "Verified Traveler").slice(0, 2).toUpperCase(),
    rating: r.rating || 5,
    text: r.content || "",
    date: r.trip_date || "Recent"
  }));

  const galleryFirst = (data.gallery as any)?.[0]?.url || (data.gallery as any)?.[0] || null;

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    subtitle: data.subtitle,
    hero_image: data.hero_image,
    thumbnail: (data as any).thumbnail,
    cover_image: (data as any).cover_image,
    image: getRealDestinationImage(data.slug, data.hero_image, (data as any).thumbnail, (data as any).cover_image, galleryFirst),
    gallery: data.gallery || [],
    overview: data.description,
    weather: data.weather,
    howToReach: data.how_to_reach,
    bestTime: data.best_time || "Best time to visit",
    topPlaces: data.things_to_do || [],
    faqs: data.faqs || [],
    reviews: reviewsList
  };
}

export async function getJourneys() {
  try {
    const data = await getPublishedPackages();
    if (!data || data.length === 0) return STATIC_FALLBACK_JOURNEYS;

    return data.map((j: any) => {
      const rawItinerary = (Array.isArray(j.itinerary) && j.itinerary.length > 0)
        ? j.itinerary
        : (Array.isArray(j.itinerary_days) && j.itinerary_days.length > 0)
        ? j.itinerary_days
        : [];

      const it = rawItinerary.map((day: any, idx: number) => ({
        id: day.id || `day-${day.day || day.day_number || idx + 1}`,
        day_number: day.day || day.day_number || idx + 1,
        title: day.title || `Day ${day.day || day.day_number || idx + 1}`,
        description: day.description || "",
        image_url: day.image_url || null,
        stay: day.stay || null,
        transport: day.transport || null,
        meals: day.meals || { breakfast: true, dinner: true }
      }));

      const galleryFirst = (j.gallery as any)?.[0]?.url || (j.gallery as any)?.[0] || null;
      const rawPrice = j.price || j.starting_price || j.base_price || 6499;

      const rawTransport = j.transport || (j.transports as any)?.title || (j.transports as any)?.name;
      let cleanTransport = "AC Luxury Tempo Traveller";
      if (typeof rawTransport === "string") {
        if (rawTransport.startsWith("{")) {
          try {
            const p = JSON.parse(rawTransport);
            cleanTransport = p.name || p.vehicle_name || p.title || "AC Luxury Tempo Traveller";
          } catch {
            cleanTransport = rawTransport;
          }
        } else {
          cleanTransport = rawTransport;
        }
      } else if (typeof rawTransport === "object" && rawTransport !== null) {
        cleanTransport = (rawTransport as any).name || (rawTransport as any).vehicle_name || (rawTransport as any).title || "AC Luxury Tempo Traveller";
      }

      return {
        id: j.id,
        slug: j.slug,
        destinationSlug: j.destinations?.slug || "",
        destinationName: j.destinations?.name || "",
        category: j.category || "",
        name: j.name,
        hero_banner: j.hero_banner,
        thumbnail: j.thumbnail,
        cover_image: j.cover_image,
        image: getRealDestinationImage(
          j.slug || j.destinations?.slug || "",
          j.hero_banner || j.destinations?.hero_image,
          j.thumbnail,
          j.cover_image,
          galleryFirst
        ),
        duration: j.duration || (j.duration_days ? `${j.duration_days} Days / ${j.duration_nights || Math.max(1, j.duration_days - 1)} Nights` : "3 Nights / 4 Days"),
        duration_days: j.duration_days,
        duration_nights: j.duration_nights,
        transport: cleanTransport,
        difficulty: j.difficulty || "Moderate",
        distance: j.distance || "540 KM",
        bestSeason: j.season || j.best_season || "Year-Round",
        groupSize: j.group_size || (j.group_size_min ? `${j.group_size_min}-26 Explorers` : "12-26 Explorers"),
        price: formatPriceDisplay(rawPrice),
        priceNumber: Number(rawPrice) > 0 ? Number(rawPrice) : 6499,
        maxCapacity: j.max_capacity || j.group_size_max || 18,
        remainingSeats: j.remaining_seats || j.available_seats || 18,
        pickupPoint: j.pickup_point,
        dropPoint: j.drop_point,
        itinerary: it,
        itinerary_days: it,
        overview: j.description || j.overview || j.name,
        highlights: (Array.isArray(j.highlights) && j.highlights.length > 0)
          ? j.highlights
          : (Array.isArray(it) && it.length > 0 
              ? it.map((day: any) => day?.title || "").filter(Boolean).slice(0, 4)
              : []),
        hotel: j.hotel,
        food: j.food,
        dayByDay: it,
        stayInfo: j.hotel || "",
        foodInfo: j.food || "",
        transportDetails: j.transport || "",
        inclusions: j.inclusions || [],
        exclusions: j.exclusions || [],
        packingList: j.packing_list || []
      };
    });
  } catch (err) {
    console.warn("[getJourneys] Failed to load from DB, returning static fallbacks:", err);
    return STATIC_FALLBACK_JOURNEYS;
  }
}

export async function getJourneysByDestination(destinationSlug: string) {
  const allJourneys = await getJourneys();
  return allJourneys.filter(j => j.destinationSlug === destinationSlug);
}

export async function getJourneyBySlug(slug: string) {
  const cleanSlug = slug.toLowerCase().trim();
  
  const data = await getPackageBySlug(cleanSlug).catch((err) => {
    console.warn(`[getJourneyBySlug] Database fetch failed for '${cleanSlug}':`, err);
    return null;
  });
  
  if (!data) return null;

  const rawItinerary = (Array.isArray(data.itinerary) && data.itinerary.length > 0)
    ? data.itinerary
    : (Array.isArray(data.itinerary_days) && data.itinerary_days.length > 0)
    ? data.itinerary_days
    : [];

  const it = rawItinerary.map((day: any, idx: number) => ({
    id: day.id || `day-${day.day || day.day_number || idx + 1}`,
    day_number: day.day || day.day_number || idx + 1,
    title: day.title || `Day ${day.day || day.day_number || idx + 1}`,
    description: day.description || "",
    image_url: day.image_url || null,
    stay: day.stay || null,
    transport: day.transport || null,
    meals: day.meals || { breakfast: true, dinner: true }
  }));

  const rawImg = data.hero_banner || (data.destinations as any)?.hero_image || (data.gallery as any)?.[0]?.url || (data.gallery as any)?.[0] || "";
  const rawPrice = data.price || data.starting_price || data.base_price || 6499;

  const rawTransport = data.transport || (data.transports as any)?.title || (data.transports as any)?.name;
  let cleanTransport = "AC Luxury Tempo Traveller";
  if (typeof rawTransport === "string") {
    if (rawTransport.startsWith("{")) {
      try {
        const p = JSON.parse(rawTransport);
        cleanTransport = p.name || p.vehicle_name || p.title || "AC Luxury Tempo Traveller";
      } catch {
        cleanTransport = rawTransport;
      }
    } else {
      cleanTransport = rawTransport;
    }
  } else if (typeof rawTransport === "object" && rawTransport !== null) {
    cleanTransport = (rawTransport as any).name || (rawTransport as any).vehicle_name || (rawTransport as any).title || "AC Luxury Tempo Traveller";
  }

  return {
    id: data.id,
    slug: data.slug,
    destinationSlug: (data.destinations as any)?.slug || "",
    destinationName: (data.destinations as any)?.name || "",
    category: data.category || "",
    name: data.name,
    image: getRealDestinationImage(data.slug || (data.destinations as any)?.slug || "", rawImg),
    duration: data.duration || (data.duration_days ? `${data.duration_days} Days / ${data.duration_nights || Math.max(1, data.duration_days - 1)} Nights` : "3 Nights / 4 Days"),
    duration_days: data.duration_days,
    duration_nights: data.duration_nights,
    transport: cleanTransport,
    difficulty: data.difficulty || "Moderate",
    distance: data.distance || "540 KM",
    bestSeason: data.season || data.best_season || "Best season",
    groupSize: data.group_size || (data.group_size_min ? `${data.group_size_min}-26 Explorers` : "12-26 Explorers"),
    price: formatPriceDisplay(rawPrice),
    priceNumber: Number(rawPrice) > 0 ? Number(rawPrice) : 6499,
    maxCapacity: data.max_capacity || data.group_size_max || 18,
    remainingSeats: data.remaining_seats || data.available_seats || 18,
    pickupPoint: data.pickup_point,
    dropPoint: data.drop_point,
    itinerary: it,
    itinerary_days: it,
    overview: data.description || data.overview || data.name,
    highlights: (Array.isArray(data.highlights) && data.highlights.length > 0)
      ? data.highlights
      : (Array.isArray(it) && it.length > 0 
          ? it.map((day: any) => day?.title || "").filter(Boolean).slice(0, 4)
          : []),
    hotel: data.hotels || null,
    food: data.food,
    dayByDay: it,
    stayInfo: data.hotels?.name || "",
    foodInfo: data.food || "",
    transportDetails: data.transport || "",
    inclusions: data.inclusions || [],
    exclusions: data.exclusions || [],
    packingList: data.packing_list || [],
    accommodation: data.hotels || null
  };
}

export async function getTripBatchesByJourney(journeySlug: string) {
  const { data: journey } = await supabase
    .from("journeys")
    .select("id")
    .eq("slug", journeySlug)
    .single();

  if (!journey) return [];

  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("trip_batches")
    .select("*")
    .eq("journey_id", journey.id)
    .neq("status", "CANCELLED")
    .gte("departure_date", today)
    .order("departure_date");

  if (error) {
    console.error("Error fetching trip batches:", error);
    return [];
  }
  return data || [];
}

export async function getGalleryByDestination(destinationSlug: string) {
  const { data: dest } = await supabase
    .from("destinations")
    .select("id")
    .eq("slug", destinationSlug)
    .single();

  if (!dest) return [];

  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("destination_id", dest.id)
    .order("display_order");

  if (error) return [];
  return data || [];
}

export async function getApprovedReviews(journeySlug?: string) {
  let query = supabase
    .from("reviews")
    .select("*, journeys(name, slug)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (journeySlug) {
    const { data: journey } = await supabase
      .from("journeys")
      .select("id")
      .eq("slug", journeySlug)
      .single();
    if (journey) {
      query = supabase
        .from("reviews")
        .select("*, journeys(name, slug)")
        .eq("is_approved", true)
        .eq("journey_id", journey.id)
        .order("created_at", { ascending: false })
        .limit(20);
    }
  }

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}


