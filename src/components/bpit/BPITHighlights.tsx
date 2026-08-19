import { motion } from "motion/react";
import { GraduationCap, Compass, Camera, Flame, Shield, MapPin, Sparkles } from "lucide-react";

export function BPITHighlights() {
  const highlights = [
    {
      icon: GraduationCap,
      title: "Curated BPIT Campus Vibe",
      desc: "Designed specifically for BPIT students & friends combining adventure, heritage, and college gang bonding.",
    },
    {
      icon: Compass,
      title: "Royal Mewar Heritage",
      desc: "Explore Udaipur's iconic City Palace, Jagdish Temple, and breathtaking architecture.",
    },
    {
      icon: Camera,
      title: "Lake Pichola & Sunset Cruise",
      desc: "Experience golden sunsets over Lake Pichola & boat cruise with your college squad.",
    },
    {
      icon: Flame,
      title: "Bonfire & Acoustic Jamming",
      desc: "Unwind at night with bonfire acoustic music sessions, games, and late night conversations.",
    },
    {
      icon: Shield,
      title: "Verified 3-Star Stays & Safety",
      desc: "Handpicked premium hotels with 24/7 trip captain support and verified comfort.",
    },
    {
      icon: Sparkles,
      title: "Hassle-Free AC Transfers",
      desc: "Comfortable Volvo/Force Traveler AC transport from Delhi NCR and back.",
    },
  ];

  return (
    <section className="py-16 bg-background font-poppins">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Why BPIT Squad Loves This Trip</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Highlights of BPIT Udaipur Getaway
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Everything you need for an unforgettable college road trip with your friends.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((h, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="p-6 rounded-2xl bg-card border border-border/60 hover:border-blue-500/40 hover:shadow-lg transition-all duration-300 space-y-3"
            >
              <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-blue-600">
                <h.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{h.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{h.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
