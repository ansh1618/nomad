import { useQuery } from "@tanstack/react-query";
import { Reveal } from "./Reveal";
import { Instagram } from "lucide-react";
import { getPublishedStories, getSiteSettings } from "@/lib/queries/cms";
import { BRAND } from "@/config/brand";

const DEFAULT_REELS = [
  { id: 1, caption: "Sunrise at Chopta meadows 🏔️", thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=600&fit=crop" },
  { id: 2, caption: "Night bonfire at Jibhi camp 🔥", thumbnail: "https://images.unsplash.com/photo-1475483768296-6163e08872a1?w=400&h=600&fit=crop" },
  { id: 3, caption: "Road to Manali — windows down 🚗", thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=600&fit=crop" },
  { id: 4, caption: "McLeod Ganj sunset walk 🌅", thumbnail: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&h=600&fit=crop" },
  { id: 5, caption: "Udaipur lake palace vibes ✨", thumbnail: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=600&fit=crop" },
  { id: 6, caption: "Tungnath trek summit push ⛰️", thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=600&fit=crop" },
];

export function InstagramReels() {
  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: getSiteSettings,
    staleTime: 1000,
  });

  const { data: dbStories = [] } = useQuery({
    queryKey: ["stories", "published-home"],
    queryFn: () => getPublishedStories(6),
    staleTime: 1000,
  });

  const instagramUrl = settings?.instagram_url || BRAND.instagram;
  const username = instagramUrl.split("/").pop() || "gonomadik";

  // Map dbStories to reel structures if we have them
  const activeReels = dbStories.length > 0
    ? dbStories.map((story) => ({
        id: story.id,
        caption: story.title + (story.snippet ? ` — ${story.snippet}` : ""),
        thumbnail: story.image_url,
      }))
    : DEFAULT_REELS;

  return (
    <section className="py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center pb-12">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">
            @{username.toUpperCase()}
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
            Live From The Road
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Real moments from real explorers. No filters, no stock photos — just the open road.
          </p>
        </Reveal>
      </div>

      {/* Auto-scrolling marquee */}
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

        <div className="flex gap-5 animate-marquee hover:[animation-play-state:paused]">
          {[...activeReels, ...activeReels].map((reel, i) => (
            <a
              key={`${reel.id}-${i}`}
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex-shrink-0 w-[220px] aspect-[9/16] rounded-2xl overflow-hidden shadow-soft border border-border"
            >
              <img
                src={reel.thumbnail}
                alt={reel.caption}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white text-xs font-sans leading-snug">{reel.caption}</p>
              </div>
              {/* Instagram icon */}
              <div className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Instagram className="h-4 w-4" />
              </div>
            </a>
          ))}
        </div>
      </div>

      <Reveal className="text-center mt-10">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-white px-6 py-3 text-xs font-poppins font-semibold text-primary shadow-soft hover:border-gold hover:shadow-gold transition-all duration-300"
        >
          <Instagram className="h-4 w-4 text-accent" />
          Follow @{username}
        </a>
      </Reveal>
    </section>
  );
}

