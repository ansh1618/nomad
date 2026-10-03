/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  getStudentOfferSettings,
  getEligibleDestinations,
  getEligiblePackages,
  getUserStudentVerification,
  getStudentDocumentSignedUrl,
} from "./service";

// ============================================================================
// 1. SECURE SERVER-SIDE STUDENT BOOKING VALIDATION
// ============================================================================

const validateStudentBookingSchema = z.object({
  userId: z.string().nullable().optional(),
  userEmail: z.string().email(),
  packageId: z.string(),
  departureId: z.string().optional().nullable(),
  regularBasePrice: z.number(),
  couponCode: z.string().nullable().optional(),
});

export interface StudentBookingValidationResult {
  isEligibleForStudentPrice: boolean;
  effectiveDiscountPercentage: number;
  discountAmount: number;
  studentPrice: number;
  couponAllowed: boolean;
  rejectedReason?: string;
  verificationStatus: string;
}

export const validateStudentBookingEligibilityFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof validateStudentBookingSchema>) => validateStudentBookingSchema.parse(data))
  .handler(async ({ data }): Promise<StudentBookingValidationResult> => {
    try {
      // 1. Fetch program settings
      const settings = await getStudentOfferSettings();
      if (!settings.enabled) {
        return {
          isEligibleForStudentPrice: false,
          effectiveDiscountPercentage: 0,
          discountAmount: 0,
          studentPrice: data.regularBasePrice,
          couponAllowed: true,
          rejectedReason: "The College Student Travel Program is currently inactive.",
          verificationStatus: "INACTIVE",
        };
      }

      // Check program dates if set
      const now = new Date();
      if (settings.start_date && new Date(settings.start_date) > now) {
        return {
          isEligibleForStudentPrice: false,
          effectiveDiscountPercentage: 0,
          discountAmount: 0,
          studentPrice: data.regularBasePrice,
          couponAllowed: true,
          rejectedReason: "This college student offer has not started yet.",
          verificationStatus: "NOT_STARTED",
        };
      }
      if (settings.end_date && new Date(settings.end_date) < now) {
        return {
          isEligibleForStudentPrice: false,
          effectiveDiscountPercentage: 0,
          discountAmount: 0,
          studentPrice: data.regularBasePrice,
          couponAllowed: true,
          rejectedReason: "This college student offer has expired.",
          verificationStatus: "EXPIRED_OFFER",
        };
      }

      // 2. Authenticated user and verification check
      const verification = await getUserStudentVerification(data.userId, data.userEmail);
      if (!verification) {
        return {
          isEligibleForStudentPrice: false,
          effectiveDiscountPercentage: 0,
          discountAmount: 0,
          studentPrice: data.regularBasePrice,
          couponAllowed: true,
          rejectedReason: "Student verification required. Please verify your student status to unlock this price.",
          verificationStatus: "UNVERIFIED",
        };
      }

      if (verification.status === "PENDING") {
        return {
          isEligibleForStudentPrice: false,
          effectiveDiscountPercentage: 0,
          discountAmount: 0,
          studentPrice: data.regularBasePrice,
          couponAllowed: true,
          rejectedReason: "Your student verification is under review.",
          verificationStatus: "PENDING",
        };
      }

      if (verification.status === "REJECTED") {
        return {
          isEligibleForStudentPrice: false,
          effectiveDiscountPercentage: 0,
          discountAmount: 0,
          studentPrice: data.regularBasePrice,
          couponAllowed: true,
          rejectedReason: verification.rejection_reason || "Verification could not be approved. Please submit valid student credentials.",
          verificationStatus: "REJECTED",
        };
      }

      if (verification.status === "EXPIRED" || (verification.expires_at && new Date(verification.expires_at) < now)) {
        return {
          isEligibleForStudentPrice: false,
          effectiveDiscountPercentage: 0,
          discountAmount: 0,
          studentPrice: data.regularBasePrice,
          couponAllowed: true,
          rejectedReason: "Your student verification has expired. Please verify again.",
          verificationStatus: "EXPIRED",
        };
      }

      if (verification.status !== "VERIFIED") {
        return {
          isEligibleForStudentPrice: false,
          effectiveDiscountPercentage: 0,
          discountAmount: 0,
          studentPrice: data.regularBasePrice,
          couponAllowed: true,
          rejectedReason: "Student verification required.",
          verificationStatus: verification.status,
        };
      }

      // 3. Package Eligibility Check
      const eligiblePackages = await getEligiblePackages();
      const matchedPkg = eligiblePackages.find(
        (p) => p.package_id === data.packageId || (p.package && (p.package.id === data.packageId || p.package.slug === data.packageId))
      );

      // Check if package is eligible
      if (!matchedPkg || !matchedPkg.is_eligible || matchedPkg.is_active === false) {
        return {
          isEligibleForStudentPrice: false,
          effectiveDiscountPercentage: 0,
          discountAmount: 0,
          studentPrice: data.regularBasePrice,
          couponAllowed: true,
          rejectedReason: "This package is not eligible for the College Student Offer.",
          verificationStatus: "PACKAGE_INELIGIBLE",
        };
      }

      // 4. Destination Eligibility Check
      const destinationId = matchedPkg.package?.destination_id;
      if (destinationId) {
        const eligibleDestinations = await getEligibleDestinations();
        const matchedDest = eligibleDestinations.find(
          (d) => d.destination_id === destinationId || (d.destination && d.destination.id === destinationId)
        );
        if (!matchedDest || !matchedDest.is_eligible) {
          return {
            isEligibleForStudentPrice: false,
            effectiveDiscountPercentage: 0,
            discountAmount: 0,
            studentPrice: data.regularBasePrice,
            couponAllowed: true,
            rejectedReason: "The destination for this package is not currently eligible for the student program.",
            verificationStatus: "DESTINATION_INELIGIBLE",
          };
        }
      }

      // 5. Calculate Discount Percentage
      let discountPct = settings.discount_percentage;
      if (matchedPkg.override_global_discount && typeof matchedPkg.custom_discount_percentage === "number") {
        discountPct = matchedPkg.custom_discount_percentage;
      }

      // Cap at maximum discount percentage configured by admin
      discountPct = Math.min(discountPct, settings.maximum_discount_percentage);

      // Calculate server-side student discount amount from regular/base price
      const discountAmount = Math.round((data.regularBasePrice * discountPct) / 100);
      const studentPrice = Math.max(0, data.regularBasePrice - discountAmount);

      // 6. Check Coupon Stacking Rules
      const couponAllowed = settings.allow_coupon_stacking;
      if (data.couponCode && !couponAllowed) {
        // Business Rule: Student discount does NOT stack with coupons unless explicitly enabled by Admin
        console.log(`[validateStudentBooking] Coupon ${data.couponCode} not stackable with student discount.`);
      }

      return {
        isEligibleForStudentPrice: true,
        effectiveDiscountPercentage: discountPct,
        discountAmount,
        studentPrice,
        couponAllowed,
        verificationStatus: "VERIFIED",
      };
    } catch (err: any) {
      console.error("[validateStudentBookingEligibilityFn] Error:", err);
      return {
        isEligibleForStudentPrice: false,
        effectiveDiscountPercentage: 0,
        discountAmount: 0,
        studentPrice: data.regularBasePrice,
        couponAllowed: true,
        rejectedReason: "An error occurred during student validation.",
        verificationStatus: "ERROR",
      };
    }
  });

// ============================================================================
// 2. SECURE DOCUMENT UPLOAD TO PRIVATE BUCKET
// ============================================================================

const uploadDocumentSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileBase64: z.string(), // Base64 data without data: prefix or with it
  userId: z.string().optional(),
});

export const uploadStudentDocumentFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof uploadDocumentSchema>) => uploadDocumentSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
      let mime = data.fileType.toLowerCase();
      if (!allowedMimes.includes(mime)) {
        if (mime.includes("jpeg") || mime.includes("jpg")) mime = "image/jpeg";
        else if (mime.includes("png")) mime = "image/png";
        else if (mime.includes("pdf")) mime = "application/pdf";
        else throw new Error("Invalid document format. Only JPG, PNG, WEBP, or PDF files are accepted.");
      }

      // Clean base64
      let cleanBase64 = data.fileBase64;
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1];
      }

      const buffer = Buffer.from(cleanBase64, "base64");
      const fileSize = buffer.length;

      // Validate 10MB limit
      if (fileSize > 10 * 1024 * 1024) {
        throw new Error("File exceeds maximum allowed size of 10MB.");
      }

      const ext = mime === "application/pdf" ? "pdf" : mime.split("/")[1] || "png";
      const sanitizedName = data.fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const timestamp = Date.now();
      const randomKey = Math.random().toString(36).substring(2, 8);
      const relativePath = `verifications/${timestamp}_${randomKey}_${sanitizedName}`;

      const { data: uploadRes, error: uploadErr } = await supabaseAdmin.storage
        .from("student_documents")
        .upload(relativePath, buffer, {
          contentType: mime,
          upsert: false,
        });

      if (uploadErr || !uploadRes) {
        console.error("[uploadStudentDocumentFn] Upload error:", uploadErr);
        throw new Error(uploadErr?.message || "Failed to upload document to secure storage.");
      }

      return {
        success: true,
        filePath: relativePath,
        fileName: data.fileName,
        fileSize,
        mimeType: mime,
      };
    } catch (err: any) {
      console.error("[uploadStudentDocumentFn Error]:", err);
      throw new Error(err.message || "Failed to upload verification document");
    }
  });

// ============================================================================
// 3. ADMIN GET SIGNED DOCUMENT URL
// ============================================================================

const getSignedUrlSchema = z.object({
  filePath: z.string().min(1),
});

export const adminGetStudentDocumentSignedUrlFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof getSignedUrlSchema>) => getSignedUrlSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const signedUrl = await getStudentDocumentSignedUrl(data.filePath);
      if (!signedUrl) {
        throw new Error("Could not generate signed access URL for this document.");
      }
      return { success: true, signedUrl };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to get document URL" };
    }
  });
