import { supabase } from "@/lib/supabase";
import { destinations as mockDestinations } from "@/data/destinations";
import { journeys as mockJourneys } from "@/data/journeys";

export async function getDestinations() {
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching destinations:", error);
    throw error;
  }

  return data.map((d: any) => {
    const mock = mockDestinations.find((md) => md.slug === d.slug) || {
      bestTime: "Best time to visit",
      topPlaces: [],
      faqs: [],
      reviews: []
    };
    return {
      slug: d.slug,
      name: d.name,
      subtitle: d.subtitle,
      image: d.hero_image,
      overview: d.description,
      weather: d.weather,
      howToReach: d.how_to_reach,
      bestTime: mock.bestTime,
      topPlaces: mock.topPlaces,
      faqs: mock.faqs,
      reviews: mock.reviews
    };
  });
}

export async function getDestinationBySlug(slug: string) {
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching destination by slug:", error);
    throw error;
  }
  if (!data) return null;

  const { data: dbReviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(6);

  const mock = mockDestinations.find((md) => md.slug === slug) || {
    bestTime: "Best time to visit",
    topPlaces: [],
    faqs: [],
    reviews: []
  };

  const reviewsList = dbReviews && dbReviews.length > 0
    ? dbReviews.map((r: any) => ({
        name: r.author_name,
        avatar: r.author_name.slice(0, 2).toUpperCase(),
        rating: r.rating,
        text: r.content,
        date: r.trip_date || "Recent"
      }))
    : mock.reviews;

  return {
    slug: data.slug,
    name: data.name,
    subtitle: data.subtitle,
    image: data.hero_image,
    overview: data.description,
    weather: data.weather,
    howToReach: data.how_to_reach,
    bestTime: mock.bestTime,
    topPlaces: mock.topPlaces,
    faqs: mock.faqs,
    reviews: reviewsList
  };
}

export async function getJourneys() {
  const { data, error } = await supabase
    .from("journeys")
    .select("*, destinations(slug)")
    .order("name");

  if (error) {
    console.error("Error fetching journeys:", error);
    throw error;
  }

  return data.map((j: any) => {
    const mock = mockJourneys.find((mj) => mj.slug === j.slug) || {
      bestSeason: j.season || "Best season",
      highlights: [],
      dayByDay: [],
      stayInfo: j.hotel || "",
      foodInfo: j.food || "",
      transportDetails: j.transport || "",
      inclusions: [],
      exclusions: [],
      packingList: []
    };
    return {
      slug: j.slug,
      destinationSlug: j.destinations?.slug || "",
      name: j.name,
      image: (j.gallery as string[] | null)?.[0] || "",
      duration: j.duration,
      transport: j.transport,
      difficulty: j.difficulty,
      distance: j.distance,
      bestSeason: j.season || mock.bestSeason,
      groupSize: j.group_size,
      price: `Rs.${Number(j.price).toLocaleString()}`,
      priceNumber: Number(j.price),
      maxCapacity: j.max_capacity || 18,
      remainingSeats: j.remaining_seats || 18,
      pickupPoint: j.pickup_point,
      dropPoint: j.drop_point,
      itinerary: j.itinerary || [],
      overview: j.description || j.name,
      highlights: j.itinerary && j.itinerary.length > 0 
        ? j.itinerary.map((day: any) => day.title).slice(0, 3)
        : mock.highlights,
      hotel: j.hotel,
      food: j.food,
      dayByDay: mock.dayByDay,
      stayInfo: mock.stayInfo,
      foodInfo: mock.foodInfo,
      transportDetails: mock.transportDetails,
      inclusions: mock.inclusions,
      exclusions: mock.exclusions,
      packingList: mock.packingList
    };
  });
}

export async function getJourneysByDestination(destinationSlug: string) {
  const allJourneys = await getJourneys();
  return allJourneys.filter(j => j.destinationSlug === destinationSlug);
}

export async function getJourneyBySlug(slug: string) {
  const { data, error } = await supabase
    .from("journeys")
    .select("*, destinations(slug, name)")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error("Error fetching journey by slug:", error);
    throw error;
  }
  if (!data) return null;

  const mock = mockJourneys.find((mj) => mj.slug === slug) || {
    bestSeason: data.season || "Best season",
    highlights: [],
    dayByDay: [],
    stayInfo: data.hotel || "",
    foodInfo: data.food || "",
    transportDetails: data.transport || "",
    inclusions: [],
    exclusions: [],
    packingList: []
  };

  return {
    id: data.id,
    slug: data.slug,
    destinationSlug: (data.destinations as any)?.slug || "",
    destinationName: (data.destinations as any)?.name || "",
    name: data.name,
    image: (data.gallery as string[] | null)?.[0] || "",
    duration: data.duration,
    transport: data.transport,
    difficulty: data.difficulty,
    distance: data.distance,
    bestSeason: data.season || mock.bestSeason,
    groupSize: data.group_size,
    price: `Rs.${Number(data.price).toLocaleString()}`,
    priceNumber: Number(data.price),
    maxCapacity: data.max_capacity || 18,
    remainingSeats: data.remaining_seats || 18,
    pickupPoint: data.pickup_point,
    dropPoint: data.drop_point,
    itinerary: data.itinerary || [],
    overview: data.description || data.name,
    highlights: data.itinerary && data.itinerary.length > 0 
      ? data.itinerary.map((day: any) => day.title).slice(0, 3)
      : mock.highlights,
    hotel: data.hotel,
    food: data.food,
    dayByDay: mock.dayByDay,
    stayInfo: mock.stayInfo,
    foodInfo: mock.foodInfo,
    transportDetails: mock.transportDetails,
    inclusions: mock.inclusions,
    exclusions: mock.exclusions,
    packingList: mock.packingList
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
    .eq("approved", true)
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
        .eq("approved", true)
        .eq("journey_id", journey.id)
        .order("created_at", { ascending: false })
        .limit(20);
    }
  }

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}
