/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getPackageDocumentBySlugFn, getItineraryPdfSignedUrlFn } from "@/lib/itinerary-pdf-fns";
import { LuxuryPdfViewer } from "./LuxuryPdfViewer";

interface ItineraryPdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  destinationName: string;
  slug: string;
  documentMeta?: any;
  onBookClick?: () => void;
}

export function ItineraryPdfViewerModal({
  open,
  onOpenChange,
  destinationName,
  slug,
  documentMeta: initialMeta,
  onBookClick,
}: ItineraryPdfViewerModalProps) {
  const [docMeta, setDocMeta] = useState<any>(initialMeta || null);
  const [signedUrl, setSignedUrl] = useState<string | null>(
    initialMeta?.signed_url || initialMeta?.file_url || null
  );
  const [loadingUrl, setLoadingUrl] = useState(false);

  const loadDocument = async () => {
    if (!open) {
      setSignedUrl(null);
      setLoadingUrl(false);
      return;
    }

    setLoadingUrl(true);
    try {
      let meta = initialMeta;
      
      // Always fetch fresh metadata from server if initialMeta is missing or incomplete
      if (!meta || (!meta.signed_url && !meta.file_url && !meta.storage_path) || meta.is_missing) {
        meta = await getPackageDocumentBySlugFn({ data: { slug, type: "ITINERARY" } });
      }

      setDocMeta(meta);

      if (meta && !meta.is_missing) {
        if (meta.signed_url) {
          setSignedUrl(meta.signed_url);
        } else if (meta.file_url && meta.file_url.startsWith("http")) {
          setSignedUrl(meta.file_url);
        } else if (meta.storage_path || meta.file_url) {
          const url = await getItineraryPdfSignedUrlFn({
            data: meta.storage_path || meta.file_url,
          });
          setSignedUrl(url);
        }
      } else {
        setSignedUrl(null);
      }
    } catch (err) {
      console.warn("[ItineraryPdfViewerModal] Document resolution error:", err);
      setSignedUrl(null);
    } finally {
      setLoadingUrl(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [open, slug, initialMeta]);

  const titleText =
    docMeta?.title || `${destinationName} Official Travel Itinerary`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[100vw] w-screen h-[100vh] max-h-screen bg-[#020617] text-white p-0 rounded-none border-none shadow-2xl flex flex-col overflow-hidden z-[100]"
      >
        <DialogTitle className="sr-only">{titleText}</DialogTitle>

        <LuxuryPdfViewer
          signedUrl={signedUrl}
          isLoadingUrl={loadingUrl}
          destinationName={destinationName}
          slug={slug}
          documentMeta={docMeta}
          onClose={() => onOpenChange(false)}
          onBookClick={onBookClick}
          onRetry={loadDocument}
        />
      </DialogContent>
    </Dialog>
  );
}
