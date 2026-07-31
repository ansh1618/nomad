import { useState } from "react";
import {
  Star,
  ShieldCheck,
  Building,
  Bus,
  Utensils,
  Award,
  Sparkles,
  Users,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { ReviewStarRating, AspectRatingBar } from "./ReviewStarRating";
import type { ReviewRatingStats, AISummaryData } from "@/types/reviews";
import { getAISummary } from "@/lib/reviews-client";

interface ReviewSummaryHeaderProps {
  stats: ReviewRatingStats;
  journeyOrDestName?: string;
  onOpenWriteReview?: () => void;
  onFilterCollege?: (college: string | null) => void;
  activeCollege?: string | null;
}

export function ReviewSummaryHeader({
  stats,
  journeyOrDestName,
  onOpenWriteReview,
  onFilterCollege,
  activeCollege,
}: ReviewSummaryHeaderProps) {
  const aiSummary = getAISummary(journeyOrDestName);
  const [showAiCard, setShowAiCard] = useState(true);

  const collegesList = ["NSUT", "DTU", "IIT Delhi", "DU", "BPIT", "IPU"];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E4E2DA] shadow-soft space-y-7 font-poppins text-left">
      {/* 1. Dynamic Trust Score Top Banner */}
      <div className="bg-gradient-to-r from-[#102A43] via-[#1A365D] to-[#0F2942] rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-center gap-5">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0">
            <span className="text-3xl sm:text-4xl font-display font-bold text-amber-400 block">
              {stats.average}
            </span>
            <div className="flex justify-center my-1">
              <ReviewStarRating value={stats.average} size="sm" />
            </div>
            <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold block">
              Overall Score
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-white font-display">
                Loved by {stats.verified_trips_count.toLocaleString("en-IN")}+ Verified Travelers
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> 100% Authentic
              </span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed max-w-xl">
              Based on completed road trip bookings with verified hotel stays, transport comfort, and safety captain assurances.
            </p>
          </div>
        </div>

        {/* Action Button */}
        {onOpenWriteReview && (
          <button
            type="button"
            onClick={onOpenWriteReview}
            className="shrink-0 bg-gradient-to-r from-amber-500 to-[#C8A96A] text-slate-950 hover:opacity-95 font-bold text-xs px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4 fill-slate-950" /> Write a Review
          </button>
        )}
      </div>

      {/* 2. Key Metrics Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-0.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
            Verified Trips
          </span>
          <span className="text-lg font-bold text-[#102A43] font-display">
            {stats.verified_trips_count.toLocaleString("en-IN")}+
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-center space-y-0.5">
          <span className="text-xs font-bold text-emerald-900/60 uppercase tracking-wider block text-[10px]">
            Would Travel Again
          </span>
          <span className="text-lg font-bold text-emerald-900 font-display">
            {stats.recommendation_rate}%
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200/60 text-center space-y-0.5">
          <span className="text-xs font-bold text-sky-900/60 uppercase tracking-wider block text-[10px]">
            Safe For Solo Travelers
          </span>
          <span className="text-lg font-bold text-sky-900 font-display">
            {stats.solo_safety_rate}%
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-center space-y-0.5">
          <span className="text-xs font-bold text-amber-900/60 uppercase tracking-wider block text-[10px]">
            Avg Captain Rating
          </span>
          <span className="text-lg font-bold text-amber-900 font-display">
            {stats.aspects.captain} / 5.0
          </span>
        </div>
      </div>

      {/* 3. Rating Distribution & Aspect Averages */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1 border-t border-[#E4E2DA]">
        {/* Rating Breakdown Bars */}
        <div className="md:col-span-5 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Rating Distribution
          </h4>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star as keyof typeof stats.distribution] || 0;
            const pct = Math.round((count / Math.max(1, stats.total_reviews)) * 100);
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-8 font-semibold text-slate-600 shrink-0">{star} ★</span>
                <div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden border">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right font-medium text-slate-500 shrink-0">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        {/* Aspect Scores */}
        <div className="md:col-span-7 grid grid-cols-2 gap-4 border-l border-[#E4E2DA] md:pl-6">
          <AspectRatingBar
            label="Hotel & Stays"
            rating={stats.aspects.hotel}
            icon={<Building className="h-3.5 w-3.5 text-slate-500" />}
          />
          <AspectRatingBar
            label="Transport & AC"
            rating={stats.aspects.transport}
            icon={<Bus className="h-3.5 w-3.5 text-slate-500" />}
          />
          <AspectRatingBar
            label="Food & Meals"
            rating={stats.aspects.food}
            icon={<Utensils className="h-3.5 w-3.5 text-slate-500" />}
          />
          <AspectRatingBar
            label="Trip Captain"
            rating={stats.aspects.captain}
            icon={<Award className="h-3.5 w-3.5 text-slate-500" />}
          />
          <AspectRatingBar
            label="Safety & Security"
            rating={stats.aspects.safety}
            icon={<ShieldCheck className="h-3.5 w-3.5 text-slate-500" />}
          />
          <AspectRatingBar
            label="Value for Money"
            rating={stats.aspects.value}
            icon={<Sparkles className="h-3.5 w-3.5 text-slate-500" />}
          />
        </div>
      </div>

      {/* 4. AI Review Summary Card */}
      {showAiCard && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-2xl border border-amber-500/20 space-y-3 font-poppins relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-600 fill-amber-600" /> AI Review Summary
            </span>
            <button
              type="button"
              onClick={() => setShowAiCard(false)}
              className="text-[10px] text-muted-foreground hover:underline"
            >
              Dismiss
            </button>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            "{aiSummary.summary_paragraph}"
          </p>

          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Travelers Loved:
            </span>
            {aiSummary.most_mentioned_keywords.map((kw, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold text-amber-900 bg-white border border-amber-300/80 px-2.5 py-0.5 rounded-full shadow-2xs"
              >
                ✓ {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Campus & College Filter Chips */}
      {onFilterCollege && (
        <div className="space-y-2 pt-1 border-t border-[#E4E2DA]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Filter by College Community:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onFilterCollege(null)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeCollege === null
                  ? "bg-[#102A43] text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Colleges
            </button>
            {collegesList.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => onFilterCollege(activeCollege === col ? null : col)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  activeCollege === col
                    ? "bg-[#102A43] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                🎓 {col}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
