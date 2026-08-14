import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, Clock, MapPin, Compass, Car, CloudSun, Calendar, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";
import { useLoaderData } from "@tanstack/react-router";
import { useAuth } from "./AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getCmsSection } from "@/lib/queries/cms";
import { getRealDestinationImage } from "@/lib/queries-client";
import { resolveDestinationHero, resolveGallery } from "@/lib/media-resolver";
import { getPackageDocumentBySlugFn } from "@/lib/itinerary-pdf-fns";
import { ItineraryPreviewCard } from "./ItineraryPreviewCard";
import { ItineraryLoginModal } from "./ItineraryLoginModal";
import { ItineraryPdfViewerModal } from "./ItineraryPdfViewerModal";
import { ReviewsSection } from "./ReviewsSection";
import { UniversalLightboxModal } from "./UniversalLightboxModal";

interface DestinationTemplateProps {
  slug: string;
}

export function DestinationTemplate({ slug }: DestinationTemplateProps) {
  const { isAuthenticated } = useAuth();
  const loaderData = (useLoaderData({ strict: false }) || {}) as any;

  const { data: dest, isLoading: isDestLoading } = useQuery({
    queryKey: ['destination', slug],
    queryFn: async () => {
      try {
        const res = await getDestinationBySlug(slug);
        return res || loaderData?.dest || null;
      } catch {
        return loaderData?.dest || null;
      }
    },
    initialData: loaderData?.dest || undefined,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const { data: journeys = loaderData?.journeys || [] } = useQuery({
    queryKey: ['journeys_catalog_dest'],
    queryFn: async () => {
      try {
        const res = await getJourneys();
        return res || loaderData?.journeys || [];
      } catch {
        return loaderData?.journeys || [];
      }
    },
    initialData: loaderData?.journeys || undefined,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState(0);

  // Fetch document metadata for this destination (client-only to prevent SSR ServerFnException)
  const { data: documentMeta } = useQuery({
    queryKey: ['package_document_destination', slug],
    queryFn: () => getPackageDocumentBySlugFn({ data: { slug, type: 'ITINERARY' } }).catch(() => null),
    enabled: !!slug && typeof window !== 'undefined',
  });

  const handleViewItinerary = () => {
    if (isAuthenticated) {
      setViewerOpen(true);
    } else {
      setLoginModalOpen(true);
    }
  };

  if (isDestLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-5 text-center">
        <div className="space-y-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-xs font-poppins text-muted-foreground">Loading destination...</p>
        </div>
      </div>
    );
  }

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

  // Find journeys matching this destination dynamically
  const matchedJourneys = (journeys || []).filter((j: any) => {
    const destSlug = j.destinationSlug || j.destinations?.slug || j.destination_slug;
    const destId = j.destination_id || j.destinationId || j.destinations?.id;
    return (
      (destSlug && destSlug === slug) ||
      (destId && destId === dest?.id) ||
      (j.slug && j.slug.includes(slug)) ||
      (j.name && j.name.toLowerCase().includes(slug.toLowerCase()))
    );
  });
  
  // Find related journeys (other destinations) for recommendation
  const relatedJourneys = (journeys || []).filter((j: any) => {
    const destSlug = j.destinationSlug || j.destinations?.slug || j.destination_slug;
    const destId = j.destination_id || j.destinationId || j.destinations?.id;
    return destSlug !== slug && destId !== dest?.id;
  }).slice(0, 3);

  // Fetch CMS destination banners override
  const { data: bannerCms } = useQuery({
    queryKey: ['cms', 'destination_banners'],
    queryFn: () => getCmsSection('destination_banners'),
    staleTime: 1000,
  });

  const getHeroBannerSrc = () => {
    const content = bannerCms?.content as any;
    const key = `${slug.replace(/-/g, '_')}_hero`;
    if (content?.[key] && typeof content[key] === 'string' && content[key].trim().length > 5) {
      return resolveDestinationHero(slug, content[key]);
    }
    return resolveDestinationHero(slug, dest?.hero_image || dest?.image);
  };

  return (
    <div className="bg-background min-h-screen text-foreground font-sans">
      
      {/* 1. Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={getHeroBannerSrc()}
            alt={dest.name}
            className="w-full h-full object-cover scale-105 animate-[zoom-slow_20s_ease-out_infinite]"
            onError={(e) => {
              const target = e.currentTarget;
              target.onerror = null;
              target.src = resolveDestinationHero(slug, null);
            }}
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

      {/* 2.5 Itinerary Travel Guide Card Section */}
      <section className="max-w-7xl mx-auto px-5 py-6">
        <ItineraryPreviewCard
          destinationName={dest.name}
          slug={slug}
          document={documentMeta}
          onViewItinerary={handleViewItinerary}
          isAuthenticated={isAuthenticated}
        />
      </section>

      {/* Auth Login Modal for Itinerary Unlock */}
      <ItineraryLoginModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
        title={`${dest.name} Travel Guide`}
        onSuccess={() => {
          setViewerOpen(true);
        }}
      />

      {/* Embedded Fullscreen PDF Viewer Dialog */}
      <ItineraryPdfViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        destinationName={dest.name}
        slug={slug}
        documentMeta={documentMeta}
      />

      {/* Destination Gallery Section */}
      {(() => {
        const galleryList = resolveGallery(slug, dest?.gallery);
        if (!galleryList || galleryList.length === 0) return null;

        return (
          <>
            <section className="max-w-7xl mx-auto px-5 py-12">
              <Reveal className="flex items-center justify-between border-b border-border pb-4 mb-8">
                <div>
                  <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">Visuals</span>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary mt-1">
                    {dest.name} Photo Gallery
                  </h2>
                </div>
                <span className="text-xs font-poppins font-semibold text-muted-foreground">
                  {galleryList.length} Photos
                </span>
              </Reveal>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galleryList.map((imgUrl: string, idx: number) => (
                  <Reveal key={idx} delay={idx % 4}>
                    <div
                      onClick={() => {
                        setGalleryLightboxIndex(idx);
                        setGalleryLightboxOpen(true);
                      }}
                      className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-border shadow-soft bg-muted"
                    >
                      <img
                        src={imgUrl}
                        alt={`${dest.name} memory ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <span className="text-xs font-poppins font-bold bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                          View Photo
                        </span>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            <UniversalLightboxModal
              isOpen={galleryLightboxOpen}
              onClose={() => setGalleryLightboxOpen(false)}
              images={galleryList}
              initialIndex={galleryLightboxIndex}
              title={`${dest.name} — Destination Gallery`}
            />
          </>
        );
      })()}

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

          {matchedJourneys.length === 0 ? (
            <div className="mt-8 p-12 text-center bg-card border border-dashed border-border rounded-3xl max-w-md mx-auto space-y-3 shadow-soft">
              <Compass className="h-10 w-10 text-gold mx-auto animate-pulse" />
              <h3 className="font-display font-bold text-lg text-primary">No Journeys Scheduled Yet</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                New convoys to {dest.name} are currently being mapped by our Trip Captains. Contact us to request a custom departure!
              </p>
              <Button variant="hero" size="sm" asChild className="mt-2 font-bold text-xs">
                <Link to="/contact">Request Custom Departure</Link>
              </Button>
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
              {matchedJourneys.map((j: any, i: number) => (
                <Reveal key={j.slug} delay={i} className="group">
                  <article className="hover-lift overflow-hidden rounded-3xl bg-card border border-border shadow-soft flex flex-col h-full">
                    <Link to="/journeys/$journeyId" params={{ journeyId: j.slug }} className="block cursor-pointer">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={j.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'}
                          alt={j.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';
                          }}
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

                    <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                      {/* Overview */}
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">{j.overview}</p>

                      {/* Details row */}
                      <div className="grid grid-cols-2 gap-3 text-xs bg-muted/40 p-3 rounded-2xl border border-border/50">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Duration</span>
                          <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3.5 w-3.5 text-gold" /> {j.duration}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Transport</span>
                          <span className="font-semibold text-foreground flex items-center gap-1 truncate"><Car className="h-3.5 w-3.5 text-secondary" /> {j.transport?.split("/")[0] || "Volvo"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Difficulty</span>
                          <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5"><Compass className="h-3.5 w-3.5 text-gold" /> {j.difficulty || "Easy"}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Group Size</span>
                          <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5"><Users className="h-3.5 w-3.5 text-accent" /> {typeof j.groupSize === 'string' ? (j.groupSize.split(" ")[0] || "12-18") : (j.group_size_max || "12-18")} Explorers</span>
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
          )}
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
                <p className="mt-1 text-xs text-muted-foreground">
                  {typeof dest.weather === "string" ? dest.weather : dest.weather?.summer || "Pleasant pleasant mountain climate (15°C - 25°C)."}
                </p>
              </div>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">M</div>
              <div>
                <h4 className="font-poppins font-bold text-sm">Monsoon (Jul - Sep)</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {typeof dest.weather === "string" ? dest.weather : dest.weather?.monsoon || "Lush green valleys with light mountain showers."}
                </p>
              </div>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">W</div>
              <div>
                <h4 className="font-poppins font-bold text-sm">Winter (Oct - Mar)</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  {typeof dest.weather === "string" ? dest.weather : dest.weather?.winter || "Crisp winter snow and chilly mountain breeze (0°C - 10°C)."}
                </p>
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
              <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                {typeof dest.howToReach === "string" ? dest.howToReach : dest.howToReach?.road || "Direct Volvo buses & taxis available from Delhi & Chandigarh."}
              </p>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl">
              <span className="text-[10px] font-poppins font-bold text-accent uppercase tracking-wider block">By Train</span>
              <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                {typeof dest.howToReach === "string" ? dest.howToReach : dest.howToReach?.rail || "Nearest major railway station is Chandigarh / Una."}
              </p>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl">
              <span className="text-[10px] font-poppins font-bold text-accent uppercase tracking-wider block">By Flight</span>
              <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                {typeof dest.howToReach === "string" ? dest.howToReach : dest.howToReach?.air || "Nearest airport is Bhuntar (Kullu) / Chandigarh Airport."}
              </p>
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

      {/* Verified Traveler Reviews & Rating System */}
      <section className="bg-white border-t border-[#E4E2DA] py-16">
        <div className="max-w-7xl mx-auto px-5">
          <ReviewsSection
            destinationId={slug}
            journeyName={dest?.name || slug}
          />
        </div>
      </section>

      {/* Content Cluster: Pillar Travel Guide Link */}
      {(() => {
        const canonicalSlug = slug === "chopta-tungnath" ? "chopta" : slug === "mcleod-ganj" ? "mcleodganj" : slug;
        const blogSlugMap: Record<string, { title: string; slug: string; desc: string }> = {
          udaipur: {
            title: "Udaipur Travel Guide 2026: Places to Visit & Delhi Road Trip Tips",
            slug: "udaipur-road-trip-guide-2026",
            desc: "Comprehensive guide on Lake Pichola, City Palace, Aravalli driving routes & best heritage stay options."
          },
          manali: {
            title: "Manali Travel Guide 2026: Old Manali Cafes, Solang Valley & Sethan",
            slug: "manali-travel-guide-2026",
            desc: "Discover Old Manali cafe walks, Solang Valley snow drives, Sethan igloos & Delhi travel tips."
          },
          jibhi: {
            title: "Jibhi Travel Guide 2026: Tirthan Valley, Jalori Pass & Hidden Treehouses",
            slug: "jibhi-travel-guide-2026",
            desc: "Explore Jibhi waterfalls, Serolsar Lake trek, Chehni Kothi fort & riverside cottage stays."
          },
          chopta: {
            title: "Chopta & Tungnath Trek Guide 2026: Highest Shiva Temple & Snow Trek",
            slug: "chopta-tungnath-trek-guide-2026",
            desc: "Detailed trek itinerary for Tungnath temple, Chandrashila summit views & Deoria Tal lake."
          },
          mcleodganj: {
            title: "McLeod Ganj Travel Guide 2026: Dalai Lama Temple & Triund Camping",
            slug: "mcleod-ganj-travel-guide-2026",
            desc: "Explore Little Lhasa, Dalai Lama Temple, Tibetan cafes & Triund cliff-side camping."
          }
        };

        const blogInfo = blogSlugMap[canonicalSlug];
        if (!blogInfo) return null;

        return (
          <section className="bg-amber-50/50 border-t border-b border-amber-200/60 py-12">
            <div className="max-w-7xl mx-auto px-5">
              <div className="bg-white border border-amber-200 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-poppins font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    Pillar Travel Guide
                  </span>
                  <h3 className="font-display text-2xl font-bold text-primary">
                    {blogInfo.title}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                    {blogInfo.desc}
                  </p>
                </div>
                <Link
                  to="/stories/$slug"
                  params={{ slug: blogInfo.slug }}
                  className="bg-primary text-white font-poppins font-bold px-5 py-3 rounded-xl text-xs hover:bg-primary/90 transition shrink-0 inline-flex items-center gap-2"
                >
                  Read Travel Guide &rarr;
                </Link>
              </div>
            </div>
          </section>
        );
      })()}

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
