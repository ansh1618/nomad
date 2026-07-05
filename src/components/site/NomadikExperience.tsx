import { Reveal } from "./Reveal";
import { Compass, BookOpen, Backpack, Compass as CompassIcon, Sparkles, Heart } from "lucide-react";

const steps = [
  { icon: Compass, title: "Discover", desc: "Browse handpicked mountain roads, old heritage lanes, and active group departures." },
  { icon: BookOpen, title: "Book", desc: "Secure your explorer seat with a token deposit. Splitting payments is supported." },
  { icon: Backpack, title: "Pack", desc: "Receive our Trip Captain's custom packing logs, gear checks, and weather alerts." },
  { icon: CompassIcon, title: "Travel", desc: "Depart in road caravans, listening to acoustic soundtracks and exploring secret routes." },
  { icon: Sparkles, title: "Explore", desc: "Embark on guided walks to hidden streams, old village castles, and local food trials." },
  { icon: Heart, title: "Remember", desc: "Re-live the road trip memories in our WhatsApp tribe and co-traveler meetups." },
];

export function NomadikExperience() {
  return (
    <section className="bg-primary text-white py-24 relative overflow-hidden">
      <div className="pointer-events-none absolute -left-36 -top-36 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-36 -bottom-36 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center pb-16">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">THE NOMADIK VIBE</span>
          <h2 className="mt-2 font-display text-4xl font-bold text-white sm:text-5xl">The Nomadik Experience</h2>
          <p className="mt-3 text-white/70 text-sm">A horizontal trail map of how we build connections and run road trips.</p>
        </Reveal>

        <div className="relative mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-6">
          <div className="absolute left-6 right-6 top-10 hidden h-0.5 bg-gradient-to-r from-secondary via-gold to-secondary lg:block" />
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i} className="relative z-10 text-center flex flex-col items-center space-y-4">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gold-gradient text-gold-foreground shadow-gold relative">
                <s.icon className="h-5 w-5" />
                <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-[9px] font-bold text-primary shadow">
                  {i + 1}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-lg font-bold text-white">{s.title}</h3>
                <p className="text-[11px] text-white/60 leading-relaxed font-sans max-w-[150px] mx-auto">
                  {s.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
