import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { TicketPercent, Copy, Check, ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function MHCoupon() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText("STUTI500");
    setCopied(true);
    toast.success("Coupon code STUTI500 copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section className="py-16 bg-gradient-to-r from-[#102A43] via-[#1A365D] to-[#0F2942] text-white font-poppins relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E05688]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C8A96A]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-12 border border-white/20 shadow-2xl text-center space-y-6 relative overflow-hidden"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E05688]/20 border border-[#E05688]/40 text-xs font-bold uppercase tracking-wider text-rose-200">
            <Sparkles className="h-4 w-4 text-[#C8A96A]" />
            <span>MIRANDA HOUSE SPECIAL DISCOUNT</span>
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
              Get Flat <span className="text-[#C8A96A]">₹500 OFF</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 font-light leading-relaxed">
              Use code <span className="font-mono font-bold text-[#C8A96A]">STUTI500</span> at checkout on any Udaipur booking with GoNomadik.
            </p>
          </div>

          {/* Coupon Code Pill */}
          <div className="inline-flex items-center gap-3 bg-slate-950/80 p-2 sm:p-3 rounded-2xl border border-white/20 shadow-inner">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl">
              <TicketPercent className="h-5 w-5 text-[#C8A96A]" />
              <span className="font-mono font-extrabold text-xl sm:text-2xl text-[#C8A96A] tracking-wider">
                STUTI500
              </span>
            </div>

            <button
              onClick={copyCode}
              className="px-4 py-2.5 rounded-xl bg-[#C8A96A] hover:bg-[#b89859] text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-950" />
                  <span>COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>COPY CODE</span>
                </>
              )}
            </button>
          </div>

          {/* Booking CTA Button */}
          <div className="pt-2">
            <Link
              to="/packages/udaipur-weekend"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#E05688] to-[#C8A96A] hover:from-[#c93c6e] hover:to-[#b89650] text-white font-bold text-sm sm:text-base shadow-xl shadow-rose-950/50 hover:scale-105 transition-all duration-300"
            >
              <span>BOOK WITH ₹500 OFF</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
