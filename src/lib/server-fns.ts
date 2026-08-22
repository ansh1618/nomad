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

    // 1. Insert into `reviews` table (pending approval)
    const reviewPayload: Record<string, any> = {
      journey_id: data.journey_id,
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
      // Continue - still try stories table
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
      category: "Traveler Review",
      title: data.title,
      snippet: data.review.slice(0, 300),
      content: data.review,
      image_url: data.media_files?.[0]?.url || "/images/manali/manali-snow-valley.jpg",
      author: authorObj,
      read_time: Math.max(1, Math.ceil(data.review.length / 1000)),
      rating: data.overall_rating,
      is_featured: false,
      is_published: false,
      published_at: null,
    };

    const { error: storyErr } = await admin.from("stories").insert(storyPayload);
    if (storyErr) {
      console.error("[submitReviewFn] stories insert error:", storyErr.message);
    }

    const insertedReviewId = reviewRow?.id || `local-${Date.now()}`;

    return {
      success: true,
      reviewId: insertedReviewId,
    };
  });

