import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/site/AuthContext';
import { getPackageDocumentBySlugFn, getItineraryPdfSignedUrlFn, logPdfViewStartFn, updatePdfViewHeartbeatFn, incrementDownloadCountFn } from '@/lib/itinerary-pdf-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  ArrowLeft, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, RotateCw, 
  Search, Sun, Moon, Bookmark, List, Download, Printer, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';

export const Route = createFileRoute('/account_/itinerary/$slug')({
  validateSearch: (search: Record<string, unknown>): { type?: string } => ({
    type: search.type as string | undefined,
  }),
  component: ItineraryViewerPage,
});

declare global {
  interface Window {
    pdfjsLib: any;
  }
}

function ItineraryViewerPage() {
  const { slug } = Route.useParams();
  const { type = 'ITINERARY' } = Route.useSearch();
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  
  // Viewer controls
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [fitMode, setFitMode] = useState<'width' | 'page' | 'none'>('width');
  const [darkMode, setDarkMode] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [outline, setOutline] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIdx, setCurrentSearchIdx] = useState(-1);
  
  // Dialogs
  const [resumeOpen, setResumeOpen] = useState(false);
  const [resumePageNum, setResumePageNum] = useState(1);

  // Analytics states
  const [viewSessionId, setViewSessionId] = useState<string | null>(null);
  const [readingTime, setReadingTime] = useState(0);
  const [maxPageReached, setMaxPageReached] = useState(1);
  const [loadingPdf, setLoadingPdf] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderingRef = useRef(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Store redirect target
      sessionStorage.setItem("auth_redirect_target", `/account/itinerary/${slug}?type=${type}`);
      navigate({ to: "/login" });
    }
  }, [authLoading, isAuthenticated, slug, type, navigate]);

  // Fetch document metadata
  const { data: documentMeta, isLoading: loadingMeta, error: metaError } = useQuery({
    queryKey: ['package_document_view', slug, type],
    queryFn: () => getPackageDocumentBySlugFn({ data: { slug, type: type as any } }),
    enabled: !!slug && isAuthenticated
  });

  // Get Signed URL once metadata is available
  useEffect(() => {
    if (documentMeta?.file_url) {
      getItineraryPdfSignedUrlFn({ data: documentMeta.file_url })
        .then(setSignedUrl)
        .catch((err) => {
          console.error("Error signing URL:", err);
          toast.error("Failed to generate secure access token.");
        });
    }
  }, [documentMeta]);

  // Dynamically load PDF.js scripts from CDN
  useEffect(() => {
    if (signedUrl) {
      if (window.pdfjsLib) {
        setPdfJsLoaded(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.async = true;
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        setPdfJsLoaded(true);
      };
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [signedUrl]);

  // Load PDF document
  useEffect(() => {
    if (pdfJsLoaded && signedUrl) {
      setLoadingPdf(true);
      const loadingTask = window.pdfjsLib.getDocument(signedUrl);
      loadingTask.promise.then((pdf: any) => {
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoadingPdf(false);

        // Load Outline/Bookmarks
        pdf.getOutline().then((out: any) => {
          setOutline(out || []);
        });

        // Log view session start in Database
        logPdfViewStartFn({
          data: {
            user_id: user?.id || null,
            package_id: documentMeta.package_id,
            document_id: documentMeta.id,
            ip_address: undefined, // client IP collected on server
            device: navigator.userAgent.includes('Mobi') ? 'Mobile' : 'Desktop',
            browser: navigator.userAgent.split(' ').pop() || 'Browser'
          }
        }).then((res) => {
          setViewSessionId(res.viewId);
          if (res.resumePage > 1 && res.resumePage <= pdf.numPages) {
            setResumePageNum(res.resumePage);
            setResumeOpen(true);
          }
        }).catch(console.error);

      }).catch((err: any) => {
        console.error("Error loading PDF:", err);
        setLoadingPdf(false);
        toast.error("Failed to load PDF file securely.");
      });
    }
  }, [pdfJsLoaded, signedUrl]);

  // Analytics heartbeats timer
  useEffect(() => {
    if (!viewSessionId || numPages === 0) return;

    const timer = setInterval(() => {
      setReadingTime((prev) => {
        const nextTime = prev + 10;
        const progress = Math.round((maxPageReached / numPages) * 100);
        
        updatePdfViewHeartbeatFn({
          data: {
            viewId: viewSessionId,
            last_page_viewed: pageNum,
            max_page_reached: maxPageReached,
            progress_percent: progress,
            reading_time: nextTime,
            completed: progress === 100
          }
        }).catch(console.error);

        return nextTime;
      });
    }, 10000); // Heartbeat every 10 seconds

    return () => clearInterval(timer);
  }, [viewSessionId, pageNum, maxPageReached, numPages]);

  // Render PDF page to canvas
  const renderPage = (pageNo: number, pageZoom: number, rotateAngle: number) => {
    if (!pdfDoc || !canvasRef.current || renderingRef.current) return;

    renderingRef.current = true;
    pdfDoc.getPage(pageNo).then((page: any) => {
      const canvas = canvasRef.current!;
      const context = canvas.getContext('2d')!;

      // Handle Fit Width / Fit Page modes
      let viewport = page.getViewport({ scale: pageZoom, rotation: rotateAngle });
      
      if (fitMode === 'width' && containerRef.current) {
        const widthScale = (containerRef.current.clientWidth - 40) / viewport.width;
        viewport = page.getViewport({ scale: widthScale * pageZoom, rotation: rotateAngle });
      } else if (fitMode === 'page' && containerRef.current) {
        const heightScale = (containerRef.current.clientHeight - 80) / viewport.height;
        const widthScale = (containerRef.current.clientWidth - 40) / viewport.width;
        const finalScale = Math.min(widthScale, heightScale);
        viewport = page.getViewport({ scale: finalScale * pageZoom, rotation: rotateAngle });
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext).promise.then(() => {
        renderingRef.current = false;

        // Apply Watermark overlay (Username, Email, Date, Nomadik branding)
        if (documentMeta?.watermark_enabled && user) {
          context.save();
          context.font = 'bold 15px Poppins, sans-serif';
          context.fillStyle = 'rgba(15, 23, 42, 0.08)'; // Subtle grey overlay
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          
          context.translate(canvas.width / 2, canvas.height / 2);
          context.rotate(-Math.PI / 4); // 45 degree angle
          
          const fullName = (user as any)?.user_metadata?.full_name || (user as any)?.full_name || 'Nomadik User';
          const watermarkText = `${fullName} (${user?.email}) · ${new Date().toLocaleDateString()} · Nomadik Travel`;
          
          // Render multiple watermarks across the page
          context.fillText(watermarkText, 0, -250);
          context.fillText(watermarkText, 0, -120);
          context.fillText(watermarkText, 0, 0);
          context.fillText(watermarkText, 0, 120);
          context.fillText(watermarkText, 0, 250);
          
          context.restore();
        }
      });
    }).catch((err: any) => {
      console.error("Error rendering page:", err);
      renderingRef.current = false;
    });
  };

  // Trigger page render upon dependency update
  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNum, zoom, rotation);
      if (pageNum > maxPageReached) {
        setMaxPageReached(pageNum);
      }
    }
  }, [pdfDoc, pageNum, zoom, rotation, fitMode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToPrevPage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNum, numPages]);

  // Page navigation helpers
  const goToNextPage = () => {
    if (pageNum < numPages) setPageNum((prev) => prev + 1);
  };

  const goToPrevPage = () => {
    if (pageNum > 1) setPageNum((prev) => prev - 1);
  };

  const handleDownload = async () => {
    if (!documentMeta?.allow_download) {
      toast.error("Download permission disabled for this document.");
      return;
    }
    if (signedUrl) {
      // Record download count
      if (viewSessionId) {
        await incrementDownloadCountFn({ data: viewSessionId });
      }
      window.open(signedUrl, "_blank");
    }
  };

  const handlePrint = () => {
    if (!documentMeta?.allow_print) {
      toast.error("Print permission disabled for this document.");
      return;
    }
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      const windowContent = '<!DOCTYPE html><html><head><title>Print Itinerary</title></head><body><img src="' + dataUrl + '" style="width: 100%;" /></body></html>';
      const printWindow = window.open('', '', 'width=800,height=600');
      printWindow?.document.write(windowContent);
      printWindow?.document.close();
      printWindow?.focus();
      printWindow?.print();
      printWindow?.close();
    }
  };

  // Outline jump
  const handleOutlineClick = (destPage: number) => {
    if (destPage > 0 && destPage <= numPages) {
      setPageNum(destPage);
      setShowOutline(false);
    }
  };

  // Search logic
  const handleSearch = () => {
    if (!searchTerm || !pdfDoc) return;
    
    const results: any[] = [];
    const promises: Promise<any>[] = [];
    
    for (let i = 1; i <= numPages; i++) {
      promises.push(
        pdfDoc.getPage(i).then((page: any) => {
          return page.getTextContent().then((content: any) => {
            const text = content.items.map((item: any) => item.str).join(' ');
            if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
              results.push({ page: i, textSnippet: text.slice(0, 100) });
            }
          });
        })
      );
    }

    Promise.all(promises).then(() => {
      setSearchResults(results);
      if (results.length > 0) {
        setCurrentSearchIdx(0);
        setPageNum(results[0].page);
        toast.success(`Found ${results.length} matches`);
      } else {
        toast.info("No matches found");
      }
    });
  };

  if (authLoading || loadingMeta || loadingPdf) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0F172A] text-white">
        <Loader2 className="h-10 w-10 text-accent animate-spin mb-4" />
        <p className="font-poppins text-xs tracking-wider animate-pulse uppercase">Securing private tunnel to document...</p>
      </div>
    );
  }

  if (metaError || !documentMeta) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#0F172A] text-white p-5 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-display font-bold">Access Restrained</h2>
        <p className="text-xs text-white/60 mt-1 max-w-sm">
          No premium itinerary document has been configured for this route yet, or you lack read credentials.
        </p>
        <Link to="/" className="mt-6 bg-accent text-white font-poppins text-xs font-semibold px-6 py-2.5 rounded-xl shadow-md">
          Go back Home
        </Link>
      </div>
    );
  }

  return (
    <div 
      className={`h-screen w-screen flex flex-col overflow-hidden bg-slate-900 text-slate-100 ${
        !documentMeta.allow_copy ? 'select-none' : ''
      }`}
      onContextMenu={(e) => {
        if (!documentMeta.allow_copy) {
          e.preventDefault();
          toast.warning("Right click has been disabled by Administrator.");
        }
      }}
    >
      {/* Top Action Bar */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between gap-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.close()} className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-sm font-bold truncate max-w-xs md:max-w-md">{documentMeta.title}</h1>
            <p className="text-[10px] text-slate-400 uppercase font-poppins tracking-wider font-semibold">Premium Document Access</p>
          </div>
        </div>

        {/* Toolbar Middle Controls */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 px-2 py-1 rounded-xl">
          <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={pageNum <= 1} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs px-2 font-mono">
            {pageNum} / {numPages}
          </span>
          <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={pageNum >= numPages} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="h-8 w-8">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] font-mono w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))} className="h-8 w-8">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFitMode(fitMode === 'width' ? 'page' : 'width')} 
            className="text-[10px] px-2 h-8 font-poppins font-semibold"
          >
            {fitMode === 'width' ? 'Fit Page' : 'Fit Width'}
          </Button>

          <Button variant="ghost" size="icon" onClick={() => setRotation((r) => (r + 90) % 360)} className="h-8 w-8" title="Rotate Page">
            <RotateCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Outline / Search Drawer buttons */}
          <Button variant="ghost" size="icon" onClick={() => setShowOutline(!showOutline)} className={`h-9 w-9 ${showOutline ? 'text-accent bg-slate-800' : 'text-slate-400'}`} title="Table of Contents">
            <List className="h-4.5 w-4.5" />
          </Button>

          {/* Dark Mode toggle */}
          <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} className="h-9 w-9 text-slate-400 hover:text-white" title="Dark Mode Preview">
            {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5" />}
          </Button>

          {/* Printer */}
          {documentMeta.allow_print && (
            <Button variant="ghost" size="icon" onClick={handlePrint} className="h-9 w-9 text-slate-400 hover:text-white" title="Print document">
              <Printer className="h-4.5 w-4.5" />
            </Button>
          )}

          {/* Download */}
          {documentMeta.allow_download && (
            <Button onClick={handleDownload} className="h-9 gap-1.5 bg-accent text-white hover:bg-[#D97706] text-xs font-poppins font-semibold rounded-xl px-4 shadow-md">
              <Download className="h-3.5 w-3.5" /> Download
            </Button>
          )}
        </div>
      </header>

      {/* Main Canvas Viewer Container */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side: Table of Contents / Search panel */}
        {showOutline && (
          <aside className="w-64 bg-slate-950 border-r border-slate-800 p-4 space-y-5 flex flex-col overflow-y-auto shrink-0 z-10">
            {/* Search within PDF */}
            <div className="space-y-2">
              <Label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Search Document</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="h-8 text-xs bg-slate-900 border-slate-800 text-white"
                />
                <Button size="sm" onClick={handleSearch} className="h-8 px-2 bg-slate-800 hover:bg-slate-700">
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Match: {currentSearchIdx + 1} / {searchResults.length}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        const nextIdx = (currentSearchIdx - 1 + searchResults.length) % searchResults.length;
                        setCurrentSearchIdx(nextIdx);
                        setPageNum(searchResults[nextIdx].page);
                      }}
                      className="px-1 hover:text-white"
                    >
                      ▲
                    </button>
                    <button 
                      onClick={() => {
                        const nextIdx = (currentSearchIdx + 1) % searchResults.length;
                        setCurrentSearchIdx(nextIdx);
                        setPageNum(searchResults[nextIdx].page);
                      }}
                      className="px-1 hover:text-white"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bookmarks list */}
            <div className="space-y-2 flex-1 flex flex-col min-h-0">
              <Label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Document Outline</Label>
              {outline.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No outline entries found.</p>
              ) : (
                <div className="space-y-1 overflow-y-auto flex-1">
                  {outline.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOutlineClick(item.destPage)}
                      className="w-full text-left text-[11px] py-1 px-2 rounded hover:bg-slate-800 text-slate-300 hover:text-white truncate"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Center: Canvas page layout */}
        <main 
          ref={containerRef} 
          className={`flex-grow flex items-center justify-center p-6 overflow-auto bg-slate-900/40 relative ${
            darkMode ? 'invert contrast-125 hue-rotate-180' : ''
          }`}
        >
          <div className="relative shadow-2xl border border-slate-800 bg-white rounded-md overflow-hidden">
            <canvas ref={canvasRef} className="block max-w-full" />
          </div>
        </main>
      </div>

      {/* Bottom pagination for mobile screen */}
      <footer className="lg:hidden h-12 bg-slate-950 border-t border-slate-800 px-4 flex items-center justify-between gap-4 z-20 shrink-0">
        <Button variant="ghost" size="icon" onClick={goToPrevPage} disabled={pageNum <= 1} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs px-2 font-mono">
          {pageNum} / {numPages}
        </span>
        <Button variant="ghost" size="icon" onClick={goToNextPage} disabled={pageNum >= numPages} className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </footer>

      {/* RESUME READING POPUP */}
      <Dialog open={resumeOpen} onOpenChange={setResumeOpen}>
        <DialogContent className="max-w-sm bg-slate-950 border border-slate-800 text-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Resume Reading?</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs mt-1">
              You previously left off on **Page {resumePageNum}** of this travel guide.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 pt-4 border-t border-slate-800 gap-2">
            <Button variant="ghost" onClick={() => setResumeOpen(false)} className="text-slate-400 hover:text-white">
              Start Over
            </Button>
            <Button 
              onClick={() => {
                setPageNum(resumePageNum);
                setResumeOpen(false);
              }}
              className="bg-accent text-white hover:bg-[#D97706]"
            >
              Resume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
