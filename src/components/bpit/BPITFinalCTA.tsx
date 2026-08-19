import { ArrowRight, GraduationCap } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function BPITFinalCTA() {
  return (
    <section className="py-20 bg-slate-950 text-white font-poppins relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#C8A96A]/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-blue-300 uppercase tracking-widest">
          <GraduationCap className="h-4 w-4 text-blue-400" />
          <span>LIMITED SEATS FOR BPIT BATCH</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white leading-tight">
          Ready for Udaipur 2026 with your BPIT Gang?
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto font-light">
          Book your spot now at starting rate of ₹6,499 per person. Limited seats available for this special college batch!
        </p>

        <div className="pt-4 flex justify-center">
          <Link
            to="/destinations/$slug"
            params={{ slug: "udaipur" }}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-[#C8A96A] hover:from-blue-700 hover:to-[#b89650] text-white font-bold text-base shadow-2xl shadow-blue-900/50 hover:scale-105 transition-all duration-300"
          >
            <span>Book Your Spot Now</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
