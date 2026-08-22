import { createServerFn } from "@tanstack/react-start";
import * as db from "@/server/queries";

export const submitInquiryFn = createServerFn({ method: "POST" })
  .validator((data: db.SubmitInquiryInput) => data)
  .handler(async ({ data }) => {
    return await db.submitInquiry(data);
  });

export const getInquiriesFn = createServerFn({ method: "GET" })
  .validator((status: db.InquiryStatus | undefined) => status)
  .handler(async ({ data }) => {
    return await db.getInquiries(data);
  });

export const updateInquiryStatusFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: db.InquiryStatus; notes?: string }) => data)
  .handler(async ({ data }) => {
    return await db.updateInquiryStatus(data.id, data.status, data.notes);
  });

export { createBookingFn } from "@/lib/booking-fns";

export const getBookingsFn = createServerFn({ method: "GET" })
  .validator((status: db.BookingStatus | undefined) => status)
  .handler(async ({ data }) => {
    return await db.getBookings(data);
  });

export const updateBookingStatusFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; bookingStatus: db.BookingStatus; paymentStatus?: db.PaymentStatus }) => data)
  .handler(async ({ data }) => {
    return await db.updateBookingStatus(data.id, data.bookingStatus, data.paymentStatus);
  });

export const getAdminSettingsFn = createServerFn({ method: "GET" })
  .validator((category: string | undefined) => category)
  .handler(async ({ data }) => {
    return await db.getAdminSettings(data);
  });

export const updateAdminSettingFn = createServerFn({ method: "POST" })
  .validator((data: { key: string; value: any }) => data)
  .handler(async ({ data }) => {
    return await db.updateAdminSetting(data.key, data.value);
  });

export const getDashboardStatsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    return await db.getDashboardStats();
  });

export const verifyAdminFn = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .handler(async ({ data }) => {
    return await db.verifyAdmin(data);
  });

export const submitContactInquiryFn = createServerFn({ method: "POST" })
  .validator((data: { name: string; email: string; phone: string; subject: string; message: string }) => data)
  .handler(async ({ data }) => {
    return await db.submitContactInquiry(data);
  });

export const submitConsultationRequestFn = createServerFn({ method: "POST" })
  .validator((data: { 
    name: string; 
    email?: string; 
    phone: string; 
    destination?: string;
    budget?: string;
    preferred_date?: string; 
    preferred_time?: string;
    notes?: string; 
  }) => data)
  .handler(async ({ data }) => {
    return await db.submitConsultationRequest(data);
  });

export const submitCallbackRequestFn = createServerFn({ method: "POST" })
  .validator((data: { name: string; phone: string; preferred_time?: string; notes?: string }) => data)
  .handler(async ({ data }) => {
    return await db.submitCallbackRequest(data);
  });

// ── Admin Server Functions (Secure Service Role Access) ──
import { getBookings, getBookingById } from "@/lib/queries/bookings";
import { getPayments, getCouponUsagesAndAnalytics, getBlogs, getBlogById, createBlog, updateBlog, deleteBlog } from "@/lib/queries/admin";

export const getAdminBookingsListFn = createServerFn({ method: "POST" })
  .validator((params: any) => params)
  .handler(async ({ data: params }) => {
    return await getBookings(params);
  });

export const getAdminBookingDetailFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    return await getBookingById(id);
  });

export const getAdminPaymentsListFn = createServerFn({ method: "POST" })
  .validator((params: any) => params)
  .handler(async ({ data: params }) => {
    return await getPayments(params);
  });

export const getAdminCouponAnalyticsFn = createServerFn({ method: "POST" })
  .validator((params: any) => params)
  .handler(async ({ data: params }) => {
    return await getCouponUsagesAndAnalytics(params);
  });

// ── Admin Blog CMS Server Functions (Secure Service Role Access) ──
export const getAdminBlogsListFn = createServerFn({ method: "POST" })
  .validator((params: any) => params)
  .handler(async ({ data: params }) => {
    return await getBlogs(params);
  });

export const getAdminBlogDetailFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    return await getBlogById(id);
  });

export const createBlogFn = createServerFn({ method: "POST" })
  .validator((payload: any) => payload)
  .handler(async ({ data: payload }) => {
    return await createBlog(payload);
  });

export const updateBlogFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; payload: any }) => data)
  .handler(async ({ data }) => {
    return await updateBlog(data.id, data.payload);
  });

export const deleteBlogFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    return await deleteBlog(id);
  });

// ── Review Submission Server Function (Secure Service Role Access) ──
import { getSupabaseAdmin } from "@/lib/supabase-admin";

interface SubmitReviewServerInput {
  journey_id: string;
  destination_id?: string;
  booking_id?: string;
  author_name: string;
  instagram_handle?: string;
  title: string;
  review: string;
  overall_rating: number;
  hotel_rating?: number;
  transport_rating?: number;
  food_rating?: number;
  captain_rating?: number;
  safety_rating?: number;
  value_rating?: number;
  would_recommend?: boolean;
  anonymous?: boolean;
  media_files?: { type: string; url: string; thumbnail?: string }[];
}

export const submitReviewFn = createServerFn({ method: "POST" })
  .validator((data: SubmitReviewServerInput) => data)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return { success: false, error: "Server configuration error. Please try again later." };
    }

    const nowStr = new Date().toISOString();
    const displayName = data.anonymous ? "Anonymous Explorer" : (data.author_name || "Traveler");

    // Only pass journey_id if it is a valid UUID to satisfy Postgres UUID constraint
    const isUuid = typeof data.journey_id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.journey_id);
    const validJourneyId = isUuid ? data.journey_id : null;

    // 1. Insert into `reviews` table (pending approval)
    const reviewPayload: Record<string, any> = {
      journey_id: validJourneyId,
      author_name: displayName,
      content: data.review,
      rating: data.overall_rating,
      verified: true,
      approved: false,
      is_approved: false,
      created_at: nowStr,
    };

    const { data: reviewRow, error: reviewErr } = await admin
      .from("reviews")
      .insert(reviewPayload)
      .select("id")
      .single();

    if (reviewErr) {
      console.error("[submitReviewFn] reviews insert error:", reviewErr.message);
    }

    // 2. Insert into `stories` table (unpublished, pending admin approval)
    const storySlug = `review-${displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}-${Date.now().toString(36)}`;
    const authorObj = {
      name: displayName,
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80",
      college: "Nomadik Traveler",
      role: "Verified Traveler",
      ...(data.instagram_handle ? { instagram: data.instagram_handle } : {}),
    };

    const storyPayload: Record<string, any> = {
      slug: storySlug,
      category: data.destination_id || "Traveler Review",
      title: data.title || "Nomadik Expedition Review",
      snippet: data.review.slice(0, 300),
      content: data.review,
      image_url: data.media_files?.[0]?.url || "/images/manali/manali-snow-valley.jpg",
      author: authorObj,
      read_time: Math.max(1, Math.ceil(data.review.length / 1000)),
      rating: data.overall_rating,
      is_featured: false,
      is_published: false,
      published_at: null,
      created_at: nowStr,
    };

    const { data: storyRow, error: storyErr } = await admin
      .from("stories")
      .insert(storyPayload)
      .select("id")
      .single();

    if (storyErr) {
      console.error("[submitReviewFn] stories insert error:", storyErr.message);
    }

    if (reviewErr && storyErr) {
      return {
        success: false,
        error: `Failed to save review: ${reviewErr.message || storyErr.message}`,
      };
    }

    const insertedReviewId = reviewRow?.id || storyRow?.id || `local-${Date.now()}`;

    return {
      success: true,
      reviewId: insertedReviewId,
    };
  });

// ==================== ADMIN REVIEWS SERVER FUNCTIONS ====================

export const getAdminReviewsFn = createServerFn({ method: "GET" })
  .validator((params: { status?: string; search?: string } = {}) => params)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return { success: false, error: "Server configuration error", reviews: [] };
    }

    try {
      const { data: dbReviews } = await admin
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: dbStories } = await admin
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false });

      const formattedReviews = (dbReviews || []).map((r: any) => {
        const isApproved = r.is_approved ?? r.approved ?? false;
        return {
          id: r.id,
          journey_id: r.journey_id,
          author_name: r.author_name || "Explorer",
          title: r.content ? (r.content.length > 50 ? `${r.content.slice(0, 50)}...` : r.content) : "Traveler Review",
          review: r.content || "",
          content: r.content || "",
          overall_rating: r.rating || 5,
          hotel_rating: 5,
          transport_rating: 5,
          food_rating: 5,
          captain_rating: 5,
          safety_rating: 5,
          value_rating: 5,
          status: isApproved ? "approved" : "pending",
          is_approved: isApproved,
          featured: false,
          is_featured: false,
          verified: r.verified ?? true,
          is_verified: r.verified ?? true,
          trip_date: r.trip_date || "Recent Trip",
          created_at: r.created_at || new Date().toISOString(),
          media: [],
          replies: [],
          sourceTable: "reviews",
        };
      });

      const formattedStories = (dbStories || []).map((s: any) => {
        let authorName = "Explorer";
        let avatarUrl = null;
        let college = null;
        if (typeof s.author === "object" && s.author !== null) {
          authorName = s.author.name || "Explorer";
          avatarUrl = s.author.avatar || null;
          college = s.author.college || null;
        } else if (typeof s.author === "string" && s.author.startsWith("{")) {
          try {
            const parsed = JSON.parse(s.author);
            authorName = parsed.name || "Explorer";
            avatarUrl = parsed.avatar || null;
            college = parsed.college || null;
          } catch {}
        } else if (typeof s.author === "string") {
          authorName = s.author;
        }

        const isPublished = !!s.is_published;
        return {
          id: s.id,
          slug: s.slug,
          journey_id: s.category || "Trip Story",
          author_name: authorName,
          avatar_url: avatarUrl,
          college: college,
          title: s.title || "Traveler Story",
          review: s.content || s.snippet || "",
          content: s.content || s.snippet || "",
          overall_rating: s.rating || 5,
          hotel_rating: 5,
          transport_rating: 5,
          food_rating: 5,
          captain_rating: 5,
          safety_rating: 5,
          value_rating: 5,
          status: isPublished ? "approved" : "pending",
          is_approved: isPublished,
          featured: !!s.is_featured,
          is_featured: !!s.is_featured,
          verified: true,
          is_verified: true,
          trip_date: "Verified Trip",
          created_at: s.created_at || new Date().toISOString(),
          media: s.image_url ? [{ id: `med-${s.id}`, review_id: s.id, type: "image", url: s.image_url }] : [],
          replies: [],
          sourceTable: "stories",
        };
      });

      const combined = [...formattedStories, ...formattedReviews];
      const uniqueMap = new Map<string, any>();
      combined.forEach((item) => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });
      let result = Array.from(uniqueMap.values());

      if (data?.status && data.status !== "ALL") {
        const s = data.status.toLowerCase();
        if (s === "pending") {
          result = result.filter((r) => r.status === "pending" || !r.is_approved);
        } else if (s === "approved") {
          result = result.filter((r) => r.status === "approved" || r.is_approved);
        } else if (s === "featured") {
          result = result.filter((r) => r.is_featured || r.featured);
        } else if (s === "ai_flagged") {
          result = result.filter((r) => r.status === "ai_flagged");
        } else if (s === "rejected") {
          result = result.filter((r) => r.status === "rejected");
        }
      }

      if (data?.search) {
        const q = data.search.toLowerCase();
        result = result.filter(
          (r) =>
            r.author_name.toLowerCase().includes(q) ||
            r.title.toLowerCase().includes(q) ||
            r.review.toLowerCase().includes(q)
        );
      }

      return { success: true, reviews: result };
    } catch (err: any) {
      return { success: false, error: err.message, reviews: [] };
    }
  });

export const adminApproveReviewFn = createServerFn({ method: "POST" })
  .validator((data: { reviewId: string }) => data)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    if (!admin) return { success: false, error: "Server configuration error" };

    const nowStr = new Date().toISOString();

    await admin
      .from("reviews")
      .update({ is_approved: true, approved: true })
      .eq("id", data.reviewId);

    await admin
      .from("stories")
      .update({ is_published: true, published_at: nowStr })
      .eq("id", data.reviewId);

    return { success: true };
  });

export const adminRejectReviewFn = createServerFn({ method: "POST" })
  .validator((data: { reviewId: string }) => data)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    if (!admin) return { success: false, error: "Server configuration error" };

    await admin
      .from("reviews")
      .update({ is_approved: false, approved: false })
      .eq("id", data.reviewId);

    await admin
      .from("stories")
      .update({ is_published: false })
      .eq("id", data.reviewId);

    return { success: true };
  });

export const adminFeatureReviewFn = createServerFn({ method: "POST" })
  .validator((data: { reviewId: string; isFeatured: boolean }) => data)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    if (!admin) return { success: false, error: "Server configuration error" };

    await admin
      .from("stories")
      .update({ is_featured: data.isFeatured })
      .eq("id", data.reviewId);

    return { success: true };
  });

export const adminDeleteReviewFn = createServerFn({ method: "POST" })
  .validator((data: { reviewId: string }) => data)
  .handler(async ({ data }) => {
    const admin = getSupabaseAdmin();
    if (!admin) return { success: false, error: "Server configuration error" };

    await admin.from("reviews").delete().eq("id", data.reviewId);
    await admin.from("stories").delete().eq("id", data.reviewId);

    return { success: true };
  });


