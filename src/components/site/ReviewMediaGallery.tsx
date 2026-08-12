import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { UniversalLightboxModal } from "./UniversalLightboxModal";

export function ReviewMediaGallery() {
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Media items sourced only from real DB reviews — no fake seed data
  const allMedia: { src: string; alt: string; caption: string }[] = [];

  return (
    <div className="space-y-6 font-poppins text-left">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8A96A] bg-[#C8A96A]/10 px-2.5 py-1 rounded-full">
            REAL TRAVELER MEMORIES
          </span>
          <h3 className="font-display font-bold text-2xl text-[#102A43] mt-1">
            Traveler Photo &amp; Reel Gallery
          </h3>
        </div>
        <span className="text-xs text-muted-foreground font-semibold">
          {allMedia.length} Photos &amp; Videos
        </span>
      </div>

      {allMedia.length > 0 ? (
        /* Pinterest Masonry Grid */
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
      ) : (
        <div className="p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
          <ShieldCheck className="h-8 w-8 mx-auto text-slate-300 mb-1" />
          <p className="text-sm font-semibold text-[#102A43]">Traveler Gallery Coming Soon</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Photos and reels from verified GoNomadik travelers will appear here after their trips.
          </p>
        </div>
      )}

      {/* Universal Lightbox Modal */}
      <UniversalLightboxModal
        isOpen={!!activeMediaUrl}
        onClose={() => setActiveMediaUrl(null)}
        images={allMedia}
        initialIndex={selectedIndex}
        title="Traveler Photo &amp; Reel Gallery"
      />
    </div>
  );
}
