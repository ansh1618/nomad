import { supabase } from "@/lib/supabase";
import { getPublishedDestinations, getDestinationBySlug as sharedGetDestinationBySlug } from "./queries/destinations";
import { getPublishedPackages, getPackageBySlug } from "./queries/packages";
import { getApprovedReviews as sharedGetApprovedReviews } from "./queries/admin";
import { resolveDestinationHero, resolveJourneyHero, isValidMediaUrl } from "./media-resolver";

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

export async function getDestinations() {
  const data = await getPublishedDestinations();
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
}

export async function getDestinationBySlug(slug: string) {
  const data = await sharedGetDestinationBySlug(slug).catch(() => null);
  
  if (!data) {
    const nameFriendly = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const fallbackImg = getRealDestinationImage(slug);

    return {
      slug,
      name: nameFriendly,
      subtitle: `Explore ${nameFriendly} with Nomadik`,
      hero_image: fallbackImg,
      thumbnail: fallbackImg,
      cover_image: fallbackImg,
      image: fallbackImg,
      gallery: [fallbackImg],
      overview: `Discover handpicked road trip experiences in ${nameFriendly}. Curated journeys with certified Trip Captains, verified stays, and 24/7 support.`,
      weather: "Pleasant throughout the year",
      howToReach: "AC Volvo Bus / Private Conveyance from Delhi / Chandigarh",
      bestTime: "September to June",
      topPlaces: ["Scenic Viewpoints", "Heritage Sites", "Local Markets"],
      faqs: [],
      reviews: []
    };
  }

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
  const data = await getPublishedPackages();
  return data.map((j: any) => {
    const it = j.itinerary_days || [];
    const galleryFirst = (j.gallery as any)?.[0]?.url || (j.gallery as any)?.[0] || null;
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
      duration: j.duration,
      transport: j.transport,
      difficulty: j.difficulty,
      distance: j.distance,
      bestSeason: j.season || j.best_season || "Best season",
      groupSize: j.group_size || j.group_size_max,
      price: formatPriceDisplay(j.price || j.starting_price || 6499),
      priceNumber: Number(j.price || j.starting_price) > 0 ? Number(j.price || j.starting_price) : 6499,
      maxCapacity: j.max_capacity || j.group_size_max || 18,
      remainingSeats: j.remaining_seats || j.available_seats || 18,
      pickupPoint: j.pickup_point,
      dropPoint: j.drop_point,
      itinerary: it,
      overview: j.description || j.overview || j.name,
      highlights: Array.isArray(it) && it.length > 0 
        ? it.map((day: any) => day?.title || "").filter(Boolean).slice(0, 3)
        : (j.highlights || []),
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
}

export async function getJourneysByDestination(destinationSlug: string) {
  const allJourneys = await getJourneys();
  return allJourneys.filter(j => j.destinationSlug === destinationSlug);
}

export async function getJourneyBySlug(slug: string) {
  const data = await getPackageBySlug(slug);
  if (!data) return null;

  const it = data.itinerary_days || [];
  const rawImg = data.hero_banner || (data.destinations as any)?.hero_image || (data.gallery as any)?.[0]?.url || (data.gallery as any)?.[0] || "";
  return {
    id: data.id,
    slug: data.slug,
    destinationSlug: (data.destinations as any)?.slug || "",
    destinationName: (data.destinations as any)?.name || "",
    category: data.category || "",
    name: data.name,
    image: getRealDestinationImage(data.slug || (data.destinations as any)?.slug || "", rawImg),
    duration: data.duration,
    transport: data.transport,
    difficulty: data.difficulty,
    distance: data.distance,
    bestSeason: data.season || data.best_season || "Best season",
    groupSize: data.group_size || data.group_size_max,
    price: formatPriceDisplay(data.price || data.starting_price || 6499),
    priceNumber: Number(data.price || data.starting_price) > 0 ? Number(data.price || data.starting_price) : 6499,
    maxCapacity: data.max_capacity || data.group_size_max || 18,
    remainingSeats: data.remaining_seats || data.available_seats || 18,
    pickupPoint: data.pickup_point,
    dropPoint: data.drop_point,
    itinerary: it,
    overview: data.description || data.overview || data.name,
    highlights: Array.isArray(it) && it.length > 0 
      ? it.map((day: any) => day?.title || "").filter(Boolean).slice(0, 3)
      : (data.highlights || []),
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


