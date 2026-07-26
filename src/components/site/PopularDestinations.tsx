import { Link } from "@tanstack/react-router";
import { Star, Clock, MapPin, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { Route } from "@/routes/index";
import { useQuery } from "@tanstack/react-query";
import { getCmsSection } from "@/lib/queries/cms";

import { getRealDestinationImage } from "@/lib/queries-client";

export function PopularDestinations() {
  const { destinations, journeys } = Route.useLoaderData();

  const { data: section } = useQuery({
    queryKey: ["cms", "popular_destinations"],
    queryFn: () => getCmsSection("popular_destinations"),
    staleTime: 1000,
  });

  const sectionLabel = (section?.content as any)?.badge || "ACTIVE CONVOYS";
  const sectionTitle = section?.title || "Popular Destinations";
  const sectionDesc = section?.subtitle || "Explore India's most breathtaking roads. Handpicked getaways vetted by Nomadik Trip Captains.";

  if (!destinations || destinations.length === 0) {
    return (
      <section id="destinations" className="mx-auto max-w-7xl px-5 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">{sectionLabel}</span>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
            {sectionTitle}
          </h2>
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
            <Compass className="mx-auto h-12 w-12 text-muted-foreground/60 animate-pulse" />
            <h3 className="mt-4 font-display text-xl font-bold text-primary">No Active Convoys Found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              We are currently mapping new scenic roads. Check back soon or join our community to request a custom convoy!
            </p>
          </div>
        </Reveal>
      </section>
    );
  }

  // Get starting price and details from journeys mapping
  const getDestMeta = (slug: string) => {
    const matched = journeys.filter((j) => j.destinationSlug === slug);
    const startPrice = matched.length > 0 ? matched[0].price : "₹7,999";
    const duration = matched.length > 0 ? matched[0].duration : "3 Days";
    const tag = slug === "chopta-tungnath" || slug === "mcleodganj" ? "Expedition" : "Signature Journey";
    return { startPrice, duration, tag };
  };

  return (
    <section id="destinations" className="mx-auto max-w-7xl px-5 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">{sectionLabel}</span>
        <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
          {sectionTitle}
        </h2>
        <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
          {sectionDesc}
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
        {destinations.map((d, i) => {
          const meta = getDestMeta(d.slug);
          const linkPath = `/destinations/${d.slug}`;
          return (
            <Reveal key={d.slug} delay={i} className="group">
              <article className="flex flex-col h-[480px] rounded-3xl overflow-hidden border border-border bg-white shadow-soft hover:shadow-elegant transition-all duration-300 hover:-translate-y-1">
                {/* Top Image — Fixed 16:10 aspect ratio */}
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={getRealDestinationImage(d.slug, (d as any).hero_image || d.image)}
                    alt={`${d.name} road trip destination`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
                  <span className="absolute left-4 top-4 bg-[#0F2942]/90 backdrop-blur-md text-white font-poppins font-bold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-full shadow">
                    {meta.tag}
                  </span>
                </div>

                {/* Bottom White Section */}
                <div className="p-6 flex flex-col justify-between flex-1 bg-white space-y-4">
                  <div className="space-y-2">
                    <p className="text-[11px] text-gold font-poppins font-bold uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-gold shrink-0" /> {d.name}
                    </p>
                    <h3 className="font-display text-xl font-bold leading-tight text-[#0F2942] group-hover:text-gold transition-colors line-clamp-1">
                      {d.name} Journey
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {d.overview}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase font-poppins font-bold block tracking-wider">Starts at</span>
                      <p className="font-display text-lg font-bold text-gold">{meta.startPrice}</p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-[#0F2942] hover:bg-[#1A365D] text-white font-poppins font-bold text-xs px-4 py-2 rounded-full shadow-md transition-all duration-300"
                      asChild
                    >
                      <Link to={linkPath}>
                        Start Journey
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
