import { motion } from "motion/react";
import { MapPin } from "lucide-react";

export function MHDestinations() {
  const places = [
    {
      name: "City Palace Complex",
      location: "Udaipur, Rajasthan",
      image: "/images/udaipur-palace.png",
      desc: "Built over 400 years on the banks of Lake Pichola, displaying grand courtyards, marble balconies, and royal Mewar artifacts.",
    },
    {
      name: "Lake Pichola",
      location: "Udaipur, Rajasthan",
      image: "/images/destinations/udaipur-lake-pichola.jpg",
      desc: "An artificial freshwater lake featuring golden sunset views, historic Amet Haveli reflections, and soothing boat cruises.",
    },
    {
      name: "Jagdish Temple",
      location: "Old City, Udaipur",
      image: "/images/campus/udaipur.jpg",
      desc: "An Indo-Aryan architectural masterpiece built in 1651, famous for carved pillars, serene ambiance, and cultural heritage.",
    },
    {
      name: "Mount Abu",
      location: "Sirohi, Rajasthan",
      image: "/images/destinations/manali-solang.jpg",
      desc: "Rajasthan's only hill station surrounded by lush Aravalli hills, Nakki Lake boat rides, and cool mountain breezes.",
    },
  ];

  return (
    <section className="py-20 bg-slate-900 text-white font-poppins relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C8A96A] bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
            HERITAGE & NATURE
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-white">
            Places You'll Explore
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
            Handpicked iconic spots in Udaipur and Mount Abu carefully paced for photo opportunities, relaxation, and exploration.
          </p>
        </div>

        {/* Places Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {places.map((place, idx) => (
            <motion.div
              key={place.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-slate-800/60 rounded-3xl overflow-hidden border border-white/10 hover:border-[#C8A96A]/50 transition-all duration-300 shadow-xl group flex flex-col justify-between"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#E05688]" /> {place.location}
                </span>
              </div>

              <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display text-white group-hover:text-[#C8A96A] transition-colors">
                    {place.name}
                  </h3>
                  <p className="text-xs text-slate-300 font-light leading-relaxed mt-1">
                    {place.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
