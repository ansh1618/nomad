import { Link } from "@tanstack/react-router";
import { Clock, Star, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { Route } from "@/routes/index";

export function FeaturedSpiritualJourneys() {
  const { journeys } = Route.useLoaderData();

  // Filter journeys with category === 'SPIRITUAL'
  const spiritualJourneys = journeys.filter(j => j.category?.toUpperCase() === 'SPIRITUAL');

  if (!spiritualJourneys || spiritualJourneys.length === 0) {
    return null; // Don't show the section if no spiritual caravans exist
  }

  return (
    <section className="bg-amber-50/40 border-t border-b border-amber-100/50 py-24">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center mb-14">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-[#D97706] bg-amber-100/70 px-3 py-1 rounded-full">SERENE CARAVANS</span>
          <h2 className="mt-4 font-display text-4xl font-bold text-primary sm:text-5xl">
            Featured Spiritual Journeys
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Epics written in stone, ancient ghats, and timeless devotion. Experience India's sacred heritage through curated slow-paced journeys with comfortable stays and verified coordinators.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {spiritualJourneys.slice(0, 3).map((j, i) => {
            const seatsLeft = j.remainingSeats ?? j.maxCapacity ?? 0;
            return (
              <Reveal key={j.slug} delay={i} className="group">
                <article className="hover-lift flex h-full flex-col overflow-hidden rounded-3xl bg-white border border-amber-100 shadow-soft hover:shadow-amber-100/40">
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={j.image}
                      alt={j.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-[10px] font-poppins font-bold text-white shadow-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                      Sacred Journey
                    </span>
                    {seatsLeft > 0 && (
                      <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-poppins font-bold text-amber-700 shadow">
                        Only {seatsLeft} Seats Left!
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6 space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{j.destinationName || 'Spiritual Caravan'}</span>
                      <h3 className="font-display text-2xl font-bold text-primary group-hover:text-amber-600 transition-colors mt-1">
                        {j.name}
                      </h3>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {j.overview}
                      </p>
                    </div>

                    {/* Specs grid */}
                    <div className="grid grid-cols-2 gap-3 border-t border-b border-amber-50 py-4">
                      <div className="space-y-0.5">
                        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Duration</span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                          <Clock className="h-3.5 w-3.5 text-amber-500" /> {j.duration}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Experience</span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                          <Compass className="h-3.5 w-3.5 text-amber-500" /> Slow Travel
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Starting From</span>
                        <span className="font-display text-lg font-bold text-primary">{j.price}</span>
                      </div>
                      <Link to="/$slug" params={{ slug: j.slug }}>
                        <Button className="h-9 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-xs font-poppins font-semibold px-4 shadow-sm transition-all group-hover:shadow-md">
                          Explore Route
                        </Button>
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
