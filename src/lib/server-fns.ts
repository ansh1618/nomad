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

export const createBookingFn = createServerFn({ method: "POST" })
  .validator((data: {
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
  }) => data)
  .handler(async ({ data }) => {
    return await db.createBooking(data);
  });

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


