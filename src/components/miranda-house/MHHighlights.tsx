import { motion } from "motion/react";
import { Castle, Anchor, Flame, ShoppingBag, Gamepad2, HeartHandshake } from "lucide-react";

export function MHHighlights() {
  const highlights = [
    {
      icon: Castle,
      emoji: "🏛️",
      title: "Royal Udaipur",
      desc: "Explore historic City Palace, majestic Mewar architecture & heritage havelis.",
      badge: "Heritage",
    },
    {
      icon: Anchor,
      emoji: "⛵",
      title: "Boat Ride",
      desc: "Golden hour sunset boat cruise on serene Lake Pichola with stunning palace views.",
      badge: "Golden Hour",
    },
    {
      icon: Flame,
      emoji: "🔥",
      title: "Bonfire & Music",
      desc: "Starlit bonfire jam sessions, music, laughter & heartfelt late-night conversations.",
      badge: "Nightlife",
    },
    {
      icon: ShoppingBag,
      emoji: "🛍️",
      title: "Local Markets",
      desc: "Handcrafted Jutti shopping, traditional Bandhani sarees & vibrant street food.",
      badge: "Culture",
    },
    {
      icon: Gamepad2,
      emoji: "🎲",
      title: "Fun Games",
      desc: "Icebreakers, trivia, group challenges & memorable college-style gang activities.",
      badge: "Bonding",
    },
    {
      icon: HeartHandshake,
      emoji: "👯",
      title: "All-Girls Experience",
      desc: "100% safe, verified AC transport, female-inclusive captain & supportive crew.",
      badge: "Safe & Verified",
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background via-slate-50/50 to-background font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E05688] bg-rose-50 px-3.5 py-1.5 rounded-full border border-rose-100">
            WHY THIS TRIP
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#102A43] tracking-tight">
            More Than Just A Trip. <span className="text-[#C8A96A] italic">It's A Memory.</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed">
            Curated specifically for Miranda House students & friends — combining luxury heritage, safety, and unforgettable college bonding.
          </p>
        </div>

        {/* 6 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((item, idx) => {
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 hover:border-[#E05688]/40 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4 group relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{item.emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                    {item.badge}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold font-display text-[#102A43] group-hover:text-[#E05688] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
