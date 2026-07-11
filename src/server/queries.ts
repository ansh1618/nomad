import { supabase } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

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
    throw error;
  }

  return data.map((d: any) => {
    return {
      slug: d.slug,
      name: d.name,
      subtitle: d.subtitle,
      image: d.hero_image,
      overview: d.description,
      weather: d.weather,
      howToReach: d.how_to_reach,
      bestTime: d.best_time_to_visit || d.best_time || "Best time to visit",
      topPlaces: d.things_to_do || d.highlights || [],
      faqs: d.faqs || [],
      reviews: []
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

  const reviewsList = dbReviews && dbReviews.length > 0
    ? dbReviews.map((r: any) => ({
        name: r.author_name,
        avatar: r.author_name.slice(0, 2).toUpperCase(),
        rating: r.rating,
        text: r.content,
        date: r.trip_date || "Recent"
      }))
    : [];

  return {
    slug: data.slug,
    name: data.name,
    subtitle: data.subtitle,
    image: data.hero_image,
    overview: data.description,
    weather: data.weather,
    howToReach: data.how_to_reach,
    bestTime: data.best_time_to_visit || data.best_time || "Best time to visit",
    topPlaces: data.things_to_do || data.highlights || [],
    faqs: data.faqs || [],
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
    const it = j.itinerary || [];
    return {
      slug: j.slug,
      destinationSlug: j.destinations?.slug || "",
      name: j.name,
      image: (j.gallery as string[] | null)?.[0] || j.hero_banner || "",
      duration: j.duration,
      transport: j.transport,
      difficulty: j.difficulty,
      distance: j.distance,
      bestSeason: j.season || j.best_season || "Best season",
      groupSize: j.group_size,
      price: `Rs.${Number(j.price || j.starting_price || 0).toLocaleString()}`,
      priceNumber: Number(j.price || j.starting_price || 0),
      maxCapacity: j.max_capacity || 18,
      remainingSeats: j.remaining_seats || 18,
      pickupPoint: j.pickup_point,
      dropPoint: j.drop_point,
      itinerary: it,
      overview: j.description || j.name,
      highlights: it.length > 0 
        ? it.map((day: any) => day.title).slice(0, 3)
        : (j.highlights || []),
      hotel: j.hotel,
      food: j.food,
      dayByDay: it,
      stayInfo: j.hotel || j.stay_info || "",
      foodInfo: j.food || j.food_info || "",
      transportDetails: j.transport || j.transport_details || "",
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

  const it = data.itinerary || [];

  return {
    slug: data.slug,
    destinationSlug: (data.destinations as any)?.slug || "",
    destinationName: (data.destinations as any)?.name || "",
    name: data.name,
    image: (data.gallery as string[] | null)?.[0] || data.hero_banner || "",
    duration: data.duration,
    transport: data.transport,
    difficulty: data.difficulty,
    distance: data.distance,
    bestSeason: data.season || data.best_season || "Best season",
    groupSize: data.group_size,
    price: `Rs.${Number(data.price || data.starting_price || 0).toLocaleString()}`,
    priceNumber: Number(data.price || data.starting_price || 0),
    maxCapacity: data.max_capacity || 18,
    remainingSeats: data.remaining_seats || 18,
    pickupPoint: data.pickup_point,
    dropPoint: data.drop_point,
    itinerary: it,
    overview: data.description || data.name,
    highlights: it.length > 0 
      ? it.map((day: any) => day.title).slice(0, 3)
      : (data.highlights || []),
    hotel: data.hotel,
    food: data.food,
    dayByDay: it,
    stayInfo: data.hotel || data.stay_info || "",
    foodInfo: data.food || data.food_info || "",
    transportDetails: data.transport || data.transport_details || "",
    inclusions: data.inclusions || [],
    exclusions: data.exclusions || [],
    packingList: data.packing_list || []
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

// ==========================================
// PUBLIC: CONTACT INQUIRIES & ACTIONS
// ==========================================

export async function submitContactInquiry(inquiryData: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}) {
  if (!inquiryData.name?.trim()) throw new Error("Name is required");
  if (!inquiryData.email?.trim()) throw new Error("Email is required");
  if (!inquiryData.phone?.trim()) throw new Error("Phone number is required");

  const { error } = await supabase
    .from("contact_inquiries")
    .insert([{
      name: inquiryData.name.trim(),
      email: inquiryData.email.trim(),
      phone: inquiryData.phone.trim(),
      subject: inquiryData.subject.trim() || "General Inquiry",
      message: inquiryData.message.trim(),
      source: "Contact Page",
      status: "NEW"
    }]);

  if (error) {
    console.error("Contact Inquiry submission error:", error);
    throw new Error("Failed to submit contact inquiry: " + error.message);
  }

  // Also insert into the main inquiries (Leads CRM) table so it shows in the Admin pipeline
  try {
    await supabase.from("inquiries").insert([{
      full_name: inquiryData.name.trim(),
      phone: inquiryData.phone.trim(),
      email: inquiryData.email.trim(),
      destination: inquiryData.subject || "General Enquiry",
      journey: "Contact Page Inquiry",
      travel_date: "Not decided",
      travellers: 1,
      message: inquiryData.message,
      source: "Contact Page",
      status: 'NEW',
    }]);
  } catch (crmErr) {
    // Non-fatal: log but don't block the user's submission
    console.warn("Could not mirror contact inquiry to leads CRM:", crmErr);
  }



  // Trigger confirmation email
  try {
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
        <h2 style="color: #0b3d59;">Hi ${inquiryData.name},</h2>
        <p>Thank you for reaching out to <strong>Nomadik</strong>! We have received your inquiry regarding "<strong>${inquiryData.subject || "General Inquiry"}</strong>".</p>
        <p>Our Trip Captain is already reviewing your request and will contact you within the next 2-4 business hours.</p>
        <div style="background: #f7f7f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #b89047;">Your Message Details:</h4>
          <p style="margin-bottom: 5px;"><strong>Name:</strong> ${inquiryData.name}</p>
          <p style="margin-bottom: 5px;"><strong>Email:</strong> ${inquiryData.email}</p>
          <p style="margin-bottom: 5px;"><strong>Phone:</strong> ${inquiryData.phone}</p>
          <p style="margin-bottom: 0;"><strong>Message:</strong> ${inquiryData.message}</p>
        </div>
        <p>Keep exploring,<br><strong>Team Nomadik</strong></p>
      </div>
    `;
    await sendEmail({
      to: inquiryData.email,
      subject: `Inquiry Received: ${inquiryData.subject || "General Inquiry"} | Nomadik`,
      html: emailHtml,
    });
  } catch (emailErr) {
    console.error("Failed to send confirmation email:", emailErr);
  }

  return { success: true };
}

export async function submitConsultationRequest(consultationData: {
  name: string;
  email?: string;
  phone: string;
  destination?: string;
  budget?: string;
  preferred_date?: string;
  preferred_time?: string;
  notes?: string;
}) {
  if (!consultationData.name?.trim()) throw new Error("Name is required");
  if (!consultationData.phone?.trim()) throw new Error("Phone number is required");

  const { error } = await supabase
    .from("consultation_requests")
    .insert([{
      name: consultationData.name.trim(),
      email: consultationData.email?.trim() || null,
      phone: consultationData.phone.trim(),
      destination: consultationData.destination?.trim() || null,
      budget: consultationData.budget?.trim() || null,
      preferred_date: consultationData.preferred_date || null,
      preferred_time: consultationData.preferred_time?.trim() || null,
      notes: consultationData.notes?.trim() || null,
      status: "NEW"
    }]);

  if (error) {
    console.error("Consultation Request submission error:", error);
    throw new Error("Failed to submit consultation request: " + error.message);
  }

  // Trigger confirmation email if email is provided
  if (consultationData.email?.trim()) {
    try {
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; line-height: 1.6;">
          <h2 style="color: #0b3d59;">Hi ${consultationData.name},</h2>
          <p>Thank you for scheduling a <strong>Free Consultation</strong> with <strong>Nomadik</strong>!</p>
          <p>We have successfully registered your request. One of our Senior Route Experts will contact you to discuss your trip plans.</p>
          <div style="background: #f7f7f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #b89047;">Consultation Details:</h4>
            <p style="margin-bottom: 5px;"><strong>Destination:</strong> ${consultationData.destination || "Not specified"}</p>
            <p style="margin-bottom: 5px;"><strong>Budget:</strong> ${consultationData.budget || "Not specified"}</p>
            <p style="margin-bottom: 5px;"><strong>Preferred Date:</strong> ${consultationData.preferred_date || "As soon as possible"}</p>
            <p style="margin-bottom: 5px;"><strong>Preferred Time:</strong> ${consultationData.preferred_time || "Not specified"}</p>
            <p style="margin-bottom: 0;"><strong>Special Notes:</strong> ${consultationData.notes || "None"}</p>
          </div>
          <p>Keep exploring,<br><strong>Team Nomadik</strong></p>
        </div>
      `;
      await sendEmail({
        to: consultationData.email,
        subject: `Consultation Booked | Nomadik`,
        html: emailHtml,
      });
    } catch (emailErr) {
      console.error("Failed to send consultation confirmation email:", emailErr);
    }
  }

  return { success: true };
}

export async function submitCallbackRequest(callbackData: {
  name: string;
  phone: string;
  preferred_time?: string;
  notes?: string;
}) {
  if (!callbackData.name?.trim()) throw new Error("Name is required");
  if (!callbackData.phone?.trim()) throw new Error("Phone number is required");

  const { error } = await supabase
    .from("callback_requests")
    .insert([{
      name: callbackData.name.trim(),
      phone: callbackData.phone.trim(),
      preferred_time: callbackData.preferred_time?.trim() || null,
      notes: callbackData.notes?.trim() || null,
      status: "NEW"
    }]);

  if (error) {
    console.error("Callback Request submission error:", error);
    throw new Error("Failed to submit callback request: " + error.message);
  }

  return { success: true };
}

