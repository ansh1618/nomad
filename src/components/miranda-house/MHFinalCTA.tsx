import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Heart } from "lucide-react";

export function MHFinalCTA() {
  return (
    <section className="relative py-24 bg-slate-950 text-white font-poppins overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/destinations/udaipur-lake-pichola.jpg"
          alt="Udaipur Sunset"
          className="w-full h-full object-cover object-center opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-rose-200">
            <Heart className="h-3.5 w-3.5 text-[#E05688] fill-[#E05688]" />
            <span>MIRANDA HOUSE × GONOMADIK</span>
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-tight">
            Your Girl Gang. <br />
            <span className="text-[#C8A96A] italic">Your Udaipur Story. ❤️</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-light max-w-xl mx-auto">
            11 September 2026 • 2N/3D All-Girls College Trip
          </p>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-block bg-white/10 backdrop-blur-xl border border-white/15 px-6 py-4 rounded-3xl"
        >
          <span className="text-[11px] uppercase tracking-widest text-slate-300 font-semibold block">
            LIMITED SEATS AVAILABLE
          </span>
          <p className="text-3xl sm:text-4xl font-display font-bold text-[#C8A96A] mt-1">
            ₹6,499 <span className="text-xs font-normal text-white/80">onwards</span>
          </p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">
            Use code STUTI500 for ₹500 FLAT OFF
          </p>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="pt-2"
        >
          <Link
            to="/destinations/$slug"
            params={{ slug: "udaipur" }}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-[#E05688] via-[#d6477b] to-[#C8A96A] hover:from-[#c93c6e] hover:to-[#b89650] text-white font-bold text-base sm:text-lg shadow-2xl shadow-rose-950/60 hover:scale-105 transition-all duration-300"
          >
            <span>BOOK YOUR SPOT NOW</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
