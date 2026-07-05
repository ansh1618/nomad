import { supabase } from "@/lib/supabase";
import { destinations as mockDestinations } from "@/data/destinations";
import { journeys as mockJourneys } from "@/data/journeys";

// ==========================================
// TYPES
// ==========================================

export type InquiryStatus = 'NEW' | 'CONTACTED' | 'FOLLOW_UP' | 'CONVERTED' | 'CANCELLED' | 'SPAM';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type AdminRole = 'SUPER_ADMIN' | 'MANAGER' | 'TRIP_CAPTAIN' | 'SUPPORT';

export interface SubmitInquiryInput {
  name: string;
  phone: string;
  email?: string;
  destination?: string;
  journey?: string;
  date?: string;
  travellers?: string | number;
  message?: string;
  source?: string;
}

// ==========================================
// PUBLIC: DESTINATIONS
// ==========================================

export async function getDestinations() {
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching destinations:", error);
    throw error; // Rethrow to let router boundary catch it
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

// ==========================================
// PUBLIC: JOURNEYS
// ==========================================

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

// ==========================================
// PUBLIC: TRIP BATCHES
// ==========================================

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

// ==========================================
// PUBLIC: INQUIRY SUBMISSION
// ==========================================

export async function submitInquiry(inquiryData: SubmitInquiryInput) {
  if (!inquiryData.name?.trim()) throw new Error("Name is required");
  if (!inquiryData.phone?.trim()) throw new Error("Phone number is required");
  if (inquiryData.phone.replace(/\D/g, "").length < 10)
    throw new Error("Please enter a valid 10-digit phone number");

  const { data, error } = await supabase
    .from("inquiries")
    .insert([{
      full_name: inquiryData.name.trim(),
      phone: inquiryData.phone.trim(),
      email: inquiryData.email?.trim() || null,
      destination: inquiryData.destination || "General Enquiry",
      journey: inquiryData.journey || "General Enquiry",
      travel_date: inquiryData.date || "Not decided",
      travellers: parseInt(String(inquiryData.travellers)) || 1,
      message: inquiryData.message?.trim() || null,
      source: inquiryData.source || "Website",
      status: "NEW"
    }])
    .select("id");

  if (error) {
    console.error("Inquiry submission error:", error);
    throw new Error("Failed to submit inquiry. Please try again or call us directly.");
  }

  return data;
}

// ==========================================
// PUBLIC: GALLERY & REVIEWS
// ==========================================

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

// ==========================================
// ADMIN: INQUIRIES (requires admin auth)
// ==========================================

export async function getInquiries(status?: InquiryStatus) {
  let query = supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = (query as any).eq("status", status);

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch inquiries: " + error.message);
  return data || [];
}

export async function updateInquiryStatus(id: string, status: InquiryStatus, notes?: string) {
  const updateData: any = { status };
  if (notes !== undefined) updateData.notes = notes;

  const { data, error } = await supabase
    .from("inquiries")
    .update(updateData)
    .eq("id", id)
    .select();

  if (error) throw new Error("Failed to update inquiry: " + error.message);
  return data;
}

// ==========================================
// ADMIN: BOOKINGS (requires admin auth)
// ==========================================

export async function createBooking(bookingData: {
  inquiryId?: string;
  journeySlug: string;
  tripBatchId?: string;
  customerName: string;
  phone: string;
  email?: string;
  travelDate?: string;
  travellersCount: number;
  amount: number;
  discountAmount?: number;
  paymentMethod?: string;
  couponCode?: string;
  notes?: string;
}) {
  const { data: journey } = await supabase
    .from("journeys")
    .select("id, destination_id, price")
    .eq("slug", bookingData.journeySlug)
    .single();

  if (!journey) throw new Error("Journey not found");

  const finalAmount = bookingData.amount - (bookingData.discountAmount || 0);

  const { data, error } = await supabase
    .from("bookings")
    .insert([{
      inquiry_id: bookingData.inquiryId || null,
      journey_id: journey.id,
      destination_id: journey.destination_id,
      trip_batch_id: bookingData.tripBatchId || null,
      customer_name: bookingData.customerName,
      phone: bookingData.phone,
      email: bookingData.email || null,
      travel_date: bookingData.travelDate || null,
      travellers_count: bookingData.travellersCount,
      amount: bookingData.amount,
      discount_amount: bookingData.discountAmount || 0,
      final_amount: finalAmount,
      payment_method: bookingData.paymentMethod || null,
      coupon_code: bookingData.couponCode || null,
      notes: bookingData.notes || null
    }])
    .select();

  if (error) throw new Error("Failed to create booking: " + error.message);
  return data;
}

export async function getBookings(status?: BookingStatus) {
  let query = supabase
    .from("bookings")
    .select("*, journeys(name, slug), destinations(name)")
    .order("created_at", { ascending: false });

  if (status) query = (query as any).eq("booking_status", status);

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch bookings: " + error.message);
  return data || [];
}

export async function updateBookingStatus(id: string, bookingStatus: BookingStatus, paymentStatus?: PaymentStatus) {
  const updateData: any = { booking_status: bookingStatus };
  if (paymentStatus) updateData.payment_status = paymentStatus;

  const { data, error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", id)
    .select();

  if (error) throw new Error("Failed to update booking: " + error.message);
  return data;
}

// ==========================================
// ADMIN: SETTINGS
// ==========================================

export async function getAdminSettings(category?: string) {
  let query = supabase.from("settings").select("*").order("category").order("key");
  if (category) query = (query as any).eq("category", category);

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch settings: " + error.message);
  return data || [];
}

export async function updateAdminSetting(key: string, value: any) {
  const { data, error } = await supabase
    .from("settings")
    .update({ value })
    .eq("key", key)
    .select();

  if (error) throw new Error("Failed to update setting: " + error.message);
  return data;
}

// ==========================================
// ADMIN: DASHBOARD ANALYTICS
// ==========================================

export async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  // Run all queries in parallel
  const [
    bookingsToday,
    revenueResult,
    upcomingDepartures,
    availableSeats,
    newInquiries,
    pendingPayments,
    recentBookings,
    todayDepartures,
    destinationBookings,
  ] = await Promise.all([
    // Today's bookings count
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayIso),

    // Total confirmed revenue
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "SUCCESS"),

    // Upcoming departures (future dates)
    supabase
      .from("departures")
      .select("id", { count: "exact", head: true })
      .gte("departure_date", todayIso),

    // Available seats across active departures
    supabase
      .from("departure_inventory")
      .select("id", { count: "exact", head: true })
      .eq("status", "AVAILABLE"),

    // New inquiries (today)
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayIso),

    // Pending payments total
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "PENDING"),

    // Recent 5 bookings with user info
    supabase
      .from("bookings")
      .select("id, booking_id, status, total_amount, created_at, traveller_count, user_id, departure_id")
      .order("created_at", { ascending: false })
      .limit(5),

    // Today's departures with journey info
    supabase
      .from("departures")
      .select("id, departure_date, status, journey_id, journeys(name)")
      .gte("departure_date", todayIso)
      .lte("departure_date", new Date(today.getTime() + 86400000).toISOString())
      .limit(5),

    // Destination popularity (count of bookings per destination)
    supabase
      .from("destinations")
      .select("name, journeys(id)")
      .limit(10),
  ]);

  // Calculate revenue
  const totalRevenue = revenueResult.data?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
  const pendingTotal = pendingPayments.data?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

  return {
    todayBookings: bookingsToday.count || 0,
    totalRevenue,
    upcomingTrips: upcomingDepartures.count || 0,
    availableSeats: availableSeats.count || 0,
    newInquiries: newInquiries.count || 0,
    pendingPayments: pendingTotal,
    recentBookings: recentBookings.data || [],
    todayDepartures: todayDepartures.data || [],
    destinationStats: (destinationBookings.data || []).map((d: any) => ({
      name: d.name,
      journeyCount: d.journeys?.length || 0,
    })),
  };
}

// ==========================================
// ADMIN: VERIFICATION
// ==========================================

export async function verifyAdmin(userId: string): Promise<{ isAdmin: boolean; role: AdminRole | null }> {
  const { data, error } = await supabase
    .from("admins")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) return { isAdmin: false, role: null };
  return { isAdmin: true, role: data.role as AdminRole };
}
