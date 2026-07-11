import { Link } from "@tanstack/react-router";
import { Star, Clock, MapPin, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { Route } from "@/routes/index";
import { useQuery } from "@tanstack/react-query";
import { getCmsSection } from "@/lib/queries/cms";

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

      <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 justify-center">
        {destinations.map((d, i) => {
          const meta = getDestMeta(d.slug);
          const linkPath = `/destinations/${d.slug}`;
          return (
            <Reveal key={d.slug} delay={i} className="group">
              <article className="hover-lift overflow-hidden rounded-3xl bg-card border border-border shadow-soft flex flex-col h-full">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={d.image}
                    alt={`${d.name} road trip destination`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-750 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="glass absolute left-4 top-4 rounded-full px-3.5 py-1.5 text-[10px] font-poppins font-bold text-primary tracking-wide uppercase">
                    {meta.tag}
                  </span>
                  <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
                    <MapPin className="h-4 w-4 text-gold" />
                    <span className="font-display text-2xl font-bold">{d.name}</span>
                  </div>
                </div>

                <div className="p-6 flex flex-col justify-between flex-1 space-y-6">
                  <div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {d.overview}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Starting from</span>
                      <p className="font-display text-2xl font-bold text-primary">{meta.startPrice}</p>
                    </div>
                    <Button
                      variant="hero"
                      size="default"
                      asChild
                    >
                      <Link to={linkPath}>
                        Start Your Journey
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
