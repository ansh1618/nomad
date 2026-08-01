import { useState } from "react";
import { Star, X, ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { SEED_REVIEWS } from "@/lib/reviews-client";
import { ReviewStarRating } from "./ReviewStarRating";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";

export function FloatingReviewWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Badge (Bottom Left - Completely avoids WhatsApp FAB on Bottom Right) */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className="fixed bottom-6 left-6 z-40 bg-[#102A43]/95 text-white px-4 py-2.5 rounded-full shadow-2xl border border-amber-500/30 backdrop-blur-md flex items-center gap-2.5 font-poppins cursor-pointer hover:border-amber-400 transition-all group"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-amber-500 to-[#C8A96A] text-slate-950 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
          ★
        </div>
        <div className="text-left leading-tight whitespace-nowrap">
          <span className="text-[9px] uppercase font-bold text-amber-400 block tracking-widest">
            Nomadik Rating
          </span>
          <span className="text-xs font-bold font-display text-white group-hover:text-amber-200 transition-colors">
            4.9★ (1.2k+ Verified Reviews)
          </span>
        </div>
      </motion.button>

      {/* Slide-over Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex justify-start font-poppins">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto"
            >
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5 w-fit">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" /> 100% Genuine Reviews Only
                    </span>
                    <h3 className="font-display font-bold text-xl text-[#102A43] mt-1.5">
                      Verified Traveler Voices
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close review drawer"
                    className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Score Summary */}
                <div className="bg-[#102A43] text-white p-4 rounded-2xl flex items-center justify-between shadow-soft">
                  <div>
                    <span className="text-2xl font-bold font-display text-amber-400">
                      4.9 / 5.0
                    </span>
                    <ReviewStarRating value={4.9} size="sm" className="mt-0.5" />
                  </div>
                  <span className="text-xs text-white/80 font-medium text-right">
                    Based on 1,286<br />Verified Road Trips
                  </span>
                </div>

                {/* Verification Notice */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Lock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Trust Policy:</strong> Public review submissions are disabled. Only travelers with a completed Nomadik booking can submit verified reviews.
                  </p>
                </div>

                {/* Sample Reviews List */}
                <div className="space-y-3 pt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    Recent Verified Stories
                  </span>
                  {SEED_REVIEWS.slice(0, 3).map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#102A43]">{rev.author_name}</span>
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            ✔ Verified
                          </span>
                        </div>
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
              <div className="pt-5 border-t space-y-2.5">
                <Link
                  to="/account"
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-[#102A43] text-white font-bold text-xs py-3.5 rounded-2xl shadow-soft flex items-center justify-center gap-2 hover:bg-[#1A365D] transition-colors"
                >
                  My Account & Completed Trips <ArrowRight className="h-4 w-4 text-amber-400" />
                </Link>
                <p className="text-[10px] text-slate-400 text-center">
                  Have a completed trip? Leave your review in your dashboard to earn 200 XP credits.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
