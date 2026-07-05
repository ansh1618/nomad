import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, Clock, MapPin, Compass, Car, Utensils, Hotel, Check, X, ShieldAlert, ArrowLeft, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { triggerNomadikPlanner } from "./TripPlannerDialog";
import { cn } from "@/lib/utils";
import { useLoaderData } from "@tanstack/react-router";

interface JourneyDetailTemplateProps {
  slug: string;
}

export function JourneyDetailTemplate({ slug }: JourneyDetailTemplateProps) {
  const { journey } = useLoaderData({ strict: false }) as any;
  const [activeDay, setActiveDay] = useState<number>(1);

  if (!journey) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-5 text-center">
        <div>
          <h1 className="text-4xl font-display font-bold">Journey Not Found</h1>
          <p className="mt-2 text-muted-foreground">The road trip path you seek has not been drawn yet.</p>
          <Link to="/" className="mt-6 inline-block bg-primary text-white font-semibold px-6 py-2.5 rounded-xl">
            Go back Home
          </Link>
        </div>
      </div>
    );
  }

  const seatsLeft = journey.remainingSeats ?? journey.maxCapacity ?? 0;

  return (
    <div className="bg-background min-h-screen text-foreground font-sans">
      
      {/* 1. Header Banner */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={journey.image}
            alt={journey.name}
            className="w-full h-full object-cover scale-105 animate-[zoom-slow_20s_ease-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/40 to-background" />
        </div>

        <div className="relative z-10 text-center px-5 max-w-4xl space-y-6 pt-20">
          <Reveal>
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-poppins font-bold uppercase tracking-wider text-gold hover:text-white transition">
              <ArrowLeft className="h-4 w-4" /> Back to Journeys
            </Link>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="font-display text-4xl font-bold text-white sm:text-6xl leading-tight">
              {journey.name}
            </h1>
          </Reveal>
          {/* Seats Ticker */}
          <Reveal delay={2} className="flex justify-center">
            <div className="glass-dark inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-poppins font-semibold text-white animate-pulse">
              <span className="h-2 w-2 rounded-full bg-[#E53E3E]" />
              Limited Group: {journey.maxCapacity} Seats · Only {seatsLeft} Left!
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. Fast Specs Row */}
      <section className="bg-white border-b border-border py-6 shadow-soft">
        <div className="max-w-7xl mx-auto px-5 grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Duration</span>
            <span className="font-poppins font-bold text-sm text-primary flex items-center justify-center gap-1"><Clock className="h-4 w-4 text-accent" /> {journey.duration}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Road Distance</span>
            <span className="font-poppins font-bold text-sm text-primary flex items-center justify-center gap-1"><Car className="h-4 w-4 text-accent" /> {journey.distance}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Difficulty</span>
            <span className="font-poppins font-bold text-sm text-primary flex items-center justify-center gap-1"><Compass className="h-4 w-4 text-accent" /> {journey.difficulty}</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Group Size</span>
            <span className="font-poppins font-bold text-sm text-primary flex items-center justify-center gap-1"><Users className="h-4 w-4 text-accent" /> {journey.groupSize}</span>
          </div>
          <div className="col-span-2 md:col-span-1 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">Best Season</span>
            <span className="font-poppins font-bold text-sm text-accent flex items-center justify-center gap-1"><Calendar className="h-4 w-4" /> {journey.bestSeason}</span>
          </div>
        </div>
      </section>

      {/* 3. Main Split Layout */}
      <section className="max-w-7xl mx-auto px-5 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Itinerary Portal */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Overview */}
          <Reveal className="space-y-4">
            <h3 className="font-display text-2xl font-bold text-primary">Overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {journey.overview}
            </p>
          </Reveal>

          {/* Highlights */}
          <Reveal className="space-y-4">
            <h3 className="font-display text-2xl font-bold text-primary">Experience Highlights</h3>
            <ul className="space-y-3">
              {journey.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground/80 leading-relaxed">
                  <Check className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Day-Wise Route Itinerary */}
          <Reveal className="space-y-6">
            <h3 className="font-display text-2xl font-bold text-primary">Day-Wise Plan</h3>
            
            {/* Tabs Row */}
            <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto">
              {journey.dayByDay.map((d) => (
                <button
                  key={d.day}
                  onClick={() => setActiveDay(d.day)}
                  className={cn(
                    "px-4 py-2 text-xs font-poppins font-semibold uppercase tracking-wider rounded-lg transition-colors shrink-0",
                    activeDay === d.day
                      ? "bg-secondary text-white"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  )}
                >
                  Day {d.day}
                </button>
              ))}
            </div>

            {/* Active Day Card */}
            {journey.dayByDay.map((d) => {
              if (d.day !== activeDay) return null;
              return (
                <div key={d.day} className="bg-white border border-border rounded-2xl p-6 shadow-soft space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded bg-gold-gradient text-gold-foreground font-poppins text-xs font-bold">
                      {d.day}
                    </span>
                    <h4 className="font-display text-xl font-bold text-primary">{d.title}</h4>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                    {d.description}
                  </p>
                </div>
              );
            })}
          </Reveal>

          {/* Stays, Meals, & Transport */}
          <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="bg-white border border-border p-5 rounded-2xl shadow-soft flex gap-4">
              <Hotel className="h-6 w-6 text-accent shrink-0" />
              <div>
                <h4 className="font-poppins font-bold text-sm">Stay</h4>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{journey.stayInfo}</p>
              </div>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl shadow-soft flex gap-4">
              <Utensils className="h-6 w-6 text-accent shrink-0" />
              <div>
                <h4 className="font-poppins font-bold text-sm">Meals</h4>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{journey.foodInfo}</p>
              </div>
            </div>
            <div className="bg-white border border-border p-5 rounded-2xl shadow-soft flex gap-4">
              <Car className="h-6 w-6 text-accent shrink-0" />
              <div>
                <h4 className="font-poppins font-bold text-sm">Transport</h4>
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{journey.transportDetails}</p>
              </div>
            </div>
          </Reveal>

          {/* Inclusions & Exclusions */}
          <Reveal className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-border p-6 rounded-3xl shadow-soft space-y-4">
              <h4 className="font-display text-lg font-bold text-secondary">What's Included</h4>
              <ul className="space-y-3">
                {journey.inclusions.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-xs text-foreground/80 leading-relaxed">
                    <Check className="h-4.5 w-4.5 text-secondary shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-border p-6 rounded-3xl shadow-soft space-y-4">
              <h4 className="font-display text-lg font-bold text-[#E53E3E]">What's Excluded</h4>
              <ul className="space-y-3">
                {journey.exclusions.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-xs text-foreground/80 leading-relaxed">
                    <X className="h-4.5 w-4.5 text-[#E53E3E] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Packing List */}
          <Reveal className="bg-muted/40 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <ShieldAlert className="h-5 w-5 text-accent" />
              <h4 className="font-display text-lg font-bold">Explorer Packing Checklist</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {journey.packingList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {item}
                </div>
              ))}
            </div>
          </Reveal>

        </div>

        {/* Right Sticky Booking Card */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6 self-start">
          <Reveal className="bg-primary text-white p-6 rounded-3xl shadow-elegant space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            
            <div>
              <span className="text-[10px] text-white/50 uppercase tracking-wider block">Price per Explorer</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-display text-4xl font-bold text-white">{journey.price}</span>
                <span className="text-xs text-white/60">/ Person</span>
              </div>
              <span className="text-[10px] text-white/40 block mt-1">(Inclusive of taxes, stays & meals)</span>
            </div>

            {/* Route specifics */}
            <div className="space-y-3 border-t border-white/10 pt-4 text-xs font-sans text-white/80">
              <div className="flex justify-between">
                <span>Pickup:</span>
                <span className="font-semibold text-white text-right">{journey.pickupPoint.split(" at ")[0]}</span>
              </div>
              <div className="flex justify-between">
                <span>Dropoff:</span>
                <span className="font-semibold text-white text-right">{journey.dropPoint.split(" by ")[0]}</span>
              </div>
            </div>

            <Link to="/book/$journeyId" params={{ journeyId: journey.slug }} className="w-full h-12 text-sm bg-gold text-gold-foreground font-poppins font-semibold shadow-gold hover:brightness-105 transition flex items-center justify-center rounded-md">
              Start Your Journey
            </Link>
          </Reveal>
        </div>

      </section>

    </div>
  );
}
