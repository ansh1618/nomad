import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { Star, ShieldCheck, Compass, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero.jpg";
import { getCmsSection, getHeroSlides } from "@/lib/queries/cms";

export function Hero() {
  const { data: section } = useQuery({
    queryKey: ["cms", "hero"],
    queryFn: () => getCmsSection("hero"),
    staleTime: 1000,
  });

  const { data: slides = [] } = useQuery({
    queryKey: ["hero_slides"],
    queryFn: getHeroSlides,
    staleTime: 1000,
  });

  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Auto-scroll slider if active
  const content = section?.content as any;
  const bgType = content?.bg_type || "video";

  useEffect(() => {
    if (bgType !== "slider" || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [bgType, slides.length]);

  const handleNextSlide = () => {
    if (slides.length > 0) {
      setCurrentSlideIdx((prev) => (prev + 1) % slides.length);
    }
  };

  const handlePrevSlide = () => {
    if (slides.length > 0) {
      setCurrentSlideIdx((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  const title = section?.title || "Some Roads Change You Forever.";
  const subtitle = section?.subtitle || "Explore India's most breathtaking roads with expertly planned group trips, weekend escapes and unforgettable adventures.";
  const badgeText = content?.badge_text || "Curated Road Trips";
  const ctaPrimaryLabel = content?.cta_primary_label || "Explore Trips";
  const ctaPrimaryHref = content?.cta_primary_href || "/destinations";
  const ctaSecondaryLabel = content?.cta_secondary_label || "Upcoming Departures";
  const ctaSecondaryHref = content?.cta_secondary_href || "/destinations";
  const statsBadges = content?.stats_badges || [
    { icon: "⭐", text: "500+ Happy Travellers" },
    { icon: "🏔", text: "15+ Destinations" },
    { icon: "🚌", text: "Weekly Departures" },
    { icon: "⭐", text: "Rated 4.9/5" }
  ];

  // Render Background
  const renderBackground = () => {
    if (bgType === "slider" && slides.length > 0) {
      const currentSlide = slides[currentSlideIdx];
      return (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            {currentSlide.media_type === "video" ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              >
                <source src={currentSlide.media_url} type="video/mp4" />
              </video>
            ) : (
              <img
                src={currentSlide.media_url}
                alt={currentSlide.title}
                className="h-full w-full object-cover"
              />
            )}
            <div 
              className="absolute inset-0 bg-black" 
              style={{ opacity: currentSlide.overlay_opacity ?? 0.5 }} 
            />
          </motion.div>
        </AnimatePresence>
      );
    }

    if (bgType === "video") {
      const videoUrl = content?.video_url || "https://assets.mixkit.co/videos/preview/mixkit-camper-driving-on-a-mountain-road-42289-large.mp4";
      return (
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover scale-105"
            poster={heroImg}
          >
            <source src={videoUrl} type="video/mp4" />
            <img
              src={heroImg}
              alt="Cinematic Himalayan road trip caravan"
              className="h-full w-full object-cover"
            />
          </video>
        </div>
      );
    }

    // Static Image mode
    const imageUrl = section?.media_url || heroImg;
    return (
      <div className="absolute inset-0 z-0">
        <img
          src={imageUrl}
          alt="Cinematic Himalayan road trip caravan"
          className="h-full w-full object-cover"
        />
      </div>
    );
  };

  // Determine slide specific content if in slider mode
  const activeSlide = bgType === "slider" && slides.length > 0 ? slides[currentSlideIdx] : null;
  const currentTitle = activeSlide ? activeSlide.title : title;
  const currentSubtitle = activeSlide ? activeSlide.subtitle : subtitle;
  const currentCtaLabel = activeSlide ? activeSlide.cta_label : ctaPrimaryLabel;
  const currentCtaHref = activeSlide ? activeSlide.cta_href : ctaPrimaryHref;

  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden">
      {renderBackground()}

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
            {badgeText}
          </span>

          {/* Title */}
          <h1 className="font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            {currentTitle.includes("Forever") ? (
              <>
                Some Roads <br />
                <span className="text-gradient-gold">Change You Forever.</span>
              </>
            ) : (
              currentTitle
            )}
          </h1>

          {/* Description */}
          <p className="max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
            {currentSubtitle}
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col gap-4 sm:flex-row">
            <Button size="xl" variant="hero" asChild>
              <Link to={currentCtaHref as any}>{currentCtaLabel}</Link>
            </Button>
            {activeSlide?.cta2_label ? (
              <Button size="xl" variant="outlineLight" asChild>
                <Link to={activeSlide.cta2_href as any}>{activeSlide.cta2_label}</Link>
              </Button>
            ) : (
              <Button size="xl" variant="outlineLight" asChild>
                <Link to={ctaSecondaryHref as any}>{ctaSecondaryLabel}</Link>
              </Button>
            )}
          </div>

          {/* Business stats indicators below hero buttons */}
          <div className="pt-8 border-t border-white/10 mt-12 flex flex-wrap gap-x-8 gap-y-3 text-white">
            {statsBadges.map((badge: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-gold text-lg">{badge.icon}</span>
                <span className="text-sm font-poppins font-bold">{badge.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Down arrow indicator */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-white/40 p-1.5">
          <div className="h-2 w-1 animate-float rounded-full bg-white/70" />
        </div>
      </div>

      {/* Slider controls if in slider mode */}
      {bgType === "slider" && slides.length > 1 && (
        <div className="absolute right-8 bottom-8 flex gap-2 z-10">
          <button
            onClick={handlePrevSlide}
            className="p-2 rounded-full border border-white/20 hover:border-white/50 text-white/75 hover:text-white bg-black/25 backdrop-blur-sm transition-all"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextSlide}
            className="p-2 rounded-full border border-white/20 hover:border-white/50 text-white/75 hover:text-white bg-black/25 backdrop-blur-sm transition-all"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
}

