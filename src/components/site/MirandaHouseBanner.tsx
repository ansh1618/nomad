import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, GraduationCap, Heart, Users } from "lucide-react";

export function MirandaHouseBanner() {
  return (
    <section className="py-10 bg-gradient-to-b from-[#0F2942]/5 via-background to-background relative overflow-hidden font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#102A43] via-[#1A365D] to-[#0F2942] text-white p-6 sm:p-10 shadow-2xl border border-white/10"
        >
          {/* Subtle Background Art */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#E05688]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-[#C8A96A]/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Content */}
            <div className="space-y-4 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wider text-rose-200">
                <GraduationCap className="h-4 w-4 text-[#E05688]" />
                <span>SPECIAL COLLEGE TRIP</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="text-[#C8A96A] font-bold">LIMITED SEATS</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-white leading-tight">
                GoNomadik <span className="text-[#E05688]">×</span> Miranda House
              </h2>

              <p className="text-lg sm:text-xl font-display font-semibold text-[#C8A96A]">
                UDAIPUR 2026 — <span className="italic text-white">"Exclusive All-Girls College Trip"</span>
              </p>

              <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-light leading-relaxed">
                2 Nights • 3 Days of lakes, grand Mewar palaces, sunset boat cruises, bonfire jam sessions & memories with your girl gang.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-white/80 pt-1">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  📅 11 September 2026
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <Users className="h-3.5 w-3.5 text-rose-300" /> All-Girls Batch
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/30 font-semibold">
                  🏷️ ₹500 OFF Code: STUTI500
                </span>
              </div>
            </div>

            {/* Right Action Block */}
            <div className="flex flex-col items-center lg:items-end gap-3 shrink-0">
              <div className="text-center lg:text-right">
                <span className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Starting from</span>
                <p className="text-3xl sm:text-4xl font-display font-bold text-[#C8A96A]">₹6,499<span className="text-sm font-normal text-white/70">/person</span></p>
              </div>

              <Link
                to="/go-nomadik-x-mh"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#E05688] to-[#C8A96A] hover:from-[#c94576] hover:to-[#b39355] text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-rose-900/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <span>Explore MH Trip</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
