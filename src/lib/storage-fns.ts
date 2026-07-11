/**
 * storage-fns.ts
 * Supabase Storage utilities for uploading traveler documents
 * (Aadhar Card + Profile Photo) during the booking flow.
 *
 * Bucket: traveler_documents (private, 2MB limit)
 * Policy: Anyone can upload; admins & owner can read
 */

import { supabase } from "./supabase";

// ─── Constants ────────────────────────────────────────────────────────────────
const BUCKET = "traveler_documents";
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UploadResult {
  url: string;        // Signed URL (valid 1 year) to store in bookings table
  path: string;       // Storage path for reference
}

export interface UploadError {
  message: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────
export function validateFile(file: File): UploadError | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { message: `File "${file.name}" is too large. Maximum size is 2MB.` };
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { message: `File type "${file.type}" is not allowed. Use JPG, PNG, WebP, or PDF.` };
  }
  return null;
}

// ─── Core Upload Function ──────────────────────────────────────────────────────
/**
 * Upload a single file to Supabase Storage.
 * Returns a signed URL valid for 1 year (365 * 24 * 3600 seconds).
 *
 * @param file     The File object from an <input type="file">
 * @param folder   Subfolder within the bucket, e.g. "aadhar" or "profile"
 * @param bookingRef   Unique booking reference for namespacing the file
 */
async function uploadFile(
  file: File,
  folder: "aadhar" | "profile",
  bookingRef: string
): Promise<UploadResult> {
  // 1. Validate before upload
  const validationError = validateFile(file);
  if (validationError) {
    throw new Error(validationError.message);
  }

  // 2. Build a unique, sanitized file path
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const timestamp = Date.now();
  // Path: aadhar/NM-2026-0001_1720449600000.jpg
  const filePath = `${folder}/${bookingRef}_${timestamp}.${ext}`;

  // 3. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false, // Prevent accidental overwrite
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 4. Generate a signed URL valid for 1 year
  const { data: signedData, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 365 * 24 * 3600);

  if (signError || !signedData?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${signError?.message}`);
  }

  return {
    url: signedData.signedUrl,
    path: filePath,
  };
}

// ─── Public Upload Helpers ─────────────────────────────────────────────────────

/**
 * Upload traveler's Aadhar card photo.
 * Call this in Step 2 of the booking flow.
 *
 * @example
 * const result = await uploadAadharPhoto(file, "NM-2026-0001");
 * bookingState.aadharUrl = result.url;
 */
export async function uploadAadharPhoto(
  file: File,
  bookingRef: string
): Promise<UploadResult> {
  return uploadFile(file, "aadhar", bookingRef);
}

/**
 * Upload traveler's profile photo.
 * Call this in Step 2 of the booking flow.
 *
 * @example
 * const result = await uploadProfilePhoto(file, "NM-2026-0001");
 * bookingState.profileUrl = result.url;
 */
export async function uploadProfilePhoto(
  file: File,
  bookingRef: string
): Promise<UploadResult> {
  return uploadFile(file, "profile", bookingRef);
}

/**
 * Upload both documents simultaneously.
 * Returns both URLs or throws if either fails.
 *
 * @example
 * const { aadharUrl, profileUrl } = await uploadTravelerDocuments(
 *   aadharFile, profileFile, "NM-2026-0001"
 * );
 */
export async function uploadTravelerDocuments(
  aadharFile: File,
  profileFile: File,
  bookingRef: string
): Promise<{ aadharUrl: string; profileUrl: string }> {
  const [aadharResult, profileResult] = await Promise.all([
    uploadAadharPhoto(aadharFile, bookingRef),
    uploadProfilePhoto(profileFile, bookingRef),
  ]);

  return {
    aadharUrl: aadharResult.url,
    profileUrl: profileResult.url,
  };
}
