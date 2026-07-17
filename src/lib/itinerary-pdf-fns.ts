import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as dbPdf from "@/server/itinerary-pdf";

// Get package documents for client
export const getPackageDocumentsFn = createServerFn({ method: "GET" })
  .validator((packageId: string) => packageId)
  .handler(async ({ data: packageId }) => {
    return await dbPdf.getPackageDocuments(packageId);
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
  package_id: z.string().uuid(),
  document_type: z.enum(['ITINERARY', 'PACKING', 'GUIDE', 'TERMS', 'OTHER', 'VOUCHER', 'INVOICE']),
  title: z.string(),
  file_url: z.string().url(),
  page_count: z.number().optional(),
  size: z.number().optional(),
  thumbnail_url: z.string().optional(),
  version: z.number().optional(),
  allow_download: z.boolean().optional(),
  allow_print: z.boolean().optional(),
  allow_copy: z.boolean().optional(),
  watermark_enabled: z.boolean().optional(),
  uploaded_by: z.string().uuid().optional(),
});

// Create/Update document metadata
export const createOrUpdateDocumentFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof documentPayloadSchema>) => documentPayloadSchema.parse(data))
  .handler(async ({ data }) => {
    return await dbPdf.createOrUpdateDocument(data as dbPdf.PackageDocumentPayload);
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

// Get 10-minute Signed URL
export const getItineraryPdfSignedUrlFn = createServerFn({ method: "POST" })
  .validator((fileUrl: string) => fileUrl)
  .handler(async ({ data: fileUrl }) => {
    return await dbPdf.getItineraryPdfSignedUrl(fileUrl);
  });

// Lead capture schema validator
const leadSchema = z.object({
  email: z.string().email(),
  phone: z.string().optional(),
  package_id: z.string().uuid(),
  city: z.string().optional(),
  source: z.string().optional(),
});

// Capture lead
export const captureItineraryLeadFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof leadSchema>) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    return await dbPdf.captureItineraryLead(data);
  });

// Log PDF view start validator
const viewStartSchema = z.object({
  user_id: z.string().uuid().nullable(),
  package_id: z.string().uuid(),
  document_id: z.string().uuid(),
  ip_address: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
});

// Log view start
export const logPdfViewStartFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof viewStartSchema>) => viewStartSchema.parse(data))
  .handler(async ({ data }) => {
    return await dbPdf.logPdfViewStart(data);
  });

// Heartbeat updater validator
const viewHeartbeatSchema = z.object({
  viewId: z.string().uuid(),
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

// Log download count
export const incrementDownloadCountFn = createServerFn({ method: "POST" })
  .validator((viewId: string) => viewId)
  .handler(async ({ data: viewId }) => {
    return await dbPdf.incrementDownloadCount(viewId);
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

const uploadDocumentFileSchema = z.object({
  packageId: z.string().uuid(),
  documentType: z.enum(['ITINERARY', 'PACKING', 'GUIDE', 'TERMS', 'OTHER', 'VOUCHER', 'INVOICE']),
  title: z.string(),
  fileName: z.string(),
  fileBase64: z.string(),
  fileSize: z.number(),
  allowDownload: z.boolean().optional(),
  allowPrint: z.boolean().optional(),
  allowCopy: z.boolean().optional(),
  watermarkEnabled: z.boolean().optional(),
  uploadedBy: z.string().uuid().optional(),
});

export const uploadDocumentFileFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof uploadDocumentFileSchema>) => uploadDocumentFileSchema.parse(data))
  .handler(async ({ data }) => {
    return await dbPdf.uploadDocumentFile(data);
  });

