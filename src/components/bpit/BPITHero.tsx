import { motion } from "motion/react";
import { GraduationCap, ArrowRight, ShieldCheck, MapPin, Calendar } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function BPITHero() {
  const scrollToItinerary = () => {
    const el = document.getElementById("bpit-itinerary-section");
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
      </div>

      {/* BPIT Blue & GoNomadik Gold Orbs */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-[#C8A96A]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">
        {/* Special College Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-blue-400/30 shadow-xl text-xs font-semibold tracking-widest uppercase text-blue-200"
        >
          <GraduationCap className="h-4 w-4 text-blue-400" />
          <span>EXCLUSIVE COLLEGE TRIP</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]" />
          <span className="text-[#C8A96A] font-bold">BPIT SPECIAL</span>
        </motion.div>

        {/* Main Title Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-3"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-tight">
            GoNomadik <span className="text-blue-400">×</span> BPIT
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
            2 Nights • 3 Days • College Getaway
          </p>
          <p className="text-base sm:text-lg text-blue-100/90 font-light italic">
            "The City of Lakes — College Getaway"
          </p>
          <p className="text-xs sm:text-sm text-slate-300 font-light pt-1">
            Lakes, royal palaces, local experiences, sunsets, fun and unforgettable memories with your college gang.
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
          <p className="text-[11px] text-blue-300 font-semibold mt-1 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> BPIT Special Batch Rate
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
            to="/destinations/$slug"
            params={{ slug: "udaipur" }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-[#C8A96A] hover:from-blue-700 hover:to-[#b89650] text-white font-bold text-sm shadow-xl shadow-blue-900/40 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span>Book Your Spot</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
