import { motion } from "motion/react";
import { GraduationCap, Sparkles, Calendar, MapPin, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function MHHero() {
  const scrollToItinerary = () => {
    const el = document.getElementById("mh-itinerary-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 bg-slate-950 overflow-hidden font-poppins text-white">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/destinations/udaipur-lake-pichola.jpg"
          alt="Udaipur Lake Pichola"
          className="w-full h-full object-cover object-center opacity-40 scale-105 transform animate-pulse-subtle"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
      </div>

      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-[#E05688]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-[#C8A96A]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
        {/* Special College Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl text-xs font-semibold tracking-widest uppercase text-rose-200"
        >
          <GraduationCap className="h-4 w-4 text-[#E05688]" />
          <span>EXCLUSIVE COLLEGE TRIP</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]" />
          <span className="text-[#C8A96A] font-bold">ALL GIRLS EDITION</span>
        </motion.div>

        {/* Main Title Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-3"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-tight">
            GoNomadik <span className="text-[#E05688]">×</span> MH
          </h1>
          <p className="text-2xl sm:text-4xl font-display font-bold text-[#C8A96A] tracking-wider uppercase">
            UDAIPUR 2026
          </p>
        </motion.div>

        {/* Subtitle & Concept */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-2 max-w-2xl mx-auto"
        >
          <p className="text-lg sm:text-xl font-medium text-slate-200">
            2 Nights • 3 Days • All Girls Trip
          </p>
          <p className="text-base sm:text-lg text-rose-100/90 font-light italic">
            Palaces. Lakes. Sunsets. Your girl gang.
          </p>
        </motion.div>

        {/* Price Tag */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-4 sm:p-6 inline-block shadow-2xl"
        >
          <span className="text-xs uppercase tracking-widest text-slate-300 font-semibold block mb-1">
            STARTING FROM
          </span>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-3xl sm:text-5xl font-display font-bold text-[#C8A96A]">
              ₹6,499/-
            </span>
            <span className="text-xs text-slate-300 font-light">per person</span>
          </div>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> STUTI500 Code Applied (₹500 Flat Off)
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <button
            onClick={scrollToItinerary}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-md transition-all duration-300 shadow-lg"
          >
            View Itinerary
          </button>

          <Link
            to="/packages/udaipur-weekend"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#E05688] via-[#d6477b] to-[#C8A96A] hover:from-[#c93c6e] hover:to-[#b89650] text-white font-bold text-sm shadow-xl shadow-rose-900/40 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>Book Your Spot</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
