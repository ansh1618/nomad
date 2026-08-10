import { motion } from "motion/react";
import { Users, MessageSquare, Sparkles, Heart } from "lucide-react";

export function MHGroupBooking() {
  const groups = [
    {
      size: "2–4 Friends",
      title: "Bestie Squad",
      desc: "Perfect for roommates and close college besties.",
      badge: "Popular Duo/Quad",
    },
    {
      size: "5–9 Friends",
      title: "Societies & Gangs",
      desc: "Ideal for college society groups & department batches.",
      badge: "Group Perk",
    },
    {
      size: "10+ Friends",
      title: "Entire Batch",
      desc: "Customized seating, group discounts & dedicated captain.",
      badge: "Exclusive Special",
    },
  ];

  const whatsappUrl = `https://wa.me/9199971046607?text=${encodeURIComponent(
    "Hi GoNomadik! We are planning a group booking for the Miranda House Udaipur 2026 trip. Please guide us with group rates!"
  )}`;

  return (
    <section className="py-20 bg-background font-poppins">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E05688] bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100">
            GANG DISCOUNTS AVAILABLE
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#102A43] tracking-tight">
            Coming With Your Girl Gang? 👯‍♀️
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed">
            Traveling is best when shared with your college squad. Choose your gang size below!
          </p>
        </div>

        {/* 3 Group Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {groups.map((g, idx) => (
            <motion.div
              key={g.size}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg space-y-4 hover:border-[#E05688]/40 transition-all text-center flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                  {g.badge}
                </span>
                <h3 className="text-2xl font-bold font-display text-[#102A43]">
                  {g.size}
                </h3>
                <p className="text-sm font-semibold text-[#C8A96A]">{g.title}</p>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  {g.desc}
                </p>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-[#102A43] text-slate-800 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <MessageSquare className="h-4 w-4 text-emerald-600" />
                <span>Reserve Gang Slots</span>
              </a>
            </motion.div>
          ))}
        </div>

        {/* Larger Group Banner */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xl font-bold font-display text-white">
              Planning a larger group or society trip?
            </h4>
            <p className="text-xs text-slate-300 font-light">
              Connect directly with our trip planning team for custom arrangements, bus booking & special rates.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shrink-0"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Contact Team on WhatsApp</span>
          </a>
        </div>
      </div>
    </section>
  );
}
