import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LightboxImageItem {
  src: string;
  alt?: string;
  title?: string;
  caption?: string;
  category?: string;
  day?: number;
}

export interface UniversalLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: (string | LightboxImageItem)[];
  initialIndex?: number;
  title?: string;
}

export function UniversalLightboxModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
  title,
}: UniversalLightboxModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  // Sync initial index when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(initialIndex < images.length ? initialIndex : 0);
    }
  }, [isOpen, initialIndex, images.length]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (images.length === 0) return;
    setSelectedIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length === 0) return;
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation: Left Arrow, Right Arrow, Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen || images.length === 0) return null;

  // Normalize image data
  const normalizedImages: LightboxImageItem[] = images.map((img) =>
    typeof img === "string" ? { src: img } : img
  );

  const currentImg = normalizedImages[selectedIndex] || normalizedImages[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* ── TOP BAR: Title, Counter, Close (X) ── */}
        <div className="flex items-center justify-between gap-4 z-20 w-full max-w-7xl mx-auto pt-2 px-2">
          <div className="flex items-center gap-3 text-white">
            <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold font-poppins text-[#C8A96A] tracking-wider">
              {selectedIndex + 1} / {normalizedImages.length}
            </span>
            {title && (
              <span className="font-display font-bold text-sm sm:text-base tracking-wide text-white truncate max-w-xs sm:max-w-md">
                {title}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all active:scale-95 shadow-lg group"
            aria-label="Close Lightbox"
          >
            <X className="h-5 w-5 text-white/80 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* ── CENTER AREA: Main Image + Nav Arrows ── */}
        <div className="relative flex-1 flex items-center justify-center my-2 sm:my-4 w-full max-w-6xl mx-auto overflow-hidden">
          {/* Previous Button */}
          {normalizedImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 sm:left-4 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-2xl group"
              aria-label="Previous Image"
            >
              <ChevronLeft className="h-6 w-6 text-white/80 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Centered Image with Drag Swipe & Zoom Fade */}
          <div
            className="relative flex items-center justify-center max-h-[75vh] w-full p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedIndex}
                src={currentImg.src}
                alt={currentImg.alt || currentImg.title || `Gallery photo ${selectedIndex + 1}`}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) handleNext();
                  if (info.offset.x > 60) handlePrev();
                }}
                className="max-h-[72vh] max-w-[92vw] sm:max-h-[76vh] sm:max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/10 cursor-grab active:cursor-grabbing pointer-events-auto"
                loading="lazy"
              />
            </AnimatePresence>
          </div>

          {/* Next Button */}
          {normalizedImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 sm:right-4 z-30 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90 shadow-2xl group"
              aria-label="Next Image"
            >
              <ChevronRight className="h-6 w-6 text-white/80 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* ── BOTTOM AREA: Image Caption + Thumbnail Strip ── */}
        <div className="flex flex-col items-center justify-center gap-2 z-20 w-full max-w-5xl mx-auto pb-1">
          {/* Optional Caption */}
          {(currentImg.caption || currentImg.title) && (
            <p className="text-xs sm:text-sm text-white/80 font-poppins text-center max-w-md px-4 truncate">
              {currentImg.caption || currentImg.title}
            </p>
          )}

          {/* Thumbnail Strip */}
          {normalizedImages.length > 1 && (
            <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full px-4 py-1 scrollbar-thin scrollbar-thumb-white/20">
              {normalizedImages.map((thumb, idx) => {
                const isActive = idx === selectedIndex;
                return (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIndex(idx);
                    }}
                    className={cn(
                      "h-12 w-16 sm:h-14 sm:w-20 rounded-xl overflow-hidden shrink-0 transition-all duration-200 bg-muted/20 relative",
                      isActive
                        ? "border-2 border-[#C8A96A] scale-105 opacity-100 ring-2 ring-[#C8A96A]/50 shadow-lg"
                        : "border border-white/20 opacity-40 hover:opacity-90 hover:scale-105"
                    )}
                  >
                    <img
                      src={thumb.src}
                      alt={`Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
