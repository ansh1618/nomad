import { motion } from "motion/react";
import { Check, X, ShieldCheck } from "lucide-react";

export function MHInclusions() {
  const inclusions = [
    "AC Deluxe Transportation (Delhi to Udaipur & Mount Abu return)",
    "2 Nights Luxury Hotel Stay in Udaipur",
    "Daily Breakfast & Dinner included",
    "Lake Pichola Sunset Boat Ride Pass",
    "Guided City Palace & Heritage Tours",
    "Starlit Bonfire & Acoustic Jam Session",
    "Fun Group Games & Icebreaker Activities",
    "Certified 24×7 Nomadik Trip Coordinator",
  ];

  const exclusions = [
    "Personal shopping or souvenirs",
    "Personal expenses & extra snacks/beverages",
    "Monument entry tickets not specified in itinerary",
    "Anything not explicitly mentioned under Inclusions",
  ];

  return (
    <section className="py-16 bg-slate-50 font-poppins">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#102A43] bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
            TRANSPARENT PRICING
          </span>
          <h2 className="text-3xl font-display font-bold text-[#102A43]">
            What's Included & Excluded
          </h2>
          <p className="text-xs text-slate-500 font-light">
            No hidden costs. Complete clarity on what is covered in your package.
          </p>
        </div>

        {/* 2 Column Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inclusions Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-lg space-y-4"
          >
            <div className="flex items-center gap-2 border-b pb-3">
              <div className="p-2 rounded-full bg-emerald-50 text-emerald-700">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-emerald-900">
                Inclusions (What You Get)
              </h3>
            </div>

            <ul className="space-y-3">
              {inclusions.map((item) => (
                <li key={item} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <span className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <Check className="h-3 w-3" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Exclusions Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-lg space-y-4"
          >
            <div className="flex items-center gap-2 border-b pb-3">
              <div className="p-2 rounded-full bg-rose-50 text-rose-700">
                <X className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-rose-900">
                Exclusions (Not Covered)
              </h3>
            </div>

            <ul className="space-y-3">
              {exclusions.map((item) => (
                <li key={item} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <span className="p-1 rounded-full bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                    <X className="h-3 w-3" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
