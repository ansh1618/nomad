import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Compass, Car, Calendar, Route as RouteIcon } from "lucide-react";
import { Reveal } from "./Reveal";
import { cn } from "@/lib/utils";
import { Route } from "@/routes/index";

interface Pin {
  slug: string;
  name: string;
  x: number; // percentage from left
  y: number; // percentage from top
  region: string;
}

const pins: Pin[] = [
  { slug: "manali", name: "Manali", x: 44, y: 30, region: "Himachal Pradesh" },
  { slug: "jibhi", name: "Jibhi", x: 49, y: 34, region: "Himachal Pradesh" },
  { slug: "mcleodganj", name: "McLeod Ganj", x: 38, y: 26, region: "Himachal Pradesh" },
  { slug: "chopta-tungnath", name: "Chopta & Tungnath", x: 58, y: 41, region: "Uttarakhand" },
  { slug: "udaipur", name: "Udaipur", x: 26, y: 70, region: "Rajasthan" },
];

export function MapSection() {
  const { destinations, journeys } = Route.useLoaderData();
  const [activePin, setActivePin] = useState<string | null>(null);

  // Retrieve destination and matching journey data
  const getPinDetails = (slug: string) => {
    const dest = destinations.find((d) => d.slug === slug);
    const journey = journeys.find((j) => j.destinationSlug === slug);
    return { dest, journey };
  };

  return (
    <section className="relative overflow-hidden bg-primary py-24 text-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute -left-36 -top-36 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-36 -bottom-36 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          
          {/* Information Side */}
          <div className="lg:col-span-5 space-y-6">
            <Reveal>
              <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-gold">
                <Compass className="h-4 w-4 animate-spin-slow" /> Interactive Map
              </span>
              <h2 className="mt-3 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
                Explore Our Active Routes
              </h2>
              <p className="mt-4 text-white/70 leading-relaxed font-sans text-base">
                We design and run road trips along India's most scenic highways. Hover or click on the pins to explore the journeys, difficulty levels, and distances.
              </p>
            </Reveal>

            {/* List of active paths */}
            <div className="space-y-4 pt-4">
              {pins.map((p, i) => {
                const { dest, journey } = getPinDetails(p.slug);
                return (
                  <Reveal key={p.slug} delay={i}>
                    <button
                      onMouseEnter={() => setActivePin(p.slug)}
                      onMouseLeave={() => setActivePin(null)}
                      onClick={() => setActivePin(activePin === p.slug ? null : p.slug)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 text-left font-poppins",
                        activePin === p.slug
                          ? "bg-secondary/40 border-gold shadow-gold text-white"
                          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg text-sm transition-all",
                          activePin === p.slug ? "bg-gold-gradient text-gold-foreground" : "bg-white/10"
                        )}>
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-sm block">{p.name}</span>
                          <span className="text-xs text-white/50">{p.region}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <span className="text-gold block font-semibold">{journey?.price || "Custom"}</span>
                        <span className="text-white/40">{journey?.distance || "Road"}</span>
                      </div>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          </div>

          {/* Map Side */}
          <div className="lg:col-span-7 flex justify-center">
            <Reveal className="relative w-full max-w-[580px] aspect-[4/5] bg-[#1a2d3d]/60 border border-white/10 rounded-3xl p-6 shadow-elegant overflow-hidden">
              {/* Map grid decoration */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
              
              {/* Base outline representing India (Stylized abstract topology dots/lines) */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <svg className="w-5/6 h-5/6 text-white" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5">
                  <path d="M50 5 L75 25 L85 50 L75 75 L50 95 L25 75 L15 50 L25 25 Z" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="30" />
                </svg>
              </div>

              {/* Styled Road Network Vectors */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                {/* Roads converging from Delhi Hub (Center around x:48, y:48) */}
                {/* Delhi coordinates */}
                <circle cx="48" cy="48" r="1" fill="#C8A96A" />
                <text x="50" y="47.5" fill="#C8A96A" fontSize="2.5" fontWeight="bold" fontFamily="Poppins">DELHI (HUB)</text>
                
                {/* Delhi -> Udaipur Road */}
                <path d="M48 48 Q35 58 26 70" stroke="rgba(200, 169, 106, 0.4)" strokeWidth="0.8" fill="none" strokeDasharray="2 2" className="animate-[dash_4s_linear_infinite]" />
                
                {/* Delhi -> Chopta Road */}
                <path d="M48 48 Q54 44 58 41" stroke="rgba(200, 169, 106, 0.4)" strokeWidth="0.8" fill="none" strokeDasharray="2 2" />
                
                {/* Delhi -> McLeod Road */}
                <path d="M48 48 Q40 38 38 26" stroke="rgba(200, 169, 106, 0.4)" strokeWidth="0.8" fill="none" strokeDasharray="2 2" />

                {/* Delhi -> Jibhi Road */}
                <path d="M48 48 Q49 42 49 34" stroke="rgba(200, 169, 106, 0.4)" strokeWidth="0.8" fill="none" strokeDasharray="2 2" />

                {/* Jibhi -> Manali Connection */}
                <path d="M49 34 Q45 32 44 30" stroke="rgba(200, 169, 106, 0.4)" strokeWidth="0.8" fill="none" strokeDasharray="2 2" />
              </svg>

              {/* Pulsing Target Overlay Card */}
              {activePin && (() => {
                const { dest, journey } = getPinDetails(activePin);
                if (!dest) return null;
                const pin = pins.find((p) => p.slug === activePin)!;
                return (
                  <div
                    className={cn(
                      "absolute z-30 w-64 bg-card text-foreground rounded-2xl p-4 shadow-elegant border border-border animate-scale-in transition-all duration-300",
                      // Adjust overlay positioning based on pin coordinates
                      pin.y > 50 ? "bottom-24" : "bottom-6",
                      pin.x > 50 ? "left-6" : "right-6"
                    )}
                  >
                    <div className="relative h-28 overflow-hidden rounded-lg">
                      <img src={dest.image} alt={dest.name} className="h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <span className="absolute bottom-2 left-2 text-white font-display text-lg font-bold">
                        {dest.name}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-muted-foreground font-sans">
                      {journey ? (
                        <>
                          <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors">
                            <RouteIcon className="h-5 w-5 text-gold mt-0.5 shrink-0" />
                            <div>        </div>
                          </div>
                          <div className="flex justify-between items-center text-[11px] pt-1">
                            <span className="flex items-center gap-1"><Car className="h-3 w-3" /> {journey.distance}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {journey.duration}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-border">
                            <div>
                              <span className="text-[10px] block">Starting from</span>
                              <span className="text-sm font-bold text-primary font-display">{journey.price}</span>
                            </div>
                            <Link
                              to={`/${dest.slug}` as any}
                              className="bg-secondary text-white font-poppins font-semibold px-3 py-1.5 rounded-lg text-[10px] hover:bg-primary transition"
                            >
                              Explore
                            </Link>
                          </div>
                        </>
                      ) : (
                        <p>Road journeys coming soon.</p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Pins layer */}
              {pins.map((p) => {
                const isActive = activePin === p.slug;
                return (
                  <button
                    key={p.slug}
                    onMouseEnter={() => setActivePin(p.slug)}
                    onMouseLeave={() => setActivePin(null)}
                    onClick={() => setActivePin(activePin === p.slug ? null : p.slug)}
                    className="absolute z-20 group -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    {/* Outer pulse */}
                    <span className={cn(
                      "absolute -inset-3 rounded-full bg-gold/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                      isActive && "opacity-100 scale-125 animate-ping"
                    )} />
                    {/* Inner circle */}
                    <span className={cn(
                      "relative grid h-8 w-8 place-items-center rounded-full shadow-soft transition-all duration-300",
                      isActive ? "bg-gold text-white scale-110" : "bg-primary border border-white/40 text-gold"
                    )}>
                      <MapPin className="h-4 w-4" />
                    </span>
                    {/* Tooltip Label */}
                    <span className={cn(
                      "absolute top-full left-1/2 -translate-x-1/2 mt-1.5 bg-black/80 backdrop-blur-sm text-[10px] font-poppins font-bold px-2 py-0.5 rounded whitespace-nowrap opacity-0 transition-opacity pointer-events-none shadow",
                      isActive ? "opacity-100" : "group-hover:opacity-100"
                    )}>
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
}
