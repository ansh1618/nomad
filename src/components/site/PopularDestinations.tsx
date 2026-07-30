import { Link } from "@tanstack/react-router";
import { MapPin, BookOpen, ShieldCheck, Heart, Headphones, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { Route } from "@/routes/index";
import { resolveDestinationHero } from "@/lib/media-resolver";

export function PopularDestinations() {
  const { destinations, journeys } = Route.useLoaderData();

  if (!destinations || destinations.length === 0) {
    return null;
  }

  // Count available packages per destination
  const getPackageCount = (slug: string) => {
    const matched = journeys.filter((j) => {
      const destSlug = j.destinationSlug || (j.destinations as any)?.slug || j.destination_slug;
      return destSlug === slug || j.slug.includes(slug);
    });
    return matched.length > 0 ? matched.length : 2;
  };

  // State mapping for authentic destination labels
  const getStateName = (slug: string) => {
    if (slug.includes("udaipur")) return "Rajasthan";
    if (slug.includes("chopta") || slug.includes("tungnath")) return "Uttarakhand";
    return "Himachal Pradesh";
  };

  return (
    <section id="destinations" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-[#FAF9F6]">
      {/* Section Header with Title & Top-Right Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-8 bg-amber-700/80 rounded-full" />
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1C2A3A]">
            Popular Destinations
          </h2>
        </div>
        <Button
          variant="outline"
          className="self-start sm:self-auto rounded-full border-border text-foreground hover:bg-muted font-sans font-medium text-xs px-5 py-2"
          asChild
        >
          <Link to="/destinations">
            View All Destinations →
          </Link>
        </Button>
      </div>

      {/* Grid of Destination Cards + Why Travel Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {destinations.slice(0, 5).map((d, i) => {
          const pkgCount = getPackageCount(d.slug);
          const stateName = getStateName(d.slug);
          const heroSrc = resolveDestinationHero(d.slug, d.hero_image || d.image);

          return (
            <Reveal key={d.slug} delay={i}>
              <div className="group bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-full">
                {/* Top Image Section */}
                <div className="relative h-[230px] w-full overflow-hidden bg-slate-100">
                  <img
                    src={heroSrc}
                    alt={d.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = resolveDestinationHero(d.slug, null);
                    }}
                  />
                  
                  {/* Top-Left Badge */}
                  <div className="absolute top-4 left-4 glass-dark rounded-full px-3.5 py-1.5 text-[10px] font-poppins font-bold text-white tracking-wider uppercase flex items-center gap-1.5 shadow-md">
                    <span className="text-amber-400">💼</span> {pkgCount} PACKAGES AVAILABLE
                  </div>
                </div>

                {/* Card Content Section */}
                <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-display text-2xl font-bold text-[#1A2E40]">
                      {d.name}
                    </h3>
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-amber-700/80 shrink-0" /> {stateName}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pt-1">
                      {d.overview || d.subtitle || d.description}
                    </p>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <Link
                      to="/destinations/$slug"
                      params={{ slug: d.slug }}
                      className="text-xs font-semibold text-slate-700 hover:text-amber-700 flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="h-4 w-4 text-amber-700/80" /> View Guide
                    </Link>

                    <Button
                      size="sm"
                      className="bg-[#1A2E40] hover:bg-[#0F1E2C] text-white font-sans font-semibold text-xs px-5 py-2.5 rounded-full shadow-md transition-all"
                      asChild
                    >
                      <Link to="/destinations/$slug" params={{ slug: d.slug }}>
                        Explore Journey →
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}

        {/* 6th Card — Dark Navy "Why Travel with Nomadik?" Feature Box */}
        <Reveal delay={5}>
          <div className="bg-[#122232] rounded-3xl p-8 text-white h-full flex flex-col justify-between border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-400 rounded-full" />
                <h3 className="font-display text-2xl font-bold text-white">
                  Why Travel with Nomadik?
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-amber-400">
                    <Compass className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white pt-1">Handpicked Experiences</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">Only the best, curated for you</p>
                </div>

                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-amber-400">
                    <Heart className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white pt-1">Trusted by Explorers</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">Thousands of happy travellers</p>
                </div>

                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-amber-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white pt-1">Comfort & Safety</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">Your safety is our priority</p>
                </div>

                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-amber-400">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-bold text-white pt-1">24x7 Support</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">We're always here for you</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
