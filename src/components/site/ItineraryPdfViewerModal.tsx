/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Loader2,
  Lock,
  Search,
  MessageSquare,
  Sparkles,
  Compass,
  FileText,
  X,
} from "lucide-react";
import { getItineraryPdfSignedUrlFn } from "@/lib/itinerary-pdf-fns";
import { useNavigate } from "@tanstack/react-router";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

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
  documentMeta,
  onBookClick,
}: ItineraryPdfViewerModalProps) {
  const navigate = useNavigate();

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(13);
  const [zoom, setZoom] = useState(1.0);
  const [loadingPdf, setLoadingPdf] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderingRef = useRef(false);

  // 1. Fetch 60-Second Signed URL when modal opens
  useEffect(() => {
    if (open) {
      setLoadingUrl(true);
      const fileUrl =
        documentMeta?.file_url ||
        `https://sgeffapbsrppzrgqfpec.supabase.co/storage/v1/object/public/itineraries/${slug}/ITINERARY/v1.pdf`;

      getItineraryPdfSignedUrlFn({ data: fileUrl })
        .then((url) => {
          setSignedUrl(url);
        })
        .catch((err) => {
          console.warn("[ItineraryPdfViewerModal] Signed URL fallback:", err);
          // Fallback to fileUrl if signing error occurs
          setSignedUrl(fileUrl);
        })
        .finally(() => {
          setLoadingUrl(false);
        });
    } else {
      setSignedUrl(null);
      setPdfDoc(null);
      setPageNum(1);
    }
  }, [open, slug, documentMeta]);

  // 2. Load PDF.js Script dynamically
  useEffect(() => {
    if (open && signedUrl) {
      if (window.pdfjsLib) {
        setPdfJsLoaded(true);
        return;
      }

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
          setPdfJsLoaded(true);
        }
      };
      document.body.appendChild(script);

      return () => {
        try {
          document.body.removeChild(script);
        } catch {}
      };
    }
  }, [open, signedUrl]);

  // 3. Render PDF document
  useEffect(() => {
    if (open && pdfJsLoaded && signedUrl) {
      setLoadingPdf(true);
      const loadingTask = window.pdfjsLib.getDocument(signedUrl);
      loadingTask.promise
        .then((pdf: any) => {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages || documentMeta?.page_count || 13);
          setLoadingPdf(false);
        })
        .catch((err: any) => {
          console.error("Error loading PDF document:", err);
          setLoadingPdf(false);
        });
    }
  }, [open, pdfJsLoaded, signedUrl, documentMeta]);

  // 4. Render Current Canvas Page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || renderingRef.current) return;

    renderingRef.current = true;
    pdfDoc
      .getPage(pageNum)
      .then((page: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const viewport = page.getViewport({ scale: zoom * 1.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTask.promise.then(() => {
          renderingRef.current = false;
        });
      })
      .catch((err: any) => {
        console.error("Render page error:", err);
        renderingRef.current = false;
      });
  }, [pdfDoc, pageNum, zoom]);

  // Download Action
  const handleDownload = () => {
    if (!signedUrl) return;
    const a = document.createElement("a");
    a.href = signedUrl;
    a.download = `${slug}_itinerary.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Downloading itinerary PDF...");
  };

  // Navigation handlers
  const prevPage = () => setPageNum((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setPageNum((prev) => Math.min(prev + 1, numPages));

  // Progress percentage
  const progressPercent = Math.round((pageNum / Math.max(numPages, 1)) * 100);

  const titleText =
    documentMeta?.title || `${destinationName} Detailed Travel Roadmap`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[100vw] w-screen h-[100vh] max-h-screen bg-[#020617] text-white p-0 rounded-none border-none shadow-2xl flex flex-col justify-between overflow-hidden font-sans z-[100]"
      >
        <DialogTitle className="sr-only">{titleText}</DialogTitle>

        {/* ── 1. TOP NAVBAR ── */}
        <header className="h-16 bg-[#0F172A] border-b border-[#334155] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-md">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-full cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-poppins font-bold uppercase tracking-wider bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 px-2 py-0.5 rounded">
                  OFFICIAL GUIDE
                </span>
                <span className="text-xs text-slate-400 font-poppins font-medium hidden sm:inline">
                  {destinationName}
                </span>
              </div>
              <h2 className="font-display font-bold text-sm sm:text-base text-white tracking-wide truncate max-w-xs sm:max-w-md">
                {titleText}
              </h2>
            </div>
          </div>

          {/* Right: Controls & Download */}
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((prev) => Math.max(prev - 0.2, 0.6))}
                className="h-7 w-7 text-slate-300 hover:text-white"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="w-10 text-center font-mono text-[11px] text-white">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom((prev) => Math.min(prev + 0.2, 2.0))}
                className="h-7 w-7 text-slate-300 hover:text-white"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Download Button */}
            {documentMeta?.allow_download !== false && (
              <Button
                onClick={handleDownload}
                disabled={!signedUrl}
                className="h-9 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-white font-poppins font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Download PDF</span>
              </Button>
            )}

            {/* Close Cross */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* ── 2. READING PROGRESS BAR ── */}
        <div className="h-1 bg-slate-800 w-full shrink-0 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#F59E0B] to-amber-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* ── 3. MAIN CANVAS / VIEWER BODY ── */}
        <div className="flex-1 overflow-auto bg-[#020617] p-4 flex flex-col items-center justify-start relative select-none">
          {loadingUrl || loadingPdf ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center space-y-4">
              <Loader2 className="h-10 w-10 text-[#F59E0B] animate-spin" />
              <p className="text-xs font-poppins text-slate-300 tracking-wider uppercase">
                Generating Secure Signed Access & Rendering PDF...
              </p>
            </div>
          ) : pdfJsLoaded && pdfDoc ? (
            <div className="my-auto flex flex-col items-center justify-center max-w-full">
              <div className="shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-slate-800 rounded-lg overflow-hidden bg-white max-w-full">
                <canvas ref={canvasRef} className="max-w-full h-auto block" />
              </div>
            </div>
          ) : (
            /* Fallback Viewer Embed if PDF.js is unavailable */
            <div className="w-full h-full flex items-center justify-center p-2">
              <iframe
                src={`${signedUrl}#toolbar=0`}
                className="w-full h-full rounded-xl border border-slate-800"
                title="Itinerary Viewer"
              />
            </div>
          )}
        </div>

        {/* ── 4. BOTTOM NAVIGATION TOOLBAR ── */}
        <div className="bg-[#0F172A] border-t border-[#334155] px-4 py-2 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevPage}
              disabled={pageNum <= 1}
              className="h-9 px-3 border-slate-700 bg-slate-900 text-slate-200 hover:text-white rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            <span className="text-xs font-poppins text-slate-300 font-semibold px-2">
              Page {pageNum} of {numPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={pageNum >= numPages}
              className="h-9 px-3 border-slate-700 bg-slate-900 text-slate-200 hover:text-white rounded-xl text-xs flex items-center gap-1 cursor-pointer"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Page Jump Input */}
          <div className="hidden md:flex items-center gap-2 text-xs font-poppins text-slate-400">
            <span>Jump to page:</span>
            <Input
              type="number"
              min={1}
              max={numPages}
              value={pageNum}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= numPages) setPageNum(val);
              }}
              className="w-14 h-8 bg-slate-900 border-slate-700 text-white text-center text-xs rounded-lg"
            />
          </div>
        </div>

        {/* ── 5. STICKY BOTTOM ACTION CTA BAR ── */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0F172A] to-slate-950 border-t border-[#334155] p-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-30">
          <div className="text-center sm:text-left">
            <p className="text-xs font-poppins font-bold text-[#F59E0B] uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
              <Compass className="h-3.5 w-3.5 animate-spin-slow" /> Ready for this adventure?
            </p>
            <p className="text-[11px] text-slate-400 font-poppins">
              Book your seat now or ask our travel experts any question.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* WhatsApp CTA */}
            <Button
              variant="outline"
              onClick={() => {
                const text = encodeURIComponent(
                  `Hi Nomadik! I am reading the ${destinationName} itinerary guide and want to inquire about upcoming trips.`
                );
                window.open(`https://wa.me/919999999999?text=${text}`, "_blank");
              }}
              className="flex-1 sm:flex-initial h-10 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-poppins font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp Us</span>
            </Button>

            {/* Book This Trip CTA */}
            <Button
              onClick={() => {
                onOpenChange(false);
                if (onBookClick) {
                  onBookClick();
                } else {
                  navigate({ to: `/journeys/$journeySlug`, params: { journeySlug: slug } });
                }
              }}
              className="flex-1 sm:flex-initial h-10 px-6 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-poppins font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Book This Trip</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
