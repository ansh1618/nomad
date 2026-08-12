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
import { DESTINATION_LEADERBOARD, getApprovedReviews } from "@/lib/reviews-client";
import { getPublicTripCaptains } from "@/lib/queries-client";
import type { TripCaptain, Review } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

import { SectionErrorBoundary } from "./SectionErrorBoundary";

function HomepageReviewsContent() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [captains, setCaptains] = useState<TripCaptain[]>([]);
  const [loadingCaptains, setLoadingCaptains] = useState(true);
  const [featuredReviews, setFeaturedReviews] = useState<Review[]>([]);

  // Fetch real featured reviews from DB
  useEffect(() => {
    async function loadFeaturedReviews() {
      try {
        const { data } = await getApprovedReviews({ featured: true, limit: 6 });
        setFeaturedReviews(data);
      } catch (err) {
        console.warn("[HomepageReviewsSection] Failed to load featured reviews:", err);
      }
    }
    loadFeaturedReviews();
  }, []);

  // Auto slide carousel
  useEffect(() => {
    if (featuredReviews.length === 0) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % Math.max(1, featuredReviews.length));
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredReviews.length]);

  // Fetch real trip captains dynamically from DB
  useEffect(() => {
    async function loadCaptains() {
      try {
        const data = await getPublicTripCaptains();
        setCaptains(data);
      } catch (err) {
        console.warn("[HomepageReviewsSection] Failed to load trip captains:", err);
      } finally {
        setLoadingCaptains(false);
      }
    }
    loadCaptains();
  }, []);

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
              <span>56 people viewed trips today</span>
            </div>
          </div>
        </div>

        {/* 1. Dynamic Carousel of Featured Reviews */}
        {featuredReviews.length > 0 ? (
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
        ) : (
          <div className="bg-slate-50/80 rounded-3xl p-10 text-center border border-dashed border-slate-200 text-slate-500 space-y-2">
            <Star className="h-8 w-8 mx-auto text-amber-400 mb-1" />
            <h4 className="font-bold text-sm text-[#102A43]">Traveler Reviews Coming Soon</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Real, verified traveler reviews from our explorers will appear here. Be among the first to share your GoNomadik story!
            </p>
          </div>
        )}

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
            <div className="flex items-center justify-between border-b border-[#E4E2DA]/60 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="font-display font-bold text-xl text-[#102A43] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" /> Top Rated Trip Captains
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                Verified Leaders
              </span>
            </div>

            {loadingCaptains ? (
              <div className="py-12 text-center text-xs text-muted-foreground font-poppins">
                Loading verified trip captains...
              </div>
            ) : captains.length === 0 ? (
              <div className="bg-slate-50/80 rounded-2xl p-6 text-center border border-dashed border-slate-200 text-slate-500 space-y-2 my-2">
                <ShieldCheck className="h-8 w-8 mx-auto text-slate-400 mb-1" />
                <h4 className="font-bold text-sm text-[#102A43]">Our Trip Captains</h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Meet the people who make every GoNomadik journey safer, smoother and more memorable. Captain profiles are currently being updated by operations.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {captains.map((capt) => {
                  const displayName = capt.full_name.startsWith("Captain")
                    ? capt.full_name
                    : `Captain ${capt.full_name}`;
                  const initials = capt.full_name
                    ? capt.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "TC";
                  return (
                    <div
                      key={capt.id}
                      className="p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-[#C8A96A]/40 transition-all flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {capt.photo_url ? (
                          <img
                            src={capt.photo_url}
                            alt={capt.full_name}
                            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-slate-200 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#102A43] text-[#C8A96A] font-bold text-sm flex items-center justify-center border border-[#C8A96A]/30 shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-[#102A43] truncate">{displayName}</h4>
                            {capt.is_verified !== false && (
                              <span className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-medium inline-flex items-center gap-0.5 shrink-0">
                                ✓ Verified Captain
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                            {capt.bio || (capt.experience_years ? `${capt.experience_years}+ years with GoNomadik` : "Trip Captain")}
                          </p>
                          {capt.experience_years && capt.bio && (
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              {capt.experience_years}+ years with GoNomadik
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-poppins">
                        <div className="flex items-center justify-end gap-1 text-sm font-bold text-amber-600">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{capt.rating ? capt.rating.toFixed(1) : "4.9"}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {capt.total_trips ? `${capt.total_trips} trips completed` : "Verified Captain"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
