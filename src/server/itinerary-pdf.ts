import { supabaseAdmin } from "@/lib/supabase-admin";

export type DocumentType = 'ITINERARY' | 'PACKING' | 'GUIDE' | 'TERMS' | 'OTHER' | 'VOUCHER' | 'INVOICE';

export interface PackageDocumentPayload {
  package_id: string;
  document_type: DocumentType;
  title: string;
  file_url: string;
  page_count?: number;
  size?: number;
  thumbnail_url?: string;
  version?: number;
  allow_download?: boolean;
  allow_print?: boolean;
  allow_copy?: boolean;
  watermark_enabled?: boolean;
  uploaded_by?: string;
}

// 1. Get all active documents for a specific package
export async function getPackageDocuments(packageId: string) {
  const { data, error } = await supabaseAdmin
    .from("package_documents")
    .select("*")
    .eq("package_id", packageId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching package documents:", error.message);
    throw new Error(error.message);
  }
  return data || [];
}

// 2. Get a single active document by package slug, destination slug, or type
export async function getPackageDocumentBySlug(slug: string, documentType: DocumentType = 'ITINERARY') {
  let packageId: string | null = null;
  let pkgData: any = null;

  // 1. Try finding journey by exact slug
  const { data: pkg } = await supabaseAdmin
    .from("journeys")
    .select("id, name, slug, destination_slug, image_url, destination")
    .eq("slug", slug)
    .maybeSingle();

  if (pkg?.id) {
    packageId = pkg.id;
    pkgData = pkg;
  } else {
    // 2. Try finding journey by destination_slug matching slug
    const { data: destPkg } = await supabaseAdmin
      .from("journeys")
      .select("id, name, slug, destination_slug, image_url, destination")
      .or(`destination_slug.eq.${slug},destination.ilike.%${slug}%`)
      .limit(1)
      .maybeSingle();

    if (destPkg?.id) {
      packageId = destPkg.id;
      pkgData = destPkg;
    }
  }

  if (!packageId) {
    console.log("[getPackageDocumentBySlug] No matching package found for slug:", slug);
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("package_documents")
    .select("*, journeys(id, name, slug, destination_slug, image_url)")
    .eq("package_id", packageId)
    .eq("document_type", documentType)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Error fetching package document by slug:", error.message);
    return null;
  }

  if (data) {
    return {
      ...data,
      journey_name: pkgData?.name || data.journeys?.name,
      cover_image: pkgData?.image_url || data.journeys?.image_url,
    };
  }

  return null;
}

// 3. Get all documents (active or archived) for admin list
export async function getAllPackageDocuments() {
  const { data, error } = await supabaseAdmin
    .from("package_documents")
    .select(`
      *,
      journeys (
        id,
        name,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all package documents:", error.message);
    throw new Error(error.message);
  }
  return data || [];
}

// 4. Create or update document metadata
export async function createOrUpdateDocument(payload: PackageDocumentPayload) {
  // Check if a document already exists for this package and type
  const { data: existing, error: checkError } = await supabaseAdmin
    .from("package_documents")
    .select("id, version, is_active")
    .eq("package_id", payload.package_id)
    .eq("document_type", payload.document_type)
    .maybeSingle();

  if (checkError) {
    console.error("Error checking existing document:", checkError.message);
    throw new Error(checkError.message);
  }

  if (existing) {
    // If it exists, update it and increment the version (if file url changed)
    const newVersion = payload.version ?? (existing.version + 1);
    const { data, error } = await supabaseAdmin
      .from("package_documents")
      .update({
        title: payload.title,
        file_url: payload.file_url,
        page_count: payload.page_count ?? 0,
        size: payload.size ?? 0,
        thumbnail_url: payload.thumbnail_url || null,
        version: newVersion,
        is_active: true, // reactivate if archived
        allow_download: payload.allow_download ?? true,
        allow_print: payload.allow_print ?? true,
        allow_copy: payload.allow_copy ?? true,
        watermark_enabled: payload.watermark_enabled ?? true,
        uploaded_by: payload.uploaded_by,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  } else {
    // If new, insert record
    const { data, error } = await supabaseAdmin
      .from("package_documents")
      .insert({
        package_id: payload.package_id,
        document_type: payload.document_type,
        title: payload.title,
        file_url: payload.file_url,
        page_count: payload.page_count ?? 0,
        size: payload.size ?? 0,
        thumbnail_url: payload.thumbnail_url || null,
        version: 1,
        is_active: true,
        allow_download: payload.allow_download ?? true,
        allow_print: payload.allow_print ?? true,
        allow_copy: payload.allow_copy ?? true,
        watermark_enabled: payload.watermark_enabled ?? true,
        uploaded_by: payload.uploaded_by
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }
}

// 5. Archive a document (soft delete)
export async function archiveDocument(id: string) {
  const { data, error } = await supabaseAdmin
    .from("package_documents")
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error archiving document:", error.message);
    throw new Error(error.message);
  }
  return data;
}

// 6. Restore an archived document
export async function restoreDocument(id: string) {
  const { data, error } = await supabaseAdmin
    .from("package_documents")
    .update({
      is_active: true,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("Error restoring document:", error.message);
    throw new Error(error.message);
  }
  return data;
}

// 7. Get 60-second Signed URL for PDF files
export async function getItineraryPdfSignedUrl(fileUrl: string) {
  if (!fileUrl) {
    throw new Error("Document URL is required");
  }

  let storagePath = fileUrl;
  if (fileUrl.includes("/storage/v1/object/public/itineraries/")) {
    const urlParts = fileUrl.split("/storage/v1/object/public/itineraries/");
    storagePath = decodeURIComponent(urlParts[1]);
  } else if (fileUrl.includes("/storage/v1/object/sign/itineraries/")) {
    const urlParts = fileUrl.split("/storage/v1/object/sign/itineraries/");
    storagePath = decodeURIComponent(urlParts[1].split("?")[0]);
  } else if (fileUrl.startsWith("http")) {
    // Attempt extracting path after /itineraries/
    const match = fileUrl.match(/\/itineraries\/(.+)$/);
    if (match) storagePath = decodeURIComponent(match[1]);
  }

  storagePath = storagePath.replace(/^itineraries\//, "");

  // Create signed URL valid for 60 seconds
  const { data, error } = await supabaseAdmin.storage
    .from("itineraries")
    .createSignedUrl(storagePath, 60);

  if (error) {
    console.warn("Signed URL creation fallback:", error.message);
    if (fileUrl.startsWith("http")) return fileUrl;
    throw new Error(error.message);
  }

  return data.signedUrl;
}

// 8. Capture lead before email login
export async function captureItineraryLead(lead: {
  email: string;
  phone?: string;
  package_id: string;
  city?: string;
  source?: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("itinerary_leads")
    .insert({
      email: lead.email,
      phone: lead.phone || null,
      package_id: lead.package_id,
      city: lead.city || null,
      source: lead.source || "Premium PDF"
    })
    .select("*")
    .single();

  // On conflict DO NOTHING (just ignore if they already captured for this package)
  if (error && error.code !== "23505") {
    console.error("Error inserting lead:", error.message);
    throw new Error(error.message);
  }

  return data || { success: true };
}

// 9. Analytics Log: PDF View Start
export async function logPdfViewStart(params: {
  user_id: string | null;
  package_id: string;
  document_id: string;
  ip_address?: string;
  device?: string;
  browser?: string;
}) {
  // Check if they are returning users
  let isReturning = false;
  if (params.user_id) {
    const { count } = await supabaseAdmin
      .from("pdf_views")
      .select("*", { count: "exact", head: true })
      .eq("user_id", params.user_id)
      .eq("document_id", params.document_id);

    isReturning = (count || 0) > 0;
  }

  const { data, error } = await supabaseAdmin
    .from("pdf_views")
    .insert({
      user_id: params.user_id,
      package_id: params.package_id,
      document_id: params.document_id,
      is_returning: isReturning,
      is_bounce: true, // defaults to bounce until reading duration hits 15s
      ip_address: params.ip_address || null,
      device: params.device || null,
      browser: params.browser || null
    })
    .select("id, last_page_viewed")
    .single();

  if (error) {
    console.error("Error logging view start:", error.message);
    throw new Error(error.message);
  }

  // Get user's previous last page viewed if returning
  let resumePage = 1;
  if (params.user_id) {
    const { data: prevView } = await supabaseAdmin
      .from("pdf_views")
      .select("last_page_viewed")
      .eq("user_id", params.user_id)
      .eq("document_id", params.document_id)
      .neq("id", data.id) // exclude current
      .order("viewed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (prevView) {
      resumePage = prevView.last_page_viewed;
    }
  }

  return { viewId: data.id, resumePage };
}

// 10. Analytics Update: Heartbeat (every 10s of reading or page change)
export async function updatePdfViewHeartbeat(params: {
  viewId: string;
  last_page_viewed: number;
  max_page_reached: number;
  progress_percent: number;
  reading_time: number;
  completed?: boolean;
}) {
  const updates: Record<string, any> = {
    last_page_viewed: params.last_page_viewed,
    max_page_reached: params.max_page_reached,
    progress_percent: params.progress_percent,
    reading_time: params.reading_time
  };

  // If reading time >= 15 seconds, set bounce to false
  if (params.reading_time >= 15) {
    updates.is_bounce = false;
  }

  if (params.completed) {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("pdf_views")
    .update(updates)
    .eq("id", params.viewId)
    .select("*")
    .single();

  if (error) {
    console.error("Error updating view heartbeat:", error.message);
    throw new Error(error.message);
  }
  return data;
}

// 11. Analytics: Increment Download Count
export async function incrementDownloadCount(viewId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .rpc("increment_pdf_download_count", { view_id: viewId });

    if (error) {
      throw error;
    }
    return data;
  } catch (err) {
    // Fallback: regular update
    const { data: current } = await supabaseAdmin.from("pdf_views").select("download_count").eq("id", viewId).single();
    const count = (current?.download_count || 0) + 1;
    const { data: updated } = await supabaseAdmin.from("pdf_views").update({ download_count: count }).eq("id", viewId).select("*").single();
    return updated;
  }
}

// Helper: SQL increment function to run on Postgres
// Will be added via migration:
// CREATE OR REPLACE FUNCTION increment_pdf_download_count(view_id uuid) RETURNS void AS $$ BEGIN UPDATE public.pdf_views SET download_count = download_count + 1 WHERE id = view_id; END; $$ LANGUAGE plpgsql;

// 12. Aggregate Analytics for Admin Dashboard
export async function getAdminPdfAnalytics() {
  const { data: viewsData, error: viewsError } = await supabaseAdmin
    .from("pdf_views")
    .select(`
      *,
      package_documents (
        title,
        document_type
      ),
      journeys (
        name
      )
    `);

  if (viewsError) {
    console.error("Error fetching analytics views:", viewsError.message);
    throw new Error(viewsError.message);
  }

  const { count: totalLeads } = await supabaseAdmin
    .from("itinerary_leads")
    .select("*", { count: "exact", head: true });

  const views = viewsData || [];
  const totalViews = views.length;
  const uniqueUsers = new Set(views.map(v => v.user_id).filter(Boolean)).size;
  const totalDownloads = views.reduce((acc, v) => acc + (v.download_count || 0), 0);
  
  // Calculate average reading time and bounce rate
  const bounces = views.filter(v => v.is_bounce).length;
  const bounceRate = totalViews > 0 ? Math.round((bounces / totalViews) * 100) : 0;
  
  const totalReadingTime = views.reduce((acc, v) => acc + (v.reading_time || 0), 0);
  const avgReadingTime = totalViews > 0 ? Math.round(totalReadingTime / totalViews) : 0;

  // Group by document
  const docsMap: Record<string, any> = {};
  views.forEach(v => {
    const docId = v.document_id;
    if (!docsMap[docId]) {
      docsMap[docId] = {
        title: v.package_documents?.title || "Premium Document",
        type: v.package_documents?.document_type || "OTHER",
        packageName: v.journeys?.name || "Unknown Package",
        views: 0,
        downloads: 0,
        uniqueUsers: new Set(),
        totalReadingTime: 0,
        bounces: 0
      };
    }
    docsMap[docId].views += 1;
    docsMap[docId].downloads += v.download_count || 0;
    if (v.user_id) docsMap[docId].uniqueUsers.add(v.user_id);
    docsMap[docId].totalReadingTime += v.reading_time || 0;
    if (v.is_bounce) docsMap[docId].bounces += 1;
  });

  const documents = Object.keys(docsMap).map(id => {
    const item = docsMap[id];
    const viewsCount = item.views;
    return {
      id,
      title: item.title,
      type: item.type,
      packageName: item.packageName,
      views: viewsCount,
      downloads: item.downloads,
      uniqueUsersCount: item.uniqueUsers.size,
      avgReadingTime: viewsCount > 0 ? Math.round(item.totalReadingTime / viewsCount) : 0,
      bounceRate: viewsCount > 0 ? Math.round((item.bounces / viewsCount) * 100) : 0
    };
  });

  // Top documents by view count
  const topDocuments = [...documents].sort((a, b) => b.views - a.views).slice(0, 5);

  return {
    totalViews,
    uniqueUsers,
    totalDownloads,
    totalLeads: totalLeads || 0,
    bounceRate,
    avgReadingTime,
    topDocuments,
    allDocuments: documents
  };
}

// 13. Get lead capture list for admin
export async function getItineraryLeads() {
  const { data, error } = await supabaseAdmin
    .from("itinerary_leads")
    .select(`
      *,
      journeys (
        name,
        slug
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading leads:", error.message);
    throw new Error(error.message);
  }
  return data || [];
}

// 14. Upload a document file to Storage and create/update DB record
export async function uploadDocumentFile(params: {
  packageId: string;
  documentType: DocumentType;
  title: string;
  fileName: string;
  fileBase64: string;
  fileSize: number;
  allowDownload?: boolean;
  allowPrint?: boolean;
  allowCopy?: boolean;
  watermarkEnabled?: boolean;
  uploadedBy?: string;
}) {
  // First, query the package slug
  const { data: pkg, error: pkgError } = await supabaseAdmin
    .from("journeys")
    .select("slug")
    .eq("id", params.packageId)
    .single();

  if (pkgError || !pkg) {
    throw new Error("Package not found");
  }

  // Get current document version
  const { data: existing } = await supabaseAdmin
    .from("package_documents")
    .select("version")
    .eq("package_id", params.packageId)
    .eq("document_type", params.documentType)
    .maybeSingle();

  const nextVersion = existing ? (existing.version + 1) : 1;

  // Decode base64 to Uint8Array
  const binaryStr = atob(params.fileBase64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  // Clean filename extension
  const ext = params.fileName.split('.').pop() || 'pdf';
  const storagePath = `${pkg.slug}/${params.documentType.toLowerCase()}/v${nextVersion}.${ext}`;

  // Upload to itineraries private bucket
  const { error: uploadError } = await supabaseAdmin.storage
    .from("itineraries")
    .upload(storagePath, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Retrieve public URL (reference key)
  const { data: urlData } = supabaseAdmin.storage
    .from("itineraries")
    .getPublicUrl(storagePath);

  const fileUrl = urlData.publicUrl;

  // Now create or update the document record in database
  return await createOrUpdateDocument({
    package_id: params.packageId,
    document_type: params.documentType,
    title: params.title,
    file_url: fileUrl,
    page_count: 0,
    size: params.fileSize,
    version: nextVersion,
    allow_download: params.allowDownload ?? true,
    allow_print: params.allowPrint ?? true,
    allow_copy: params.allowCopy ?? true,
    watermark_enabled: params.watermarkEnabled ?? true,
    uploaded_by: params.uploadedBy
  });
}
