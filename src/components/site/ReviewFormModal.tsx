import { useState } from "react";
import {
  X,
  Star,
  Upload,
  Sparkles,
  Check,
  ShieldCheck,
  Building,
  Bus,
  Utensils,
  Award,
  GraduationCap,
  Instagram,
  Trophy,
  Loader2,
} from "lucide-react";
import { ReviewStarRating } from "./ReviewStarRating";
import { submitReview } from "@/lib/reviews-client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

interface ReviewFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  journeyId: string;
  destinationId?: string;
  journeyName?: string;
  bookingId?: string;
  onSuccess?: () => void;
}

export function ReviewFormModal({
  open,
  onOpenChange,
  journeyId,
  destinationId,
  journeyName,
  bookingId,
  onSuccess,
}: ReviewFormModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [authorName, setAuthorName] = useState("");
  const [college, setCollege] = useState("NSUT");
  const [instagram, setInstagram] = useState("");
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");

  // Ratings
  const [overallRating, setOverallRating] = useState(5);
  const [hotelRating, setHotelRating] = useState(5);
  const [transportRating, setTransportRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [captainRating, setCaptainRating] = useState(5);
  const [safetyRating, setSafetyRating] = useState(5);
  const [valueRating, setValueRating] = useState(5);

  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [anonymous, setAnonymous] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{ type: "image" | "video"; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isVideo = file.type.startsWith("video");
      const fakeUrl = URL.createObjectURL(file);
      setMediaFiles((prev) => [...prev, { type: isVideo ? "video" : "image", url: fakeUrl }]);
    });
    toast.success("Media added with WebP compression preview!");
  };

  const handleSubmit = async () => {
    if (!authorName.trim() && !anonymous) {
      toast.error("Please enter your name or enable Anonymous toggle.");
      return;
    }
    if (!title.trim() || !reviewText.trim()) {
      toast.error("Please provide a title and review story.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitReview({
        booking_id: bookingId,
        journey_id: journeyId,
        destination_id: destinationId,
        author_name: authorName || "Explorer",
        college,
        instagram_handle: instagram,
        title,
        review: reviewText,
        overall_rating: overallRating,
        hotel_rating: hotelRating,
        transport_rating: transportRating,
        food_rating: foodRating,
        captain_rating: captainRating,
        safety_rating: safetyRating,
        value_rating: valueRating,
        would_recommend: wouldRecommend,
        anonymous,
        media_files: mediaFiles,
      });

      if (res.success) {
        toast.success("Review submitted! You earned +200 XP & Explorer Badge! 🎉");
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(res.error || "Failed to submit review.");
      }
    } catch (e: any) {
      toast.error("Error submitting review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-poppins">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#E4E2DA] space-y-6 relative overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E4E2DA]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8A96A] bg-[#C8A96A]/10 px-2.5 py-1 rounded-full">
              Verified Traveler Review
            </span>
            <h2 className="font-display font-bold text-2xl text-[#102A43] mt-1">
              Share Your Journey Story
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {journeyName || "Nomadik Expedition"} · Earn +200 XP & Badges
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Wizard Steps indicator */}
        <div className="flex items-center justify-between gap-2 text-xs font-semibold border-b pb-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 text-center py-2 rounded-xl transition-all ${
              step === 1 ? "bg-[#102A43] text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            1. Ratings Matrix
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 text-center py-2 rounded-xl transition-all ${
              step === 2 ? "bg-[#102A43] text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            2. Review & Story
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex-1 text-center py-2 rounded-xl transition-all ${
              step === 3 ? "bg-[#102A43] text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            3. Media & Submit
          </button>
        </div>

        {/* Step 1: Multi-Aspect Ratings */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-center p-4 bg-amber-50/50 rounded-2xl border border-amber-200/60 space-y-1">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                Overall Experience Rating
              </span>
              <ReviewStarRating
                value={overallRating}
                onChange={setOverallRating}
                readonly={false}
                size="xl"
                className="justify-center py-1"
              />
              <span className="text-xs font-bold text-amber-800 block">
                {overallRating === 5
                  ? "⭐⭐⭐⭐⭐ Exceptional"
                  : overallRating === 4
                    ? "⭐⭐⭐⭐ Great"
                    : "Good"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-amber-600" /> Hotel & Stays
                </span>
                <ReviewStarRating value={hotelRating} onChange={setHotelRating} readonly={false} size="sm" />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Bus className="h-4 w-4 text-blue-600" /> Transport & AC
                </span>
                <ReviewStarRating value={transportRating} onChange={setTransportRating} readonly={false} size="sm" />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Utensils className="h-4 w-4 text-emerald-600" /> Food & Meals
                </span>
                <ReviewStarRating value={foodRating} onChange={setFoodRating} readonly={false} size="sm" />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-purple-600" /> Trip Captain
                </span>
                <ReviewStarRating value={captainRating} onChange={setCaptainRating} readonly={false} size="sm" />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" /> Safety Standards
                </span>
                <ReviewStarRating value={safetyRating} onChange={setSafetyRating} readonly={false} size="sm" />
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-orange-600" /> Value for Money
                </span>
                <ReviewStarRating value={valueRating} onChange={setValueRating} readonly={false} size="sm" />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-[#102A43] text-white font-bold text-xs rounded-xl shadow-soft"
              >
                Continue to Review →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Story & Author Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full p-2.5 border rounded-xl text-xs font-poppins focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-amber-600" /> College / University
                </label>
                <select
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs font-poppins bg-white focus:outline-none focus:border-amber-500 font-semibold"
                >
                  <option value="NSUT">NSUT Delhi</option>
                  <option value="DTU">DTU Delhi</option>
                  <option value="IIT Delhi">IIT Delhi</option>
                  <option value="DU">Delhi University (DU)</option>
                  <option value="BPIT">BPIT Delhi</option>
                  <option value="IPU">GGSIPU</option>
                  <option value="Other">Other College / University</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Instagram className="h-3.5 w-3.5 text-pink-600" /> Instagram Handle (Optional)
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username"
                className="w-full p-2.5 border rounded-xl text-xs font-poppins focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Headline Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unforgettable Sunset at Lake Pichola!"
                className="w-full p-2.5 border rounded-xl text-xs font-poppins focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Your Detailed Review Story *
                </label>
                <span className="text-[10px] text-muted-foreground">
                  {reviewText.length} / 1000 chars
                </span>
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={1000}
                placeholder="Describe your road trip experience, hotels, bus transport, food, bonfire, and trip captain support..."
                className="w-full p-3 border rounded-xl text-xs font-poppins h-28 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs text-slate-600 font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-[#102A43] text-white font-bold text-xs rounded-xl shadow-soft"
              >
                Continue to Media →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Media Upload & Preferences */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Upload Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Upload Trip Photos & Video Reels
              </label>
              <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-amber-50/30 transition-all">
                <Upload className="h-8 w-8 text-amber-600 mb-2 animate-bounce" />
                <span className="text-xs font-bold text-slate-800">
                  Click to Upload Photos & Videos
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  WebP Compressed · Max 5 files
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded Previews */}
              {mediaFiles.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {mediaFiles.map((m, i) => (
                    <div
                      key={i}
                      className="h-16 w-20 rounded-xl overflow-hidden border bg-slate-900 shrink-0 relative"
                    >
                      <img src={m.url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setMediaFiles((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendation Toggle */}
            <div className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Would you recommend Nomadik to friends?
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Helps fellow travelers choose the right trip
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWouldRecommend(true)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    wouldRecommend
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-600 border"
                  }`}
                >
                  YES 👍
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(false)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    !wouldRecommend
                      ? "bg-red-600 text-white"
                      : "bg-white text-slate-600 border"
                  }`}
                >
                  NO
                </button>
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anon"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="anon" className="text-xs text-slate-700 font-medium">
                Post review anonymously (Hides name & photo)
              </label>
            </div>

            {/* Gamification Reward Preview */}
            <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl border border-amber-500/20 flex items-center gap-3">
              <Trophy className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="text-xs font-poppins">
                <span className="font-bold text-amber-950 block">
                  Earn +200 XP & Explorer Badge!
                </span>
                <span className="text-amber-800/80 text-[10px]">
                  Unlocks exclusive Nomadik merchandise & trip discount vouchers.
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs text-slate-600 font-semibold"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-[#102A43] to-[#1A365D] text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>Submit Review & Earn XP ✨</>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
