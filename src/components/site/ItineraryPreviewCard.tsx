/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Lock,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Eye,
} from "lucide-react";

interface ItineraryPreviewCardProps {
  destinationName: string;
  slug: string;
  document?: any;
  onViewItinerary: () => void;
  isAuthenticated?: boolean;
}

export function ItineraryPreviewCard({
  destinationName,
  slug,
  document,
  onViewItinerary,
  isAuthenticated = false,
}: ItineraryPreviewCardProps) {
  const pageCount = document?.page_count || 13;
  const title = document?.title || `${destinationName} Complete Travel Guide`;
  const coverImage =
    document?.thumbnail_url ||
    document?.cover_image ||
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full my-8 p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white border border-[#334155] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group"
    >
      {/* Background Decorative Glow */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#F59E0B]/20 transition-all duration-700" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Grid Layout */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: Content & Features */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-poppins font-bold uppercase tracking-widest bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 shadow-inner">
              <FileText className="h-3.5 w-3.5" /> Complete Travel Guide
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-poppins font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified by Nomadik
            </span>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-2">
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-wide leading-tight">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-white/70 font-poppins leading-relaxed">
              Everything you need before booking. Access our detailed day-by-day roadmap, vetted stays, and local insights.
            </p>
          </div>

          {/* Feature Checklist Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-x-4 gap-y-2.5 pt-1 text-xs font-poppins text-white/90">
            {[
              "Day-wise itinerary",
              "Hotel details & stays",
              "Pickup points & maps",
              "Meals & Dining info",
              "Inclusions & Exclusions",
              "Things to Carry checklist",
              "Terms & Cancellation policies",
              "Local emergency contacts",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#F59E0B] shrink-0" />
                <span className="truncate">{feature}</span>
              </div>
            ))}
          </div>

          {/* Meta Info Pill Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-poppins text-white/60 pt-2 border-t border-white/10">
            <span className="flex items-center gap-1.5 font-semibold text-white/90">
              <BookOpen className="h-4 w-4 text-[#F59E0B]" /> {pageCount} Pages
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-400" /> Approx 8 min read
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">Updated Recently</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Locked Preview Stack */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          
          {/* Card Preview Container with Blurred Thumbnail Stack */}
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-white/15 bg-[#020617]/80 p-3 shadow-2xl group-hover:border-[#F59E0B]/40 transition-colors duration-500">
            
            {/* Visual Header */}
            <div className="flex items-center justify-between px-3 py-1.5 mb-2 border-b border-white/10 text-[10px] text-white/60 font-poppins">
              <span className="flex items-center gap-1 font-semibold text-white/80">
                <FileText className="h-3 w-3 text-[#F59E0B]" /> {destinationName}_Itinerary.pdf
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-white/90 font-mono">
                {pageCount} PAGES
              </span>
            </div>

            {/* Locked Page Thumbnail Mockup Stack */}
            <div className="relative h-48 sm:h-52 w-full rounded-xl overflow-hidden bg-slate-900">
              {/* Background Cover Thumbnail Image */}
              <img
                src={coverImage}
                alt={destinationName}
                className="w-full h-full object-cover filter blur-[6px] scale-110 opacity-40 group-hover:scale-105 transition-transform duration-700"
              />

              {/* Faux PDF Page Preview Layout (Blurred) */}
              <div className="absolute inset-0 p-4 flex flex-col justify-between filter blur-[3px] opacity-30 select-none pointer-events-none">
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-white/80 rounded" />
                  <div className="h-2 w-1/2 bg-[#F59E0B] rounded" />
                  <div className="space-y-1 pt-2">
                    <div className="h-2 w-full bg-white/50 rounded" />
                    <div className="h-2 w-full bg-white/50 rounded" />
                    <div className="h-2 w-2/3 bg-white/50 rounded" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 bg-white/40 rounded-lg" />
                  <div className="h-12 bg-white/40 rounded-lg" />
                  <div className="h-12 bg-white/40 rounded-lg" />
                </div>
              </div>

              {/* Dark Gradient Locked Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/80 to-[#0F172A]/40 flex flex-col items-center justify-center p-4 text-center">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                  className="w-12 h-12 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center mb-2 shadow-lg backdrop-blur-md"
                >
                  <Lock className="h-6 w-6 text-[#F59E0B]" />
                </motion.div>
                <p className="text-xs font-poppins font-bold text-white tracking-wide">
                  {isAuthenticated ? "Click to view full guide" : "Login to unlock the complete guide"}
                </p>
                <p className="text-[10px] font-poppins text-white/60 mt-0.5">
                  {pageCount} Pages • High-Res PDF Roadmap
                </p>
              </div>

            </div>

            {/* Action CTA Button */}
            <div className="mt-3">
              <Button
                onClick={onViewItinerary}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-poppins font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#F59E0B]/20 hover:shadow-[#F59E0B]/40 transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
              >
                {isAuthenticated ? (
                  <>
                    <Eye className="h-4 w-4" /> Open Full Itinerary Viewer
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Unlock Detailed Itinerary
                  </>
                )}
                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>

          </div>

        </div>

      </div>
    </motion.div>
  );
}
