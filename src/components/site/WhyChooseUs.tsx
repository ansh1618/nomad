import { useQuery } from "@tanstack/react-query";
import { Reveal } from "./Reveal";
import { Shield, Star, Users, IndianRupee, Headphones, Award, Compass, MapPin, Clock } from "lucide-react";
import { getCmsSection } from "@/lib/queries/cms";

interface ReasonCard {
  icon: string;
  title: string;
  text: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Star,
  Users,
  IndianRupee,
  Headphones,
  Award,
  Compass,
  MapPin,
  Clock
};

export function WhyChooseUs() {
  const { data: section } = useQuery({
    queryKey: ["cms", "features"],
    queryFn: () => getCmsSection("features"),
    staleTime: 1000,
  });

  const title = section?.title || "";
  const subtitle = section?.subtitle || "";
  const desc = (section?.content as any)?.description || "";
  const cards: ReasonCard[] = (section?.content as any)?.cards || [];

  return (
    <section id="why-us" className="relative overflow-hidden bg-primary py-24">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">
            {subtitle}
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-white/70 text-sm leading-relaxed">
            {desc}
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((r, i) => {
            const Icon = ICON_MAP[r.icon] || Award;
            return (
              <Reveal key={r.title} delay={i}>
                <div className="glass-dark group h-full rounded-3xl p-8 transition-all duration-400 hover:-translate-y-2 hover:bg-white/10 border border-white/5">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-gradient text-gold-foreground shadow-gold transition-transform duration-400 group-hover:scale-105">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-white">{r.title}</h3>
                  <p className="mt-3 text-xs leading-relaxed text-white/70 font-sans">{r.text}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

