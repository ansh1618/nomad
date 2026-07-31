import { useState } from "react";
import { Star, X, Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { SEED_REVIEWS } from "@/lib/reviews-client";
import { ReviewStarRating } from "./ReviewStarRating";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";

export function FloatingReviewWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Badge (Bottom Right) */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className="fixed bottom-6 right-6 z-40 bg-[#102A43] text-white px-4 py-3 rounded-full shadow-2xl border-2 border-amber-500/40 flex items-center gap-2.5 font-poppins cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm">
          ★
        </div>
        <div className="text-left leading-none">
          <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
            Nomadik Rating
          </span>
          <span className="text-xs font-bold font-display text-white">
            4.9★ (1280+ Reviews)
          </span>
        </div>
      </motion.button>

      {/* Slide-over Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-end font-poppins">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto"
            >
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border">
                      Verified Traveler Voices
                    </span>
                    <h3 className="font-display font-bold text-xl text-[#102A43] mt-1">
                      Recent Traveler Reviews
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Score Summary */}
                <div className="bg-[#102A43] text-white p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold font-display text-amber-400">
                      4.9 / 5.0
                    </span>
                    <ReviewStarRating value={4.9} size="sm" className="mt-0.5" />
                  </div>
                  <span className="text-xs text-white/80 font-medium">
                    1,280+ Verified Road Trips
                  </span>
                </div>

                {/* Sample Reviews List */}
                <div className="space-y-3 pt-2">
                  {SEED_REVIEWS.slice(0, 3).map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#102A43]">{rev.author_name}</span>
                        <ReviewStarRating value={rev.overall_rating} size="sm" />
                      </div>
                      <p className="text-slate-600 line-clamp-2 leading-relaxed italic">
                        "{rev.review}"
                      </p>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {rev.college} · {rev.journey_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer CTA */}
              <div className="pt-6 border-t space-y-3">
                <Link
                  to="/journeys"
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-[#102A43] text-white font-bold text-xs py-3.5 rounded-2xl shadow-soft flex items-center justify-center gap-2 hover:bg-[#1A365D] transition-colors"
                >
                  Explore All Journeys <ArrowRight className="h-4 w-4 text-amber-400" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
