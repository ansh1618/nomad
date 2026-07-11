import { useQuery } from "@tanstack/react-query";
import { Reveal } from "./Reveal";
import { CheckCircle2, Settings, ShieldCheck, Heart, Star, Camera } from "lucide-react";
import { getCmsSection } from "@/lib/queries/cms";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckCircle2,
  Settings,
  ShieldCheck,
  Heart,
  Star,
  Camera,
};

interface PromiseStep {
  icon: string;
  title: string;
  desc: string;
}

const DEFAULT_STEPS: PromiseStep[] = [
  { icon: "CheckCircle2", title: "Book", desc: "Select your desired path and lock your seat. A Trip Captain will call to welcome you to the tribe." },
  { icon: "Settings", title: "Plan", desc: "We finalize vetted cottage stays, route permits, safety checklists, and prepare you for the caravan." },
  { icon: "ShieldCheck", title: "Travel", desc: "Hit the road in our AC Tempo Traveller caravans with co-explorers and experienced drivers." },
  { icon: "Heart", title: "Memories", desc: "Return home with custom drone videos, campfire stories, and co-traveler connections that stay." },
];

export function OurPromise() {
  const { data: section } = useQuery({
    queryKey: ["cms", "our_promise"],
    queryFn: () => getCmsSection("our_promise"),
    staleTime: 1000,
  });

  const sectionTitle = section?.title || "Our Promise";
  const sectionSubtitle = section?.subtitle || "ON-ROAD JOURNEY";
  const sectionDesc = (section?.content as any)?.description || "Every step of your adventure is crafted for slow travel and connection.";
  const steps: PromiseStep[] = (section?.content as any)?.steps || DEFAULT_STEPS;

  return (
    <section className="mx-auto max-w-7xl px-5 py-24 bg-muted/20 rounded-3xl border border-border">
      <Reveal className="mx-auto max-w-2xl text-center pb-12">
        <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">{sectionSubtitle}</span>
        <h2 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">{sectionTitle}</h2>
        <p className="mt-3 text-muted-foreground text-sm">{sectionDesc}</p>
      </Reveal>

      <div className="relative mt-12 max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-secondary to-gold hidden md:block -translate-x-1/2" />
        {steps.map((s, i) => {
          const Icon = ICON_MAP[s.icon] || CheckCircle2;
          return (
            <Reveal key={`${s.title}-${i}`} delay={i} className="relative flex-1 text-center bg-white border border-border rounded-2xl p-6 shadow-soft z-10 hover:border-gold transition-colors duration-300">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gold-gradient text-gold-foreground shadow-gold">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-primary">
                {i + 1}. {s.title}
              </h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed font-sans">
                {s.desc}
              </p>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
