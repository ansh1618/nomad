import { useState } from "react";
import { Play, X, Sparkles, Image as ImageIcon } from "lucide-react";
import { SEED_REVIEWS } from "@/lib/reviews-client";

export function ReviewMediaGallery() {
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  // Extract all media items from seed reviews
  const allMedia = SEED_REVIEWS.flatMap((r) =>
    (r.media || []).map((m) => ({
      ...m,
      author: r.author_name,
      college: r.college,
      journey: r.journey_name,
    }))
  );

  return (
    <div className="space-y-6 font-poppins text-left">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8A96A] bg-[#C8A96A]/10 px-2.5 py-1 rounded-full">
            REAL TRAVELER MEMORIES
          </span>
          <h3 className="font-display font-bold text-2xl text-[#102A43] mt-1">
            Traveler Photo & Reel Gallery
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-semibold">
          {allMedia.length} Photos & Videos
        </span>
      </div>

      {/* Pinterest Masonry Grid */}
      <div className="columns-2 sm:columns-3 md:columns-4 gap-4 space-y-4">
        {allMedia.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => setActiveMediaUrl(item.url)}
            className="relative group rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm cursor-pointer break-inside-avoid"
          >
            <img
              src={item.thumbnail || item.url}
              alt="Traveler memory"
              className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white text-xs">
              <span className="font-bold">{item.author}</span>
              <span className="text-[10px] text-white/80">{item.college} · {item.journey}</span>
            </div>

            {item.type === "video" && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs p-1.5 rounded-full text-white">
                <Play className="h-4 w-4 fill-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fullscreen Lightbox */}
      {activeMediaUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setActiveMediaUrl(null)}
            className="absolute top-5 right-5 text-white bg-black/50 p-2 rounded-full hover:bg-black"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={activeMediaUrl}
            alt="Traveler Memory Fullscreen"
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
