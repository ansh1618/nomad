import { useState, useEffect } from "react";
import { Star, X, ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { ReviewStarRating } from "./ReviewStarRating";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

export function FloatingReviewWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Appear smoothly after user scrolls down past the hero (e.g. 350px)
      // This ensures it NEVER obscures the Hero CTA buttons or hero badges
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Floating Badge (Bottom Left - Appears on scroll past hero, completely avoids CTA collision) */}
      <AnimatePresence>
        {isVisible && (
          <motion.button
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
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
        )}
      </AnimatePresence>

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

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold font-display text-[#102A43]">4.9 / 5.0</div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs mt-1">
                      {"★".repeat(5)}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-bold text-slate-800">1,248+ Reviews</p>
                    <p>Google & Verified Bookers</p>
                  </div>
                </div>

                {/* Featured Snapshot Testimonials */}
                <div className="space-y-3 pt-2">
                  <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#102A43]">Priya S. (Delhi)</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Verified Solo Trip</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "My first solo trip to Jibhi with GoNomadik felt like traveling with lifelong college friends. The trip captain made sure everyone was safe, included and having a blast!"
                    </p>
                    <div className="text-[10px] text-slate-400 font-medium">Traveled to: Jibhi & Jalori Pass</div>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#102A43]">Rohan & Group (Gurugram)</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Batch Departure</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "Unreal snow trek at Kedarkantha! Stays were warm, food was surprisingly delicious at 10,000 ft, and transport was 100% on time."
                    </p>
                    <div className="text-[10px] text-slate-400 font-medium">Traveled to: Kedarkantha Winter Trek</div>
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="pt-6 border-t mt-4 space-y-3">
                <Button asChild className="w-full bg-[#102A43] hover:bg-[#1E3E5F] text-white font-bold text-xs uppercase tracking-wider h-11 rounded-xl">
                  <Link to={"/#reviews" as any} onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2">
                    <span>Read All 1,200+ Reviews</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-[10px] text-center text-slate-400">
                  Reviews are collected automatically post-departure via verified PNRs.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
