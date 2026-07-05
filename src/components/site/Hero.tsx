import { motion } from "motion/react";
import { Star, ShieldCheck, Compass, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerNomadikPlanner } from "./TripPlannerDialog";
import heroImg from "@/assets/hero.jpg";

export function Hero() {
  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden">
      {/* Background Video with Poster Fallback */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover scale-105"
          poster={heroImg}
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-camper-driving-on-a-mountain-road-42289-large.mp4"
            type="video/mp4"
          />
          {/* Native fallback img */}
          <img
            src={heroImg}
            alt="Cinematic Himalayan road trip caravan"
            className="h-full w-full object-cover"
          />
        </video>
      </div>

      {/* Dark overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/75 via-primary/45 to-primary/80" />
      <div className="absolute inset-0 bg-black/20" />

      {/* Content wrapper */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl space-y-6"
        >
          {/* Upper badge */}
          <span className="glass-dark inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-poppins font-semibold uppercase tracking-widest text-white shadow-soft">
            <Compass className="h-4 w-4 text-gold animate-spin-slow" />
            Curated Road Trips
          </span>

          {/* Title */}
          <h1 className="font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            Some Roads <br />
            <span className="text-gradient-gold">Change You Forever.</span>
          </h1>

          {/* Description */}
          <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            Explore India's most breathtaking roads with expertly planned group trips, weekend
            escapes and unforgettable adventures.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col gap-4 sm:flex-row">
            <Button size="xl" variant="hero" asChild>
              <a href="#packages">Start Exploring</a>
            </Button>
            <Button size="xl" variant="outlineLight" onClick={() => triggerNomadikPlanner()}>
              Plan My Trip
            </Button>
          </div>

          {/* Trusted Partners Banner */}
          <div className="pt-8 border-t border-white/10 mt-12 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <span className="text-xs font-poppins font-bold tracking-wide">
                Trusted by 5000+ Explorers
              </span>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/70 text-xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" /> Google Reviews
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" /> Instagram Stories
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" /> WhatsApp Community
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" /> Verified Hotels
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-gold shrink-0" /> Local Guides
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Down arrow indicator */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/40 p-1.5">
          <div className="h-2 w-1 animate-float rounded-full bg-white/70" />
        </div>
      </div>
    </section>
  );
}
