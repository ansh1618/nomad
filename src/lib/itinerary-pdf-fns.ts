import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as dbPdf from "@/server/itinerary-pdf";

// Get package documents for client
export const getPackageDocumentsFn = createServerFn({ method: "GET" })
  .validator((packageId: string) => packageId)
  .handler(async ({ data: packageId }) => {
    return await dbPdf.getAllPackageDocuments();
  });

// Get document by slug and type
export const getPackageDocumentBySlugFn = createServerFn({ method: "GET" })
  .validator((data: { slug: string; type: dbPdf.DocumentType }) => data)
  .handler(async ({ data }) => {
    return await dbPdf.getPackageDocumentBySlug(data.slug, data.type);
  });

// Get all documents for admin panel
export const getAllPackageDocumentsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    return await dbPdf.getAllPackageDocuments();
  });

// Create or update document metadata schema validator
const documentPayloadSchema = z.object({
  package_id: z.string().optional(),
  journey_id: z.string().optional(),
  document_type: z.enum(['ITINERARY', 'PACKING', 'GUIDE', 'TERMS', 'OTHER', 'VOUCHER', 'TICKET', 'INVOICE']),
  title: z.string(),
  file_url: z.string().optional(),
  storage_path: z.string().optional(),
  bucket_name: z.string().optional(),
  page_count: z.number().optional(),
  size: z.number().optional(),
  file_size: z.number().optional(),
  thumbnail_url: z.string().optional(),
  version: z.number().optional(),
  allow_download: z.boolean().optional(),
  allow_print: z.boolean().optional(),
  allow_copy: z.boolean().optional(),
  watermark_enabled: z.boolean().optional(),
  uploaded_by: z.string().optional(),
});

// Create/Update document metadata (Transactional metadata insert)
export const createOrUpdateDocumentFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof documentPayloadSchema>) => documentPayloadSchema.parse(data))
  .handler(async ({ data }) => {
    const journeyId = data.journey_id || data.package_id || "";
    const storagePath = data.storage_path || data.file_url || "";
    return await dbPdf.createOrUpdateJourneyDocument({
      journey_id: journeyId,
      document_type: data.document_type as dbPdf.DocumentType,
      title: data.title,
      bucket_name: data.bucket_name || "itineraries",
      storage_path: storagePath,
      file_size: data.file_size || data.size || 0,
      page_count: data.page_count || 14,
      allow_download: data.allow_download ?? true,
      allow_print: data.allow_print ?? true,
      allow_copy: data.allow_copy ?? true,
      watermark_enabled: data.watermark_enabled ?? true,
      uploaded_by: data.uploaded_by
    });
  });

// Archive document
export const archiveDocumentFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    return await dbPdf.archiveDocument(id);
  });

// Restore document
export const restoreDocumentFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    return await dbPdf.restoreDocument(id);
  });

// Get Signed URL dynamically
export const getItineraryPdfSignedUrlFn = createServerFn({ method: "POST" })
  .validator((pathOrUrl: string) => pathOrUrl)
  .handler(async ({ data: pathOrUrl }) => {
    return await dbPdf.getJourneyDocumentSignedUrl(pathOrUrl);
  });

// Lead capture schema validator
const leadSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  package_id: z.string().optional(),
  journey_id: z.string().optional(),
  city: z.string().optional(),
  source: z.string().optional(),
});

// Capture lead
export const captureItineraryLeadFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof leadSchema>) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    return await dbPdf.captureItineraryLead({
      email: data.email,
      phone: data.phone,
      package_id: data.journey_id || data.package_id || "",
      city: data.city,
      source: data.source
    });
  });

// Log PDF view start validator
const viewStartSchema = z.object({
  user_id: z.string().uuid().nullable().optional(),
  package_id: z.string().optional(),
  journey_id: z.string().optional(),
  document_id: z.string().optional(),
  ip_address: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
});

// Log view start
export const logPdfViewStartFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof viewStartSchema>) => viewStartSchema.parse(data))
  .handler(async ({ data }) => {
    return await dbPdf.logPdfViewStart({
      user_id: data.user_id || null,
      package_id: data.journey_id || data.package_id || "",
      document_id: data.document_id || "",
      device: data.device,
      browser: data.browser
    });
  });

// Heartbeat updater validator
const viewHeartbeatSchema = z.object({
  viewId: z.string(),
  last_page_viewed: z.number().int().min(1),
  max_page_reached: z.number().int().min(1),
  progress_percent: z.number().int().min(0).max(100),
  reading_time: z.number().int().min(0),
  completed: z.boolean().optional(),
});

// Update heartbeat
export const updatePdfViewHeartbeatFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof viewHeartbeatSchema>) => viewHeartbeatSchema.parse(data))
  .handler(async ({ data }) => {
    return await dbPdf.updatePdfViewHeartbeat(data);
  });

// Get admin analytics
export const getAdminPdfAnalyticsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    return await dbPdf.getAdminPdfAnalytics();
  });

// Get admin leads list
export const getItineraryLeadsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    return await dbPdf.getItineraryLeads();
  });
