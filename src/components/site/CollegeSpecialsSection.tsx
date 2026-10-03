import { useState } from "react";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { GraduationCap, ArrowRight, ShieldCheck, Sparkles, MapPin, Calendar, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getStudentOfferSettings, getEligiblePackages, getEligibleDestinations } from "@/lib/college-trips/service";

export function CollegeSpecialsSection() {
  const { data: settings } = useQuery({
    queryKey: ["student_offer_settings"],
    queryFn: getStudentOfferSettings,
    staleTime: 60 * 1000,
  });

  const { data: eligiblePackages = [] } = useQuery({
    queryKey: ["student_offer_packages"],
    queryFn: getEligiblePackages,
    staleTime: 60 * 1000,
  });

  const { data: eligibleDestinations = [] } = useQuery({
    queryKey: ["student_offer_destinations"],
    queryFn: getEligibleDestinations,
    staleTime: 60 * 1000,
  });

  // If program is disabled by admin, hide this section
  if (settings && !settings.enabled) {
    return null;
  }

  const globalDiscountPct = settings?.discount_percentage ?? 25;
  const activePackages = eligiblePackages.filter((p) => p.is_eligible && p.is_active !== false);

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-background via-[#0F2942]/10 to-background relative overflow-hidden font-poppins">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C8A96A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0F2942]/15 border border-[#C8A96A]/30 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
              <GraduationCap className="h-4 w-4 text-[#C8A96A]" />
              <span className="font-bold text-[#C8A96A] tracking-widest">{settings?.title || "COLLEGE TRIPS"}</span>
              <span className="h-1 w-1 rounded-full bg-[#C8A96A]" />
              <span className="text-muted-foreground text-[11px]">Up to {globalDiscountPct}% OFF</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground tracking-tight">
              Special prices for verified college students
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
              Get exclusive student pricing on selected trips to Manali, Chopta & Tungnath, Jibhi and more.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              asChild
              className="bg-gold-gradient text-gold-foreground hover:brightness-105 font-bold shadow-soft text-xs sm:text-sm px-6 py-5 rounded-xl transition-all"
            >
              <Link to="/college-trips">
                <span>EXPLORE COLLEGE TRIPS</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-border text-foreground hover:bg-accent font-bold text-xs sm:text-sm px-6 py-5 rounded-xl transition-all"
            >
              <Link to="/college-trips" hash="plan-trip">
                <span>PLAN A COLLEGE TRIP</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Featured Eligible Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {activePackages.slice(0, 3).map((item) => {
            const pkg = item.package;
            if (!pkg) return null;

            const regularPrice = pkg.starting_price || 6499;
            const discountPct =
              item.override_global_discount && typeof item.custom_discount_percentage === "number"
                ? item.custom_discount_percentage
                : globalDiscountPct;

            const discountAmount = Math.round((regularPrice * discountPct) / 100);
            const studentPrice = Math.max(0, regularPrice - discountAmount);
            const destName = pkg.destinations?.name || "Himalayas";

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                className="group relative rounded-3xl overflow-hidden bg-card border border-border/80 shadow-elegant hover:shadow-2xl flex flex-col justify-between"
              >
                {/* Image Container */}
                <div className="relative h-56 w-full overflow-hidden bg-muted">
                  <img
                    src={pkg.hero_banner || "/images/manali.jpg"}
                    alt={pkg.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* Student Offer Badge */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white backdrop-blur-md text-xs font-bold shadow-md">
                    <Sparkles className="h-3 w-3 text-amber-200" />
                    <span>{discountPct}% Student Offer</span>
                  </div>

                  {/* Destination Tag */}
                  <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 text-white/90 backdrop-blur-md text-[11px] font-medium border border-white/10">
                    <MapPin className="h-3 w-3 text-[#C8A96A]" />
                    <span>{destName}</span>
                  </div>

                  {/* Package Title on Image */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-lg font-display font-bold text-white leading-snug line-clamp-1 drop-shadow-md">
                      {pkg.name}
                    </h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Verified Student Price
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Save ₹{discountAmount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* Price Presentation */}
                    <div className="bg-muted/40 p-3 rounded-2xl border border-border/50 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Regular Price</span>
                        <span className="text-sm font-semibold text-muted-foreground line-through">
                          ₹{regularPrice.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#C8A96A] uppercase font-bold tracking-wider block">Verified Student</span>
                        <span className="text-xl sm:text-2xl font-display font-bold text-primary">
                          ₹{studentPrice.toLocaleString("en-IN")}
                          <span className="text-xs font-normal text-muted-foreground">/person</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <Link
                      to="/college-trips"
                      className="text-xs font-bold text-primary hover:text-[#C8A96A] transition-colors flex items-center gap-1"
                    >
                      <span>View Student Deal</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <Button
                      asChild
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-soft"
                    >
                      <Link to="/college-trips">
                        Book Offer
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Banner Bar */}
        <div className="mt-12 rounded-3xl bg-gradient-to-r from-[#102A43] via-[#1A365D] to-[#0F2942] p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-white/10">
          <div className="space-y-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs text-[#C8A96A] font-bold uppercase tracking-wider">
              <Users className="h-4 w-4" />
              <span>Campus Group Getaways</span>
            </div>
            <h4 className="text-lg sm:text-xl font-display font-bold text-white">
              Planning a trip for your college society, batch or campus club?
            </h4>
            <p className="text-xs text-slate-300 max-w-xl">
              Get custom group quotations, dedicated trip captains, private luxury convoys & full university coordination.
            </p>
          </div>

          <Button
            asChild
            className="bg-gold-gradient text-gold-foreground hover:brightness-105 font-bold shadow-soft text-xs sm:text-sm px-6 py-5 rounded-2xl shrink-0 transition-all"
          >
            <Link to="/college-trips" hash="plan-trip">
              QUERY FOR COLLEGE TRIP
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
