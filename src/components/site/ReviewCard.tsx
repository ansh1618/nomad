import { useState } from "react";
import {
  ThumbsUp,
  Share2,
  Flag,
  CheckCircle2,
  GraduationCap,
  Calendar,
  Sparkles,
  Play,
  Heart,
  ShieldCheck,
  Building,
  Bus,
  Utensils,
  Award,
  Trophy,
  Compass,
  Flame,
  MessageCircle,
} from "lucide-react";
import { ReviewStarRating, AspectRatingBar } from "./ReviewStarRating";
import type { Review, ReviewReply } from "@/types/reviews";
import { voteHelpfulReview, reportReview, addReviewReply } from "@/lib/reviews-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface ReviewCardProps {
  review: Review;
  onOpenMedia?: (mediaUrl: string) => void;
  canReply?: boolean;
}

export function ReviewCard({ review, onOpenMedia, canReply = false }: ReviewCardProps) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || review.likes_count || 0);
  const [hasVoted, setHasVoted] = useState(false);
  const [showAspects, setShowAspects] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyInput, setReplyInput] = useState("");
  const [replyRole, setReplyRole] = useState<ReviewReply["role"]>("Nomadik Team");
  const [repliesList, setRepliesList] = useState<ReviewReply[]>(review.replies || []);

  const handleHelpful = async () => {
    if (hasVoted) return;
    setHasVoted(true);
    setHelpfulCount((prev) => prev + 1);
    await voteHelpfulReview(review.id);
    toast.success("Thank you for your helpful vote!");
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Review link copied to clipboard!");
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    await reportReview(review.id, reportReason);
    toast.success("Report submitted for admin moderation.");
    setIsReportOpen(false);
    setReportReason("");
  };

  const handleAddReply = async () => {
    if (!replyInput.trim()) return;
    const authorName =
      replyRole === "Trip Captain"
        ? "Captain Rohit"
        : replyRole === "Operations Team"
          ? "Nomadik Ops"
          : "Nomadik Team";

    const newRep = await addReviewReply(review.id, replyInput, replyRole, authorName);
    setRepliesList((prev) => [...prev, newRep]);
    setReplyInput("");
    setIsReplyOpen(false);
    toast.success(`Reply posted as ${replyRole}!`);
  };

  // Gamification badge styling
  const renderAchievementBadge = (badge: string) => {
    switch (badge) {
      case "first_trip":
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">🚩 First Trip</span>;
      case "explorer":
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><Compass className="h-3 w-3" /> Explorer</span>;
      case "mountain_lover":
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">🏔️ Mountain Lover</span>;
      case "weekend_warrior":
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><Flame className="h-3 w-3" /> Weekend Warrior</span>;
      case "nomadik_legend":
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><Trophy className="h-3 w-3" /> Nomadik Legend</span>;
      default:
        return null;
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E4E2DA] shadow-soft hover:shadow-elegant transition-all duration-300 flex flex-col justify-between space-y-5 font-poppins relative overflow-hidden group"
    >
      {/* Top Banner Accent for Featured Reviews */}
      {review.featured && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-[#C8A96A] text-white text-[9px] uppercase font-bold tracking-widest px-3.5 py-1 rounded-bl-xl shadow-sm flex items-center gap-1 z-10">
          <Sparkles className="h-3 w-3 fill-white" /> Featured Review
        </div>
      )}

      {/* Main Review Content Header */}
      <div className="space-y-4">
        {/* Author Header */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-3.5">
            {/* Avatar */}
            <div className="relative">
              <img
                src={
                  review.avatar_url ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(review.author_name)}`
                }
                alt={review.author_name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#C8A96A]/30 shadow-sm bg-slate-100"
              />
              {(review.verified || review.is_verified) && (
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-500 text-white" />
                </div>
              )}
            </div>

            {/* Author Info & Badges */}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-display font-bold text-base text-[#102A43]">
                  {review.author_name}
                </h4>
                {(review.verified || review.is_verified) && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    Verified Traveler
                  </span>
                )}
                {review.achievement_badges?.map((badge, i) => (
                  <span key={i}>{renderAchievementBadge(badge)}</span>
                ))}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                {review.college && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border">
                    <GraduationCap className="h-3.5 w-3.5 text-accent shrink-0" />
                    {review.college}
                  </span>
                )}
                {review.trip_date && (
                  <span className="flex items-center gap-1 font-medium text-slate-500">
                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                    {review.trip_date}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rating */}
          <div className="text-right shrink-0">
            <ReviewStarRating value={review.overall_rating} size="sm" showValueLabel />
            <button
              type="button"
              onClick={() => setShowAspects(!showAspects)}
              className="text-[10px] font-bold text-accent hover:underline block mt-1 transition-all"
            >
              {showAspects ? "Hide Specs ▲" : "View Specs ▼"}
            </button>
          </div>
        </div>

        {/* Granular Aspect Breakdown */}
        <AnimatePresence>
          {showAspects && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden bg-[#F8F7F3] p-4 rounded-2xl border border-[#E4E2DA] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs"
            >
              <AspectRatingBar
                label="Hotel & Stays"
                rating={review.hotel_rating || 5}
                icon={<Building className="h-3 w-3 text-slate-500" />}
              />
              <AspectRatingBar
                label="Transport"
                rating={review.transport_rating || 5}
                icon={<Bus className="h-3 w-3 text-slate-500" />}
              />
              <AspectRatingBar
                label="Food & Meals"
                rating={review.food_rating || 5}
                icon={<Utensils className="h-3 w-3 text-slate-500" />}
              />
              <AspectRatingBar
                label="Trip Captain"
                rating={review.captain_rating || 5}
                icon={<Award className="h-3 w-3 text-slate-500" />}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review Title & Content */}
        <div className="space-y-2">
          {review.title && (
            <h5 className="font-display font-bold text-lg text-[#102A43] leading-snug">
              "{review.title}"
            </h5>
          )}
          <p className="text-sm text-slate-700 leading-relaxed font-poppins whitespace-pre-wrap">
            {review.review || review.content}
          </p>
        </div>

        {/* Photo & Video Grid */}
        {review.media && review.media.length > 0 && (
          <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            {review.media.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => onOpenMedia?.(item.url)}
                className="relative h-24 w-32 rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer group/img shrink-0 shadow-sm"
              >
                <img
                  src={item.thumbnail || item.url}
                  alt="Traveler memory"
                  className="h-full w-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                />
                {item.type === "video" && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
                      <Play className="h-4 w-4 text-amber-600 fill-amber-600 ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Multi-Role Official Replies */}
        {repliesList.length > 0 && (
          <div className="space-y-2 pt-1">
            {repliesList.map((rep) => (
              <div
                key={rep.id}
                className="bg-[#0F2942]/5 border border-[#0F2942]/15 p-4 rounded-2xl space-y-1.5 text-xs font-poppins"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#0F2942] font-bold">
                    <ShieldCheck className="h-4 w-4 text-[#C8A96A]" />
                    {rep.author_name} ({rep.role})
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(rep.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed italic">
                  "{rep.reply_text}"
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Bar: Helpful Vote, Share, Reply, Report */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-poppins flex-wrap gap-2">
        <button
          type="button"
          onClick={handleHelpful}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all font-bold ${
            hasVoted
              ? "bg-amber-500/15 text-amber-800 border border-amber-500/30"
              : "hover:bg-slate-100 text-slate-700 border border-slate-200"
          }`}
        >
          <ThumbsUp
            className={`h-3.5 w-3.5 ${hasVoted ? "fill-amber-600 text-amber-600" : "text-slate-600"}`}
          />
          <span>👍 Helpful ({helpfulCount})</span>
        </button>

        <div className="flex items-center gap-3">
          {canReply && (
            <button
              type="button"
              onClick={() => setIsReplyOpen(!isReplyOpen)}
              className="flex items-center gap-1 text-accent font-bold hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Reply
            </button>
          )}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors font-medium"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-1 hover:text-red-600 transition-colors text-slate-400 font-medium"
          >
            <Flag className="h-3.5 w-3.5" /> Report
          </button>
        </div>
      </div>

      {/* Reply Box Drawer (for Admin/Captain) */}
      {isReplyOpen && (
        <div className="p-3 bg-slate-50 rounded-2xl border space-y-2 text-xs">
          <div className="flex gap-2">
            <select
              value={replyRole}
              onChange={(e) => setReplyRole(e.target.value as any)}
              className="p-1.5 border rounded-lg bg-white font-bold text-slate-800 text-[11px]"
            >
              <option value="Nomadik Team">Nomadik Team</option>
              <option value="Trip Captain">Trip Captain</option>
              <option value="Operations Team">Operations Team</option>
              <option value="Support Specialist">Support Specialist</option>
            </select>
          </div>
          <textarea
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            placeholder="Write official response..."
            className="w-full p-2.5 border rounded-xl bg-white text-xs h-16 focus:outline-none focus:border-amber-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReplyOpen(false)}
              className="px-3 py-1.5 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddReply}
              className="px-4 py-1.5 bg-[#102A43] text-white rounded-xl font-bold"
            >
              Post Reply
            </button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="font-display font-bold text-lg text-slate-900">
              Report Review
            </h3>
            <p className="text-xs text-slate-600">
              Please specify the reason for reporting this review to our moderation team:
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Inappropriate language, spam, incorrect info..."
              className="w-full p-3 border rounded-xl text-xs font-poppins h-24 focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReport}
                className="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.article>
  );
}
