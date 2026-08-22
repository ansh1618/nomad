import { useState, useEffect } from "react";
import {
  Sparkles,
  Search,
  Filter,
  SlidersHorizontal,
  Compass,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
} from "lucide-react";
import { ReviewSummaryHeader } from "./ReviewSummaryHeader";
import { ReviewCard } from "./ReviewCard";
import { ReviewFormModal } from "./ReviewFormModal";
import type { Review, ReviewFilterState, ReviewRatingStats } from "@/types/reviews";
import { getApprovedReviews } from "@/lib/reviews-client";
import { motion, AnimatePresence } from "motion/react";
import { UniversalLightboxModal } from "./UniversalLightboxModal";

interface ReviewsSectionProps {
  journeyId?: string;
  destinationId?: string;
  journeyName?: string;
  className?: string;
}

export function ReviewsSection({
  journeyId,
  destinationId,
  journeyName,
  className,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ReviewRatingStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [sort, setSort] = useState<ReviewFilterState["sort"]>("newest");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [mediaOnly, setMediaOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Modals & Lightbox
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [lightboxMediaUrl, setLightboxMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [journeyId, destinationId, sort, ratingFilter, mediaOnly, verifiedOnly, searchQuery, page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await getApprovedReviews({
        journeyId,
        destinationId,
        sort,
        ratingFilter,
        mediaOnly,
        verifiedOnly,
        searchQuery,
        page,
        limit: 8,
      });

      setReviews(res.data);
      setTotal(res.total);
      setStats(res.stats);
    } catch (e) {
      console.error("[ReviewsSection] Error loading reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`space-y-8 font-poppins text-left ${className || ""}`}>
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#C8A96A]">
            VERIFIED TRAVELER VOICES
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#102A43] mt-1">
            What Previous Travelers Say
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            Real stories, unedited photos, and aspect ratings from verified Nomadik road trip explorers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsWriteModalOpen(true)}
          className="shrink-0 bg-gradient-to-r from-amber-500 to-[#C8A96A] text-slate-950 font-bold text-xs px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          <MessageSquarePlus className="h-4 w-4 fill-slate-950" /> Leave a Review
        </button>
      </div>

      {/* 1. Review Summary Header with Dynamic Trust Score Banner */}
      {stats && (
        <ReviewSummaryHeader
          stats={stats}
          journeyOrDestName={journeyName}
          onOpenWriteReview={() => setIsWriteModalOpen(true)}
        />
      )}

      {/* 2. Controls & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E4E2DA] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search reviews (e.g. captain, hotel, bonfire, NSUT)..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-xs font-poppins focus:outline-none focus:border-amber-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-medium">
          {/* Rating filter */}
          <select
            value={ratingFilter || ""}
            onChange={(e) => {
              setRatingFilter(e.target.value ? Number(e.target.value) : null);
              setPage(1);
            }}
            className="p-2.5 border rounded-xl bg-slate-50 font-bold text-slate-700 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars Only ⭐⭐⭐⭐⭐</option>
            <option value="4">4 Stars & Above ⭐⭐⭐⭐</option>
          </select>

          {/* Sort selection */}
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as any);
              setPage(1);
            }}
            className="p-2.5 border rounded-xl bg-slate-50 font-bold text-slate-700 text-xs focus:outline-none focus:border-amber-500"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="highest">Sort: Highest Rated</option>
            <option value="lowest">Sort: Lowest Rated</option>
            <option value="featured">Sort: Featured First</option>
            <option value="with_media">Sort: With Photos & Videos</option>
          </select>

          {/* Media Only Toggle */}
          <button
            type="button"
            onClick={() => {
              setMediaOnly(!mediaOnly);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              mediaOnly
                ? "bg-[#102A43] text-white border-[#102A43]"
                : "bg-slate-50 text-slate-600 border-slate-200"
            }`}
          >
            📷 With Photos Only
          </button>
        </div>
      </div>

      {/* 3. Review Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-3xl p-6 border border-slate-200 h-64 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-3 w-20 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        /* Luxury Empty State */
        <div className="bg-white border border-[#E4E2DA] rounded-3xl p-12 text-center shadow-soft space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Compass className="h-8 w-8 animate-pulse" />
          </div>
          <h3 className="font-display font-bold text-2xl text-[#102A43]">
            Be the First Traveler to Share Your Adventure!
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No matching reviews found for your current filter query. Share your experience and inspire fellow college explorers.
          </p>
          <button
            type="button"
            onClick={() => setIsWriteModalOpen(true)}
            className="px-6 py-2.5 bg-[#102A43] text-white font-bold text-xs rounded-xl shadow-soft"
          >
            Write the First Review ✨
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {reviews.map((rev) => (
            <ReviewCard
              key={rev.id}
              review={rev}
              onOpenMedia={(url) => setLightboxMediaUrl(url)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 8 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2.5 rounded-xl border bg-white disabled:opacity-40 text-xs font-bold"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-700">
            Page {page} of {Math.ceil(total / 8)}
          </span>
          <button
            type="button"
            disabled={page >= Math.ceil(total / 8)}
            onClick={() => setPage((p) => p + 1)}
            className="p-2.5 rounded-xl border bg-white disabled:opacity-40 text-xs font-bold"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Review Submission Modal */}
      <ReviewFormModal
        open={isWriteModalOpen}
        onOpenChange={setIsWriteModalOpen}
        journeyId={journeyId || "general"}
        destinationId={destinationId}
        journeyName={journeyName}
        onSuccess={() => fetchReviews()}
      />

      {/* Media Lightbox */}
      <UniversalLightboxModal
        isOpen={!!lightboxMediaUrl}
        onClose={() => setLightboxMediaUrl(null)}
        images={lightboxMediaUrl ? [lightboxMediaUrl] : []}
        title="Traveler Review Photo"
      />
    </section>
  );
}
