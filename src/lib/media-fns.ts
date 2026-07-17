import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { z } from "zod";

// ==========================================
// MEDIA ASSETS — SERVER FUNCTIONS
// All file uploads and mutations go through here.
// ==========================================

const BUCKET_NAME = "media";

// Upload a file to Supabase Storage and create a media_assets record
const uploadMediaSchema = z.object({
  fileName: z.string(),
  fileBase64: z.string(), // Base64 encoded file content
  mimeType: z.string(),
  fileSize: z.number(),
  folder: z.string().default("/"),
  altText: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const uploadMediaFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof uploadMediaSchema>) =>
    uploadMediaSchema.parse(data)
  )
  .handler(async ({ data }) => {
    // Decode base64 to Uint8Array
    const binaryStr = atob(data.fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Generate unique path
    const timestamp = Date.now();
    const sanitizedName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${data.folder === "/" ? "" : data.folder + "/"}${timestamp}_${sanitizedName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, bytes, {
        contentType: data.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Create media_assets record
    const { data: asset, error: dbError } = await supabaseAdmin
      .from("media_assets")
      .insert({
        filename: data.fileName,
        size: data.fileSize,
        mime_type: data.mimeType,
        url: publicUrl,
        folder: data.folder,
        alt_text: data.altText || null,
        width: data.width || null,
        height: data.height || null,
      })
      .select("*")
      .single();

    if (dbError) {
      throw new Error(`Failed to save asset record: ${dbError.message}`);
    }

    return asset;
  });

// List all media assets with optional folder filter
const listMediaSchema = z.object({
  folder: z.string().optional(),
  search: z.string().optional(),
  limit: z.number().default(50),
});

export const listMediaFn = createServerFn({ method: "GET" })
  .validator((data: z.infer<typeof listMediaSchema>) =>
    listMediaSchema.parse(data)
  )
  .handler(async ({ data }) => {
    let query = supabaseAdmin
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (data.folder && data.folder !== "ALL") {
      query = query.eq("folder", data.folder);
    }

    if (data.search) {
      query = query.or(`filename.ilike.%${data.search}%,alt_text.ilike.%${data.search}%`);
    }

    const { data: assets, error } = await query;
    if (error) {
      throw new Error(`Failed to load media: ${error.message}`);
    }

    return assets || [];
  });

// Delete a media asset (storage + DB record)
const deleteMediaSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
});

export const deleteMediaFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof deleteMediaSchema>) =>
    deleteMediaSchema.parse(data)
  )
  .handler(async ({ data }) => {
    // Extract storage path from URL
    const urlParts = data.url.split(`/storage/v1/object/public/${BUCKET_NAME}/`);
    if (urlParts.length > 1) {
      const storagePath = decodeURIComponent(urlParts[1]);
      await supabaseAdmin.storage.from(BUCKET_NAME).remove([storagePath]);
    }

    // Delete DB record
    const { error } = await supabaseAdmin
      .from("media_assets")
      .delete()
      .eq("id", data.id);

    if (error) {
      throw new Error(`Failed to delete asset: ${error.message}`);
    }

    return { success: true };
  });

// Update media asset metadata (alt text, folder)
const updateMediaSchema = z.object({
  id: z.string().uuid(),
  altText: z.string().optional(),
  folder: z.string().optional(),
});

export const updateMediaFn = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof updateMediaSchema>) =>
    updateMediaSchema.parse(data)
  )
  .handler(async ({ data }) => {
    const updates: Record<string, any> = {};
    if (data.altText !== undefined) updates.alt_text = data.altText;
    if (data.folder !== undefined) updates.folder = data.folder;

    const { data: updated, error } = await supabaseAdmin
      .from("media_assets")
      .update(updates)
      .eq("id", data.id)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update asset: ${error.message}`);
    }

    return updated;
  });

// Get distinct folders for the folder filter
export const getMediaFoldersFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("media_assets")
      .select("folder")
      .order("folder");

    if (error) {
      throw new Error(`Failed to load folders: ${error.message}`);
    }

    const folders = [...new Set((data || []).map((d: any) => d.folder).filter(Boolean))];
    return folders as string[];
  });
