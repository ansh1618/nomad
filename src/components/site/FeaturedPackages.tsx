import { Link } from "@tanstack/react-router";
import { Clock, Check, Star, Car, Compass, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { Route } from "@/routes/index";
import { useQuery } from "@tanstack/react-query";
import { getCmsSection } from "@/lib/queries/cms";

export function FeaturedPackages() {
  const { journeys } = Route.useLoaderData();

  const { data: section } = useQuery({
    queryKey: ["cms", "featured_packages"],
    queryFn: () => getCmsSection("featured_packages"),
    staleTime: 1000,
  });

  const sectionLabel = (section?.content as any)?.badge || "NOMADIK SIGNATURE";
  const sectionTitle = section?.title || "Signature Experiences";
  const sectionDesc = section?.subtitle || "Handpicked adventures loved by thousands of explorers. Built around slow road travel and authentic vibes.";

  if (!journeys || journeys.length === 0) {
    return (
      <section id="packages" className="mx-auto max-w-7xl px-5 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">{sectionLabel}</span>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
            {sectionTitle}
          </h2>
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
            <Compass className="mx-auto h-12 w-12 text-muted-foreground/60 animate-pulse" />
            <h3 className="mt-4 font-display text-xl font-bold text-primary">No Signature Experiences Found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              All active trips are currently in progress or fully booked. Join our WhatsApp community or contact support to hear first about the next convoy openings!
            </p>
          </div>
        </Reveal>
      </section>
    );
  }

  return (
    <section id="packages" className="mx-auto max-w-7xl px-5 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">{sectionLabel}</span>
        <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
          {sectionTitle}
        </h2>
        <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
          {sectionDesc}
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {journeys.slice(0, 3).map((j, i) => {
          const seatsLeft = j.remainingSeats ?? j.maxCapacity ?? 0;
          return (
            <Reveal key={j.slug} delay={i} className="group">
              <article className="hover-lift flex h-full flex-col overflow-hidden rounded-3xl bg-card border border-border shadow-soft">
                {/* Image */}
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={j.image}
                    alt={j.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-poppins font-bold text-[#E53E3E] shadow animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E53E3E]" />
                    Only {seatsLeft} Seats Left!
                  </span>
                  <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[10px] font-poppins font-bold text-primary shadow">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" /> 4.9 Rating
                  </span>
                </div>

                {/* Content — Experience first, Price second */}
                <div className="flex flex-1 flex-col p-6 space-y-4">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-primary group-hover:text-accent transition-colors">
                      {j.name}
                    </h3>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {j.overview}
                    </p>
                  </div>

                  {/* Specs grid */}
                  <div className="grid grid-cols-2 gap-3 border-t border-b border-border py-4">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Duration</span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                        <Clock className="h-3.5 w-3.5 text-accent" /> {j.duration}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Transport</span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                        <Car className="h-3.5 w-3.5 text-accent" /> Tempo / Self
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Difficulty</span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                        <Compass className="h-3.5 w-3.5 text-accent" /> {j.difficulty}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Best Season</span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                        <Calendar className="h-3.5 w-3.5 text-accent" /> {j.bestSeason}
                      </span>
                    </div>
                  </div>

                  {/* Highlights */}
                  <ul className="space-y-2">
                    {j.highlights.slice(0, 2).map((h, hIdx) => (
                      <li key={hIdx} className="flex items-center gap-2 text-xs text-foreground/80 leading-snug">
                        <Check className="h-4 w-4 shrink-0 text-secondary" />
                        <span className="line-clamp-1">{h}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Price — second */}
                  <div className="mt-auto pt-4 border-t border-border">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Price per Explorer</span>
                    <p className="font-display text-2xl font-bold text-primary">
                      {j.price} <span className="text-xs text-muted-foreground font-sans font-normal">/ Person</span>
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 text-xs" asChild>
                      <Link to="/journeys/$journeyId" params={{ journeyId: j.slug }}>Quick View</Link>
                    </Button>
                    <Button
                      variant="hero"
                      className="flex-1 text-xs shadow-gold"
                      asChild
                    >
                      <Link to="/journeys/$journeyId" params={{ journeyId: j.slug }} search={{ book: true }}>
                        Book Now
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
