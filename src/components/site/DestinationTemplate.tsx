import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, Clock, MapPin, Compass, Car, CloudSun, Calendar, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";
import { useLoaderData } from "@tanstack/react-router";

interface DestinationTemplateProps {
  slug: string;
}

export function DestinationTemplate({ slug }: DestinationTemplateProps) {
  const { dest, journeys } = useLoaderData({ strict: false }) as any;
  if (!dest) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-5 text-center">
        <div>
          <h1 className="text-4xl font-display font-bold">Destination Not Found</h1>
          <p className="mt-2 text-muted-foreground">The journey path you seek is currently unexplored.</p>
          <Link to="/" className="mt-6 inline-block bg-primary text-white font-semibold px-6 py-2.5 rounded-xl">
            Go back Home
          </Link>
        </div>
      </div>
    );
  }

  // Find journeys matching this destination
  const matchedJourneys = journeys.filter((j) => j.destinationSlug === slug);
  
  // Find related journeys (other destinations) for recommendation
  const relatedJourneys = journeys.filter((j) => j.destinationSlug !== slug).slice(0, 3);

  return (
    <div className="bg-background min-h-screen text-foreground font-sans">
      
      {/* 1. Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={dest.image}
            alt={dest.name}
            className="w-full h-full object-cover scale-105 animate-[zoom-slow_20s_ease-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/60 via-primary/30 to-background" />
        </div>

        <div className="relative z-10 text-center px-5 max-w-4xl space-y-6 pt-20">
          <Reveal>
            <span className="glass-dark inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-poppins font-semibold uppercase tracking-widest text-white">
              <Compass className="h-4 w-4 text-gold animate-spin-slow" /> ACTIVE NOMADIK ROUTE
            </span>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="font-display text-5xl font-bold text-white sm:text-7xl leading-tight">
              {dest.name}
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="text-lg sm:text-xl text-white/90 font-display italic max-w-2xl mx-auto">
              "{dest.subtitle}"
            </p>
          </Reveal>
          <Reveal delay={3} className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <Button size="lg" variant="hero" asChild>
              <a href="#journeys">Start Your Journey</a>
            </Button>
            <Button size="lg" variant="outlineLight" asChild>
              <a href="#journeys">Browse Journeys</a>
            </Button>
          </Reveal>
        </div>
      </section>

      {/* 2. Overview Section */}
      <section className="max-w-7xl mx-auto px-5 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-6">
          <Reveal>
            <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">Overview</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
              About the Experience
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              {dest.overview}
            </p>
          </Reveal>

          {/* Top Places */}
          <Reveal className="pt-6">
            <h3 className="font-display text-xl font-bold text-primary">Top Places to Explore</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {dest.topPlaces.map((place) => (
                <span key={place} className="bg-secondary/10 text-secondary border border-secondary/20 rounded-full px-4 py-1.5 text-xs font-poppins font-semibold">
                  {place}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Sidebar Info Card */}
        <div className="lg:col-span-4 bg-white border border-border p-6 rounded-3xl shadow-soft space-y-4">
          <Reveal>
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <CloudSun className="h-5 w-5 text-accent" />
              <h4 className="font-poppins font-bold text-sm text-primary uppercase tracking-wide">Best Season</h4>
            </div>
            <p className="mt-2 text-sm text-foreground/80">{dest.bestTime}</p>
          </Reveal>

          <Reveal className="pt-2">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <h4 className="font-poppins font-bold text-sm text-primary uppercase tracking-wide">Nomadik Safe Journey</h4>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              All travels feature experienced trip captains, local guides, vetted boutique stays, and GPS-tracked road caravans.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 3. Upcoming Journeys Section */}
      <section id="journeys" className="bg-muted/30 py-20">
        <div className="max-w-7xl mx-auto px-5">
          <Reveal className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold font-semibold">Journeys</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
              Signature Road Journeys
            </h2>
            <p className="mt-3 text-muted-foreground text-sm">
              Experience-focused trips planned down to the last detail. Price second, memories first.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
            {matchedJourneys.map((j, i) => (
              <Reveal key={j.slug} delay={i} className="group">
                <article className="hover-lift overflow-hidden rounded-3xl bg-card border border-border shadow-soft flex flex-col h-full">
                  <Link to="/journeys/$journeyId" params={{ journeyId: j.slug }} className="block cursor-pointer">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={j.image}
                        alt={j.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      
                      {/* Animated seat indicator */}
                      <div className="absolute top-4 left-4 glass-dark rounded-full px-3 py-1 text-[11px] font-poppins font-bold text-white flex items-center gap-1.5 animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-[#E53E3E]" />
                        Only {j.remainingSeats ?? j.maxCapacity ?? 0} Seats Left!
                      </div>

                      <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
                        <MapPin className="h-4 w-4 text-gold" />
                        <span className="font-display text-2xl font-bold">{j.name}</span>
                      </div>
                    </div>
                  </Link>

                  <div className="p-6 flex flex-col flex-1 justify-between space-y-6">
                    {/* Experience Info first */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-sans text-muted-foreground border-b border-border pb-4">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-white/50">Duration</span>
                        <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3.5 w-3.5 text-accent" /> {j.duration}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-white/50">Transport</span>
                        <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5"><Car className="h-3.5 w-3.5 text-accent" /> {j.transport.split(" ")[0]} Drive</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-white/50">Difficulty</span>
                        <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5"><Compass className="h-3.5 w-3.5 text-accent" /> {j.difficulty}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-white/50">Group Size</span>
                        <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5"><Users className="h-3.5 w-3.5 text-accent" /> {j.groupSize.split(" ")[0]} Explorers</span>
                      </div>
                    </div>

                    {/* Price second */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Starting from</span>
                        <span className="font-display text-2xl font-bold text-primary">{j.price} <span className="text-xs text-muted-foreground font-sans font-normal">/ Person</span></span>
                      </div>
                      <Link
                        to="/journeys/$journeyId"
                        params={{ journeyId: j.slug }}
                        search={{ book: true }}
                        className="bg-secondary text-white font-poppins font-semibold px-5 py-2.5 rounded-xl hover:bg-primary transition shadow-soft text-sm text-center"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Weather & How to Reach Section */}
      <section className="max-w-7xl mx-auto px-5 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Weather Breakdown */}
        <Reveal className="space-y-6">
          <h3 className="font-display text-2xl font-bold text-primary">Weather & Seasons</h3>
          <div className="space-y-4">
            <div className="bg-white border border-border p-5 rounded-2xl flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">S</div>
              <div>
                <h4 className="font-poppins font-bold text-sm">Summer (Apr - Jun)</h4>
                <p className="mt-1 text-xs text-muted-foreground">{dest.weather.summer}</p>
              </div>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">M</div>
              <div>
                <h4 className="font-poppins font-bold text-sm">Monsoon (Jul - Sep)</h4>
                <p className="mt-1 text-xs text-muted-foreground">{dest.weather.monsoon}</p>
              </div>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">W</div>
              <div>
                <h4 className="font-poppins font-bold text-sm">Winter (Oct - Mar)</h4>
                <p className="mt-1 text-xs text-muted-foreground">{dest.weather.winter}</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* How to Reach */}
        <Reveal className="space-y-6">
          <h3 className="font-display text-2xl font-bold text-primary">How to Reach</h3>
          <div className="space-y-4">
            <div className="bg-white border border-border p-5 rounded-2xl">
              <span className="text-[10px] font-poppins font-bold text-accent uppercase tracking-wider block">By Road</span>
              <p className="mt-1 text-xs text-foreground/80 leading-relaxed">{dest.howToReach.road}</p>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl">
              <span className="text-[10px] font-poppins font-bold text-accent uppercase tracking-wider block">By Train</span>
              <p className="mt-1 text-xs text-foreground/80 leading-relaxed">{dest.howToReach.rail}</p>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl">
              <span className="text-[10px] font-poppins font-bold text-accent uppercase tracking-wider block">By Flight</span>
              <p className="mt-1 text-xs text-foreground/80 leading-relaxed">{dest.howToReach.air}</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 5. Google Reviews Style Section */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-4xl mx-auto px-5">
          <Reveal className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold font-semibold">Guest Stories</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
              Explorer Reviews
            </h2>
            <p className="mt-2 text-muted-foreground text-xs">Verified ratings on Google reviews</p>
          </Reveal>

          <div className="mt-12 space-y-6">
            {dest.reviews.map((r, i) => (
              <Reveal key={r.name} delay={i}>
                <div className="bg-white border border-border p-6 rounded-2xl shadow-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-gold-gradient font-bold text-gold-foreground font-poppins text-sm">
                        {r.avatar}
                      </span>
                      <div>
                        <h4 className="font-poppins font-bold text-sm text-primary">{r.name}</h4>
                        <span className="text-[10px] text-muted-foreground">{r.date}</span>
                      </div>
                    </div>
                    {/* Google G Icon and Stars */}
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex">
                        {Array.from({ length: r.rating }).map((_, starIdx) => (
                          <Star key={starIdx} className="h-3.5 w-3.5 fill-gold text-gold" />
                        ))}
                      </div>
                      <span className="text-[9px] font-poppins text-muted-foreground font-bold tracking-wide">VERIFIED GOOGLE REVIEW</span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-foreground/80 leading-relaxed italic">
                    "{r.text}"
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section className="max-w-3xl mx-auto px-5 py-20">
        <Reveal className="text-center">
          <h2 className="font-display text-3xl font-bold text-primary sm:text-4xl">
            Trip Captain FAQ
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">Essential details for this route</p>
        </Reveal>

        <Reveal className="mt-10">
          <Accordion type="single" collapsible className="space-y-3">
            {dest.faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="overflow-hidden rounded-2xl border border-border bg-card px-5"
              >
                <AccordionTrigger className="py-4 text-left font-display text-base font-bold text-primary hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-xs text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </section>

      {/* 7. Related Trips Section */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-5">
          <Reveal className="text-center">
            <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">Recommendations</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">
              Other Scenic Roads
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedJourneys.map((rj, i) => (
              <Reveal key={rj.slug} delay={i}>
                <div className="glass-dark rounded-2xl overflow-hidden flex flex-col h-full justify-between">
                  <img src={rj.image} alt={rj.name} className="h-44 w-full object-cover" />
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display text-lg font-bold text-white">{rj.name}</h4>
                      <p className="mt-1 text-xs text-white/60 leading-relaxed line-clamp-2">{rj.overview}</p>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <div>
                        <span className="text-[9px] text-white/50 uppercase tracking-wider block">Duration</span>
                        <span className="text-xs font-semibold">{rj.duration}</span>
                      </div>
                      <Link
                        to="/journeys/$journeyId"
                        params={{ journeyId: rj.slug }}
                        className="bg-gold-gradient text-gold-foreground font-poppins font-semibold px-3 py-1.5 rounded-lg text-xs hover:brightness-110 transition"
                      >
                        Explore
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
