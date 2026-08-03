import { useState } from "react";
import { Play, Sparkles, Image as ImageIcon } from "lucide-react";
import { SEED_REVIEWS } from "@/lib/reviews-client";
import { UniversalLightboxModal } from "./UniversalLightboxModal";

export function ReviewMediaGallery() {
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Extract all media items from seed reviews
  const allMedia = SEED_REVIEWS.flatMap((r) =>
    (r.media || []).map((m) => ({
      src: m.url,
      alt: `Photo by ${r.author_name}`,
      caption: `${r.author_name} (${r.college}) — ${r.journey_name}`,
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
            key={idx}
            onClick={() => {
              setSelectedIndex(idx);
              setActiveMediaUrl(item.src);
            }}
            className="relative group rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm cursor-pointer break-inside-avoid"
          >
            <img
              src={item.src}
              alt={item.alt}
              className="w-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white text-xs">
              <span className="font-bold">{item.caption}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Universal Lightbox Modal */}
      <UniversalLightboxModal
        isOpen={!!activeMediaUrl}
        onClose={() => setActiveMediaUrl(null)}
        images={allMedia}
        initialIndex={selectedIndex}
        title="Traveler Photo & Reel Gallery"
      />
    </div>
  );
}
