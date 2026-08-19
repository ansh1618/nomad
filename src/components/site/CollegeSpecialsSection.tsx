import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "@tanstack/react-router";
import { GraduationCap, ArrowRight, Users, Sparkles, MapPin, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCollegeSpecials, DEFAULT_COLLEGE_SPECIALS, CollegeSpecial } from "@/lib/queries/college-specials";

export function CollegeSpecialsSection() {
  const { data: specials = DEFAULT_COLLEGE_SPECIALS } = useQuery({
    queryKey: ["college_specials"],
    queryFn: getCollegeSpecials,
    staleTime: 5 * 60 * 1000,
  });

  const activeSpecials = specials.filter((s) => s.is_visible !== false);
  const [activeTabId, setActiveTabId] = useState<string>(activeSpecials[0]?.id || "miranda-house");

  const currentSpecial = activeSpecials.find((s) => s.id === activeTabId) || activeSpecials[0] || DEFAULT_COLLEGE_SPECIALS[0];

  return (
    <section className="py-12 bg-gradient-to-b from-[#0F2942]/5 via-background to-background relative overflow-hidden font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title & Tabs Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F2942]/10 border border-[#0F2942]/15 text-xs font-semibold text-[#0F2942] uppercase tracking-wider mb-2">
              <GraduationCap className="h-3.5 w-3.5 text-[#C8A96A]" />
              <span>Campus Collaborations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">
              College Specials
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
              Exclusive group getaways & road trips curated specifically for college campuses.
            </p>
          </div>

          {/* Scalable College Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {activeSpecials.map((college) => {
              const isActive = college.id === activeTabId;
              return (
                <button
                  key={college.id}
                  onClick={() => setActiveTabId(college.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap border shrink-0 ${
                    isActive
                      ? "bg-[#0F2942] text-white border-[#0F2942] shadow-md shadow-[#0F2942]/20"
                      : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <GraduationCap className={`h-3.5 w-3.5 ${isActive ? "text-[#C8A96A]" : "text-muted-foreground"}`} />
                  <span>{college.headline || `GoNomadik × ${college.college_name}`}</span>
                  {isActive && (
                    <motion.span
                      layoutId="activeCollegeTabIndicator"
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-[#C8A96A] rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active College Card Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSpecial.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className={`relative rounded-3xl overflow-hidden text-white p-6 sm:p-10 shadow-2xl border ${
              currentSpecial.id === "bpit"
                ? "bg-gradient-to-r from-[#0F2642] via-[#1A365D] to-[#0E2038] border-blue-500/20"
                : "bg-gradient-to-r from-[#102A43] via-[#1A365D] to-[#0F2942] border-white/10"
            }`}
          >
            {/* Background Glows */}
            {currentSpecial.id === "bpit" ? (
              <>
                <div className="absolute -right-16 -top-16 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-[#C8A96A]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-1/3 bottom-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
              </>
            ) : (
              <>
                <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#E05688]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-[#C8A96A]/15 rounded-full blur-3xl pointer-events-none" />
              </>
            )}

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Left Content */}
              <div className="space-y-4 text-center lg:text-left max-w-2xl">
                {/* Badge Header */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold tracking-wider text-slate-200">
                  <GraduationCap className={`h-4 w-4 ${currentSpecial.id === 'bpit' ? 'text-blue-400' : 'text-[#E05688]'}`} />
                  <span>{currentSpecial.badge_text || "SPECIAL COLLEGE TRIP"}</span>
                  <span className="w-1 h-1 rounded-full bg-white/40" />
                  <span className="text-[#C8A96A] font-bold">{currentSpecial.badge_accent || "LIMITED SEATS"}</span>
                </div>

                {/* College Headline */}
                <h3 className="text-2xl sm:text-4xl font-display font-bold tracking-tight text-white leading-tight">
                  GoNomadik <span className={currentSpecial.id === "bpit" ? "text-blue-400" : "text-[#E05688]"}>×</span> {currentSpecial.college_name}
                </h3>

                {/* Subtitle */}
                <p className="text-lg sm:text-xl font-display font-semibold text-[#C8A96A]">
                  {currentSpecial.trip_title} — <span className="italic text-white">"{currentSpecial.subtitle}"</span>
                </p>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-light leading-relaxed">
                  {currentSpecial.description}
                </p>

                {/* Info Chips */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-white/80 pt-1">
                  {currentSpecial.chips.map((chip, idx) => (
                    <span
                      key={idx}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${
                        chip.includes("OFF") || chip.includes("STUTI500")
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30 font-semibold"
                          : chip.includes("All-Girls")
                          ? "bg-rose-500/20 text-rose-200 border-rose-400/30"
                          : "bg-white/5 text-slate-200 border-white/10"
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Action Block */}
              <div className="flex flex-col items-center lg:items-end gap-4 shrink-0">
                <div className="text-center lg:text-right">
                  <span className="text-[11px] uppercase tracking-wider text-white/60 font-medium">Starting from</span>
                  <p className="text-3xl sm:text-4xl font-display font-bold text-[#C8A96A]">
                    ₹{currentSpecial.price.toLocaleString("en-IN")}
                    <span className="text-sm font-normal text-white/70">/person</span>
                  </p>
                </div>

                <Link
                  to={currentSpecial.page_href as any}
                  className={`inline-flex items-center gap-2 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 ${
                    currentSpecial.id === "bpit"
                      ? "bg-gradient-to-r from-[#2563EB] via-[#1D4ED8] to-[#C8A96A] hover:from-[#1d4ed8] hover:to-[#b89750] shadow-blue-900/40"
                      : "bg-gradient-to-r from-[#E05688] to-[#C8A96A] hover:from-[#c94576] hover:to-[#b39355] shadow-rose-900/30"
                  }`}
                >
                  <span>{currentSpecial.cta_text || `Explore ${currentSpecial.college_name} Trip →`}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
