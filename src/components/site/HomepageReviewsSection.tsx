import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Star,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Users,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Flame,
} from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { ReviewStarRating } from "./ReviewStarRating";
import { SEED_REVIEWS, CAPTAIN_LEADERBOARD, DESTINATION_LEADERBOARD } from "@/lib/reviews-client";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

import { SectionErrorBoundary } from "./SectionErrorBoundary";

function HomepageReviewsContent() {
  const [activeSlide, setActiveSlide] = useState(0);
  const featuredReviews = SEED_REVIEWS.filter((r) => r.featured || r.is_featured);

  // Auto slide carousel
  useEffect(() => {
    if (featuredReviews.length === 0) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % Math.max(1, featuredReviews.length));
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredReviews.length]);

  return (
    <section className="py-20 bg-gradient-to-b from-[#F8F7F3] via-white to-[#F8F7F3] font-poppins relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 space-y-12">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C8A96A] bg-[#C8A96A]/10 px-3 py-1 rounded-full border border-[#C8A96A]/20">
            AUTHENTIC COMMUNITY REVIEWS
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-bold text-[#102A43] tracking-tight">
            Loved by 1,200+ Verified Travelers
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            From sunrise hikes at Tungnath to golden hour cruises in Udaipur, read real unedited stories from college & road trip explorers.
          </p>

          {/* Social Proof Ticker */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>56 people viewed trips today · Recently booked by Rahul (NSUT) 2 mins ago</span>
            </div>
          </div>
        </div>

        {/* 1. Dynamic Carousel of Featured Reviews */}
        <div className="relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {featuredReviews.map((rev) => (
                <div key={rev.id} className="w-full shrink-0 px-2">
                  <div className="max-w-3xl mx-auto">
                    <ReviewCard review={rev} />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Controls */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              type="button"
              onClick={() =>
                setActiveSlide((prev) => (prev - 1 + featuredReviews.length) % featuredReviews.length)
              }
              className="p-3 rounded-full bg-white border border-slate-200 shadow-md hover:bg-slate-50 transition-all text-slate-700"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {featuredReviews.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveSlide(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    activeSlide === i ? "w-8 bg-[#102A43]" : "w-2.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev + 1) % featuredReviews.length)}
              className="p-3 rounded-full bg-white border border-slate-200 shadow-md hover:bg-slate-50 transition-all text-slate-700"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 2. Leaderboards Grid (Top Destinations & Top Captains) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch pt-6">
          {/* Top Rated Destinations Leaderboard */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4E2DA] shadow-soft space-y-4 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display font-bold text-xl text-[#102A43] flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Top Rated Destinations
              </h3>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Community Rank
              </span>
            </div>

            <div className="space-y-3">
              {DESTINATION_LEADERBOARD.map((item) => (
                <Link
                  key={item.slug}
                  to={`/destinations/${item.slug}` as any}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#102A43] text-white font-bold text-xs flex items-center justify-center font-display">
                      #{item.rank}
                    </span>
                    <img
                      src={item.cover_image}
                      alt={item.name}
                      className="w-12 h-12 rounded-xl object-cover border"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#102A43] group-hover:text-amber-700 transition-colors">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-muted-foreground">
                        {item.reviews_count}+ Traveler Reviews
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-600 block">
                      {item.rating} ★
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Rated Trip Captains Leaderboard */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4E2DA] shadow-soft space-y-4 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display font-bold text-xl text-[#102A43] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Top Rated Trip Captains
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Verified Leaders
              </span>
            </div>

            <div className="space-y-3">
              {CAPTAIN_LEADERBOARD.map((capt) => (
                <div
                  key={capt.name}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={capt.avatar}
                      alt={capt.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/30"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-[#102A43]">{capt.name}</h4>
                      <span className="text-[10px] text-emerald-700 font-semibold block">
                        {capt.top_compliment}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-bold text-amber-600 block">
                      {capt.rating} ★
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {capt.trips_count} Trips Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Final Conversion CTA Banner */}
        <div className="bg-gradient-to-r from-[#102A43] via-[#1A365D] to-[#0F2942] rounded-3xl p-8 sm:p-12 text-white text-center space-y-5 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#C8A96A]">
              YOUR ADVENTURE AWAITS
            </span>
            <h3 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Ready to Create Your Own Story?
            </h3>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed font-poppins">
              Join 1,200+ explorers on curated road trips across Himalayan valleys, desert palaces, and serene lakes.
            </p>

            <div className="pt-3 flex justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-[#C8A96A] text-slate-950 hover:opacity-95 font-bold text-sm px-8 py-6 rounded-2xl shadow-xl transition-all flex items-center gap-2"
                asChild
              >
                <Link to="/journeys" className="flex items-center gap-2">
                  Book Your Next Adventure <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomepageReviewsSection() {
  return (
    <SectionErrorBoundary fallbackTitle="Community Reviews Unavailable" fallbackMessage="Traveler reviews are temporarily unavailable right now. The rest of the page remains fully active.">
      <HomepageReviewsContent />
    </SectionErrorBoundary>
  );
}
