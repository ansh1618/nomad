import { supabase } from "@/lib/supabase";
import { getPublishedDestinations, getDestinationBySlug as sharedGetDestinationBySlug } from "./queries/destinations";
import { getPublishedPackages, getPackageBySlug } from "./queries/packages";
import { getApprovedReviews as sharedGetApprovedReviews } from "./queries/admin";

export async function getDestinations() {
  const data = await getPublishedDestinations();
  return data.map((d: any) => ({
    slug: d.slug,
    name: d.name,
    subtitle: d.subtitle,
    image: d.hero_image || (d.gallery?.[0]?.url ?? d.gallery?.[0]) || '',
    gallery: d.gallery || [],
    overview: d.description,
    weather: d.weather,
    howToReach: d.how_to_reach,
    bestTime: d.best_time || "Best time to visit",
    topPlaces: d.things_to_do || [],
    faqs: d.faqs || [],
    reviews: []
  }));
}

export async function getDestinationBySlug(slug: string) {
  const data = await sharedGetDestinationBySlug(slug);
  if (!data) return null;

  // Fetch approved reviews via shared admin queries layer using is_approved = true
  const dbReviews = await sharedGetApprovedReviews(data.id, 6).catch(() => []);
  const reviewsList = dbReviews.map((r: any) => ({
    name: r.author_name,
    avatar: r.author_name.slice(0, 2).toUpperCase(),
    rating: r.rating,
    text: r.content,
    date: r.trip_date || "Recent"
  }));

  return {
    slug: data.slug,
    name: data.name,
    subtitle: data.subtitle,
    image: data.hero_image || (data.gallery?.[0]?.url ?? data.gallery?.[0]) || '',
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
    return {
      slug: j.slug,
      destinationSlug: j.destinations?.slug || "",
      destinationName: j.destinations?.name || "",
      category: j.category || "",
      name: j.name,
      image: (j.gallery as any)?.[0]?.url || (j.gallery as any)?.[0] || j.hero_banner || "",
      duration: j.duration,
      transport: j.transport,
      difficulty: j.difficulty,
      distance: j.distance,
      bestSeason: j.season || j.best_season || "Best season",
      groupSize: j.group_size || j.group_size_max,
      price: `Rs.${Number(j.price || j.starting_price || 0).toLocaleString()}`,
      priceNumber: Number(j.price || j.starting_price || 0),
      maxCapacity: j.max_capacity || j.group_size_max || 18,
      remainingSeats: j.remaining_seats || j.available_seats || 18,
      pickupPoint: j.pickup_point,
      dropPoint: j.drop_point,
      itinerary: it,
      overview: j.description || j.overview || j.name,
      highlights: it.length > 0 
        ? it.map((day: any) => day.title).slice(0, 3)
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
  return {
    id: data.id,
    slug: data.slug,
    destinationSlug: (data.destinations as any)?.slug || "",
    destinationName: (data.destinations as any)?.name || "",
    category: data.category || "",
    name: data.name,
    image: (data.gallery as any)?.[0]?.url || (data.gallery as any)?.[0] || data.hero_banner || "",
    duration: data.duration,
    transport: data.transport,
    difficulty: data.difficulty,
    distance: data.distance,
    bestSeason: data.season || data.best_season || "Best season",
    groupSize: data.group_size || data.group_size_max,
    price: `Rs.${Number(data.price || data.starting_price || 0).toLocaleString()}`,
    priceNumber: Number(data.price || data.starting_price || 0),
    maxCapacity: data.max_capacity || data.group_size_max || 18,
    remainingSeats: data.remaining_seats || data.available_seats || 18,
    pickupPoint: data.pickup_point,
    dropPoint: data.drop_point,
    itinerary: it,
    overview: data.description || data.overview || data.name,
    highlights: it.length > 0 
      ? it.map((day: any) => day.title).slice(0, 3)
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


