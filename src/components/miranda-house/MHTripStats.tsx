import { motion } from "motion/react";
import { Calendar, Clock, IndianRupee, Users } from "lucide-react";

export function MHTripStats() {
  const stats = [
    {
      icon: Calendar,
      label: "Departure Date",
      val: "11 September",
      sub: "Batch 2026",
      color: "text-rose-600 bg-rose-50 border-rose-100",
    },
    {
      icon: Clock,
      label: "Duration",
      val: "2N / 3D",
      sub: "Full Experience",
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      icon: IndianRupee,
      label: "Starting Price",
      val: "₹6,499+",
      sub: "STUTI500 Applicable",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      icon: Users,
      label: "Batch Style",
      val: "All Girls",
      sub: "Miranda House Special",
      color: "text-purple-600 bg-purple-50 border-purple-100",
    },
  ];

  return (
    <section className="relative -mt-10 z-20 max-w-6xl mx-auto px-4 font-poppins">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-100 space-y-2 text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4"
            >
              <div className={`p-3 rounded-2xl border ${item.color} shrink-0`}>
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {item.label}
                </p>
                <p className="text-base sm:text-lg font-bold font-display text-[#102A43]">
                  {item.val}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">{item.sub}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
