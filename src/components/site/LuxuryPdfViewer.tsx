/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Maximize2,
  Minimize2,
  Share2,
  RotateCw,
  FileText,
  Compass,
  RefreshCw,
  MessageSquare,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  PanelLeft,
  PanelLeftClose,
  ShieldCheck,
  Search,
  Printer,
  X,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "./AuthContext";

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export interface LuxuryPdfViewerProps {
  signedUrl: string | null;
  isLoadingUrl: boolean;
  destinationName: string;
  slug: string;
  documentMeta?: any;
  onClose?: () => void;
  onBookClick?: () => void;
  onRetry?: () => void;
}

export function LuxuryPdfViewer({
  signedUrl,
  isLoadingUrl,
  destinationName,
  slug,
  documentMeta,
  onClose,
  onBookClick,
  onRetry,
}: LuxuryPdfViewerProps) {
  const { user } = useAuth();

  // PDF.js Engine State
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(20);
  const [loadingStepText, setLoadingStepText] = useState("Fetching secure document...");

  // Viewer Controls & Navigation
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [zoom, setZoom] = useState<number>(() => {
    const saved = localStorage.getItem("nomadik_pdf_zoom");
    return saved ? parseFloat(saved) : 1.0;
  });
  const [fitMode, setFitMode] = useState<"width" | "page" | "custom">("width");
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"info" | "thumbnails" | "search">("info");
  const [pageInputVal, setPageInputVal] = useState("1");

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ page: number; text: string }[]>([]);
  const [searching, setSearching] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderingRef = useRef(false);

  // Save zoom preference to localStorage
  useEffect(() => {
    localStorage.setItem("nomadik_pdf_zoom", zoom.toString());
  }, [zoom]);

  // Dynamic loading step message cycle
  useEffect(() => {
    if (loadingPdf || isLoadingUrl) {
      const steps = [
        "Fetching secure document...",
        "Resolving encrypted file...",
        "Preparing high-resolution roadmap...",
        "Rendering PDF pages..."
      ];
      let idx = 0;
      const interval = setInterval(() => {
        idx = (idx + 1) % steps.length;
        setLoadingStepText(steps[idx]);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [loadingPdf, isLoadingUrl]);

  // Load PDF.js engine from CDN
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfJsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";
        setPdfJsLoaded(true);
      }
    };
    script.onerror = () => {
      setPdfError("Failed to initialize PDF engine.");
    };
    document.body.appendChild(script);

    return () => {
      try {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      } catch {}
    };
  }, []);

  // Load PDF Document when signedUrl & pdfJsLoaded are ready
  useEffect(() => {
    if (!signedUrl || !pdfJsLoaded) return;

    setLoadingPdf(true);
    setPdfError(null);
    setLoadProgress(35);

    const loadingTask = window.pdfjsLib.getDocument({
      url: signedUrl,
      withCredentials: false,
    });

    loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
      if (progressData.total > 0) {
        const pct = Math.round((progressData.loaded / progressData.total) * 100);
        setLoadProgress(Math.max(35, Math.min(pct, 95)));
      }
    };

    loadingTask.promise
      .then((pdf: any) => {
        setPdfDoc(pdf);
        const pages = pdf.numPages || documentMeta?.page_count || 1;
        setNumPages(pages);
        setLoadProgress(100);
        setLoadingPdf(false);
      })
      .catch((err: any) => {
        console.error("PDF.js document load error:", err);
        setLoadingPdf(false);
        setPdfError(
          err?.message?.includes("404") || err?.message?.includes("not_found")
            ? "404"
            : err?.message || "Failed to render document."
        );
      });
  }, [signedUrl, pdfJsLoaded, documentMeta]);

  // High-DPI Canvas Rendering Engine
  const renderPage = useCallback(
    (pageNo: number, currentZoom: number, currentRotation: number) => {
      if (!pdfDoc || !canvasRef.current || renderingRef.current) return;

      renderingRef.current = true;
      pdfDoc
        .getPage(pageNo)
        .then((page: any) => {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const dpr = window.devicePixelRatio || 1;
          let viewport = page.getViewport({ scale: currentZoom * dpr, rotation: currentRotation });

          if (fitMode === "width" && containerRef.current) {
            const containerWidth = containerRef.current.clientWidth - 64;
            if (containerWidth > 300) {
              const baseViewport = page.getViewport({ scale: 1.0, rotation: currentRotation });
              const desiredScale = (containerWidth / baseViewport.width) * currentZoom * dpr;
              viewport = page.getViewport({ scale: desiredScale, rotation: currentRotation });
            }
          } else if (fitMode === "page" && containerRef.current) {
            const containerHeight = containerRef.current.clientHeight - 96;
            const containerWidth = containerRef.current.clientWidth - 64;
            if (containerHeight > 300 && containerWidth > 300) {
              const baseViewport = page.getViewport({ scale: 1.0, rotation: currentRotation });
              const scaleH = containerHeight / baseViewport.height;
              const scaleW = containerWidth / baseViewport.width;
              const desiredScale = Math.min(scaleH, scaleW) * currentZoom * dpr;
              viewport = page.getViewport({ scale: desiredScale, rotation: currentRotation });
            }
          }

          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.style.width = `${viewport.width / dpr}px`;
          canvas.style.height = `${viewport.height / dpr}px`;

          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
          };

          const renderTask = page.render(renderContext);
          renderTask.promise.then(() => {
            renderingRef.current = false;

            // STEP 8: WATERMARK OVERLAY
            if (documentMeta?.watermark_enabled !== false) {
              ctx.save();
              ctx.font = `600 ${Math.max(14, Math.round(16 * dpr))}px Inter, sans-serif`;
              ctx.fillStyle = "rgba(245, 158, 11, 0.08)";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate(-Math.PI / 5);

              const userName =
                (user as any)?.user_metadata?.full_name ||
                (user as any)?.full_name ||
                user?.email?.split("@")[0] ||
                "Nomadik Explorer";
              const dateStr = new Date().toLocaleDateString();
              const watermarkText = `OFFICIAL NOMADIK ITINERARY · ${userName.toUpperCase()} · ${destinationName.toUpperCase()} · ${dateStr}`;

              const step = 160 * dpr;
              for (let y = -canvas.height; y < canvas.height; y += step) {
                ctx.fillText(watermarkText, 0, y);
              }

              ctx.restore();
            }
          });
        })
        .catch((err: any) => {
          console.error("Canvas render page error:", err);
          renderingRef.current = false;
        });
    },
    [pdfDoc, fitMode, destinationName, documentMeta, user]
  );

  // Trigger page render on state changes
  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNum, zoom, rotation);
      setPageInputVal(pageNum.toString());
    }
  }, [pdfDoc, pageNum, zoom, rotation, fitMode, renderPage]);

  // Execute Text Search inside PDF
  const executeSearch = async () => {
    if (!pdfDoc || !searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);

    const results: { page: number; text: string }[] = [];
    const queryLower = searchQuery.toLowerCase();

    for (let p = 1; p <= numPages; p++) {
      try {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        if (pageText.toLowerCase().includes(queryLower)) {
          results.push({ page: p, text: pageText.substring(0, 100) });
        }
      } catch {}
    }

    setSearchResults(results);
    setSearching(false);
    if (results.length > 0) {
      toast.success(`Found ${results.length} match(es) in itinerary`);
    } else {
      toast.info("No matching text found");
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        setPageNum((prev) => Math.min(prev + 1, numPages));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setPageNum((prev) => Math.max(prev - 1, 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setPageNum(1);
      } else if (e.key === "End") {
        e.preventDefault();
        setPageNum(numPages);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((prev) => Math.min(prev + 0.15, 2.5));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom((prev) => Math.max(prev - 0.15, 0.5));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1.0);
        setFitMode("width");
      } else if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [numPages, onClose]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Download Action
  const handleDownload = () => {
    if (!signedUrl) return;
    const a = document.createElement("a");
    a.href = signedUrl;
    a.download = `${slug}-itinerary-nomadik.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Downloading official itinerary PDF...");
  };

  // Print Action
  const handlePrint = () => {
    if (!signedUrl) return;
    const printWindow = window.open(signedUrl, "_blank");
    printWindow?.print();
  };

  // Share Action
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: documentMeta?.title || `${destinationName} Itinerary`,
          text: `Official Nomadik travel guide for ${destinationName}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const titleText =
    documentMeta?.title || `${destinationName} Official Travel Roadmap`;

  const isMissing = documentMeta?.is_missing || pdfError !== null;
  const coverImage =
    documentMeta?.cover_image ||
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80";

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-screen bg-[#020617] text-white flex flex-col font-sans overflow-hidden select-none relative"
    >
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── STEP 3: STICKY TOP NAVIGATION BAR ── */}
      <header className="h-16 bg-[#0F172A]/90 backdrop-blur-xl border-b border-[#334155]/60 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-lg">
        {/* Left: Back / Sidebar Toggle & Title */}
        <div className="flex items-center gap-3">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
              title="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg hidden md:flex"
            title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4 text-[#F59E0B]" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-poppins font-bold uppercase tracking-widest bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 px-2 py-0.5 rounded-full shadow-inner">
                OFFICIAL GUIDE
              </span>
              <span className="text-xs text-slate-400 font-poppins font-medium hidden sm:inline">
                {destinationName}
              </span>
            </div>
            <h1 className="font-display font-bold text-sm sm:text-base text-white tracking-wide truncate max-w-[180px] sm:max-w-md">
              {titleText}
            </h1>
          </div>
        </div>

        {/* Center: Quick Page Counter (Desktop) */}
        {!isMissing && !loadingPdf && numPages > 0 && (
          <div className="hidden lg:flex items-center gap-2 bg-[#020617]/70 border border-[#334155]/80 px-3 py-1 rounded-full text-xs font-mono text-slate-300">
            <span>Page</span>
            <input
              type="text"
              value={pageInputVal}
              onChange={(e) => setPageInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = parseInt(pageInputVal, 10);
                  if (!isNaN(val) && val >= 1 && val <= numPages) {
                    setPageNum(val);
                  } else {
                    setPageInputVal(pageNum.toString());
                  }
                }
              }}
              className="w-8 text-center bg-slate-800 text-white rounded border border-slate-700 font-bold focus:outline-none focus:border-[#F59E0B]"
            />
            <span className="text-slate-500">of</span>
            <span className="font-bold text-white">{numPages}</span>
          </div>
        )}

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Controls */}
          {!isMissing && (
            <div className="hidden sm:flex items-center gap-1 bg-[#020617]/70 border border-[#334155]/80 rounded-xl p-1 text-xs">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFitMode("custom");
                  setZoom((prev) => Math.max(prev - 0.15, 0.5));
                }}
                className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="w-12 text-center font-mono text-[11px] font-bold text-[#F59E0B]">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setFitMode("custom");
                  setZoom((prev) => Math.min(prev + 0.15, 2.5));
                }}
                className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>

              <div className="w-px h-4 bg-slate-800 mx-1" />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFitMode("width");
                  setZoom(1.0);
                }}
                className={`h-7 px-2 text-[10px] font-semibold rounded-md ${
                  fitMode === "width"
                    ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Fit Width
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFitMode("page");
                  setZoom(1.0);
                }}
                className={`h-7 px-2 text-[10px] font-semibold rounded-md ${
                  fitMode === "page"
                    ? "bg-[#F59E0B]/20 text-[#F59E0B]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Fit Page
              </Button>
            </div>
          )}

          {/* Rotate Button */}
          {!isMissing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg hidden lg:flex"
              title="Rotate Page"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          )}

          {/* Print Button */}
          {!isMissing && documentMeta?.allow_print !== false && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrint}
              className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg hidden sm:flex"
              title="Print Document"
            >
              <Printer className="h-4 w-4" />
            </Button>
          )}

          {/* Fullscreen Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg hidden sm:flex"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Share Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="h-8 w-8 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
            title="Share Itinerary"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {/* Download PDF Button */}
          {signedUrl && documentMeta?.allow_download !== false && (
            <Button
              onClick={handleDownload}
              size="sm"
              className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-slate-950 font-poppins font-bold gap-1.5 shadow-md rounded-xl h-9 text-xs px-3"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </Button>
          )}
        </div>
      </header>

      {/* ── STEP 3: MAIN VIEWPORT WITH LEFT SIDEBAR & CENTER CANVAS ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="h-full bg-[#0F172A]/90 backdrop-blur-xl border-r border-[#334155]/60 flex flex-col shrink-0 overflow-hidden hidden md:flex z-20"
            >
              {/* Sidebar Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-950/50 p-1 text-xs">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`flex-1 py-2 font-poppins font-semibold text-center rounded-lg transition-colors ${
                    activeTab === "info"
                      ? "bg-slate-800 text-[#F59E0B]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("thumbnails")}
                  className={`flex-1 py-2 font-poppins font-semibold text-center rounded-lg transition-colors ${
                    activeTab === "thumbnails"
                      ? "bg-slate-800 text-[#F59E0B]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Pages ({numPages})
                </button>
                <button
                  onClick={() => setActiveTab("search")}
                  className={`flex-1 py-2 font-poppins font-semibold text-center rounded-lg transition-colors ${
                    activeTab === "search"
                      ? "bg-slate-800 text-[#F59E0B]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Search
                </button>
              </div>

              {/* Tab 1: Overview & Document Info */}
              {activeTab === "info" && (
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Journey Cover Card */}
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-700 shadow-md">
                    <img
                      src={coverImage}
                      alt={destinationName}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 text-xs font-display font-bold text-white">
                      {destinationName}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display font-bold text-base text-white leading-snug">
                      {titleText}
                    </h3>
                    <p className="text-xs text-slate-400 font-poppins">
                      Curated by Nomadik Travel Team
                    </p>
                  </div>

                  {/* Metadata Specs */}
                  <div className="space-y-3 text-xs font-poppins text-slate-300 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-[#F59E0B]" /> Destination
                      </span>
                      <span className="font-semibold text-white truncate max-w-[140px]">
                        {destinationName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-blue-400" /> Total Pages
                      </span>
                      <span className="font-mono font-bold text-white">{numPages} Pages</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-emerald-400" /> Version
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        v{documentMeta?.version || 1}.0
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2 font-semibold text-emerald-400">
                      <ShieldCheck className="h-4 w-4 shrink-0" /> Verified Travel Guide
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Includes day-wise roadmap, hotel stays, pickup points, and emergency contacts.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Page Thumbnails Grid */}
              {activeTab === "thumbnails" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: numPages }).map((_, idx) => {
                      const p = idx + 1;
                      const isActive = p === pageNum;
                      return (
                        <button
                          key={p}
                          onClick={() => setPageNum(p)}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                            isActive
                              ? "bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] shadow-md"
                              : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}
                        >
                          <div className="w-full aspect-[1/1.4] bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800">
                            <span className="font-mono font-bold text-sm">{p}</span>
                          </div>
                          <span className="text-[10px] font-mono font-semibold">Page {p}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 3: Page Text Search */}
              {activeTab === "search" && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search text in PDF..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && executeSearch()}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#F59E0B]"
                    />
                    <Button
                      onClick={executeSearch}
                      disabled={searching}
                      className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 rounded-xl px-3"
                    >
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {searchResults.map((res, i) => (
                      <button
                        key={i}
                        onClick={() => setPageNum(res.page)}
                        className="w-full text-left p-3 bg-slate-900/70 hover:bg-slate-800 border border-slate-800 rounded-xl space-y-1 transition-colors"
                      >
                        <span className="text-[10px] font-mono font-bold text-[#F59E0B]">
                          Page {res.page}
                        </span>
                        <p className="text-xs text-slate-300 font-poppins line-clamp-2">
                          "{res.text}..."
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sidebar Footer CTA */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0">
                {onBookClick && (
                  <Button
                    onClick={onBookClick}
                    className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-poppins font-bold shadow-md rounded-xl text-xs py-2.5"
                  >
                    Book This Trip
                  </Button>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* CENTER VIEWPORT CANVAS CONTAINER */}
        <main
          ref={containerRef}
          className="flex-1 h-full overflow-auto bg-[#020617] flex flex-col items-center justify-start p-4 sm:p-8 relative scrollbar-thin scrollbar-thumb-slate-800"
        >
          {/* STEP 4: BEAUTIFUL SKELETON SHIMMER LOADING STATE */}
          {(isLoadingUrl || loadingPdf) && !isMissing && (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl py-12 space-y-6">
              <div className="relative w-full aspect-[1/1.3] bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-8 flex flex-col justify-between">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

                <div className="space-y-4 relative z-10">
                  <div className="h-6 w-1/3 bg-slate-800 rounded-lg animate-pulse" />
                  <div className="h-4 w-2/3 bg-slate-800/80 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-slate-800/60 rounded animate-pulse" />
                </div>

                <div className="flex flex-col items-center justify-center space-y-4 my-auto relative z-10">
                  <div className="relative flex items-center justify-center">
                    <Compass className="h-12 w-12 text-[#F59E0B] animate-spin" style={{ animationDuration: "6s" }} />
                    <Sparkles className="h-6 w-6 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-display font-bold text-lg text-white">
                      Loading Official Itinerary...
                    </p>
                    <p className="text-xs text-amber-400 font-mono font-semibold">
                      {loadingStepText}
                    </p>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#F59E0B] to-amber-300 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${loadProgress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">
                    {loadProgress}%
                  </span>
                </div>

                <div className="space-y-2 relative z-10">
                  <div className="h-3 w-full bg-slate-800/50 rounded" />
                  <div className="h-3 w-4/5 bg-slate-800/50 rounded" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: LUXURY ERROR CARD (NEVER RAW JSON / NOSUCHKEY) */}
          {isMissing && !loadingPdf && !isLoadingUrl && (
            <div className="flex flex-col items-center justify-center h-full w-full max-w-lg my-auto p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-gradient-to-b from-[#0F172A] to-[#1E293B] border border-[#334155] rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F59E0B]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="w-16 h-16 bg-[#F59E0B]/15 border border-[#F59E0B]/30 rounded-2xl flex items-center justify-center mx-auto text-[#F59E0B] shadow-inner">
                  <FileText className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-poppins font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    PREMIUM TRAVEL GUIDE
                  </span>
                  <h3 className="font-display font-bold text-xl sm:text-2xl text-white">
                    Itinerary isn't ready yet
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-poppins leading-relaxed max-w-sm mx-auto">
                    We're preparing your premium travel guide for <strong className="text-white">{destinationName}</strong>. Please reach out to our trip captain for instant assistance.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {onRetry && (
                    <Button
                      onClick={onRetry}
                      variant="outline"
                      className="w-full sm:w-auto border-slate-700 text-white hover:bg-slate-800 gap-1.5 rounded-xl font-poppins text-xs"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </Button>
                  )}

                  <a
                    href={`https://wa.me/919999999999?text=Hi%2C%20I%20am%20looking%20for%20the%20itinerary%20for%20${encodeURIComponent(
                      destinationName
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 rounded-xl font-poppins text-xs font-bold">
                      <MessageSquare className="h-3.5 w-3.5" /> WhatsApp Assist
                    </Button>
                  </a>

                  {onBookClick && (
                    <Button
                      onClick={onBookClick}
                      className="w-full sm:w-auto bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-poppins font-bold gap-1.5 rounded-xl text-xs"
                    >
                      Book Trip
                    </Button>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* ACTIVE HIGH-DPI CANVAS PAGE */}
          {!loadingPdf && !isLoadingUrl && !isMissing && (
            <div className="flex flex-col items-center my-auto transition-transform duration-200 ease-out py-4">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative rounded-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-slate-800 bg-white"
              >
                <canvas
                  ref={canvasRef}
                  className="block max-w-full h-auto transition-all"
                />
              </motion.div>
            </div>
          )}
        </main>
      </div>

      {/* ── STEP 3: BOTTOM FLOATING TOOLBAR ── */}
      {!isMissing && !loadingPdf && numPages > 0 && (
        <div className="h-16 bg-[#0F172A]/95 backdrop-blur-xl border-t border-[#334155]/60 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 shadow-2xl">
          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNum((prev) => Math.max(prev - 1, 1))}
            disabled={pageNum <= 1}
            className="border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl gap-1 disabled:opacity-30 font-poppins text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          {/* Center Page Range Slider */}
          <div className="flex items-center gap-3 max-w-xs sm:max-w-md w-full mx-2 sm:mx-4">
            <span className="text-xs font-mono text-slate-400 font-bold shrink-0">
              {pageNum}
            </span>
            <input
              type="range"
              min={1}
              max={numPages}
              value={pageNum}
              onChange={(e) => setPageNum(parseInt(e.target.value, 10))}
              className="w-full accent-[#F59E0B] bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-400 font-bold shrink-0">
              {numPages}
            </span>
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageNum((prev) => Math.min(prev + 1, numPages))}
            disabled={pageNum >= numPages}
            className="border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl gap-1 disabled:opacity-30 font-poppins text-xs"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
