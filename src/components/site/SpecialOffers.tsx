import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Users, Mountain, Timer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { toast } from "sonner";
import { getCmsSection } from "@/lib/queries/cms";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart,
  Users,
  Mountain,
};

interface Offer {
  icon: string;
  title: string;
  desc: string;
  off: string;
  link?: string;
}

const DEFAULT_OFFERS: Offer[] = [
  {
    icon: "Heart",
    title: "Luxury Honeymoon",
    desc: "Romantic overwater villas, private dinners & spa retreats.",
    off: "Up to 30% OFF",
  },
  {
    icon: "Users",
    title: "Family Packages",
    desc: "Kid-friendly stays, activities and stress-free planning.",
    off: "Kids Go Free",
  },
  {
    icon: "Mountain",
    title: "Adventure Trips",
    desc: "Treks, safaris and adrenaline-packed guided expeditions.",
    off: "Up to 25% OFF",
  },
];

function useCountdown(target: number) {
  const [time, setTime] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setTime(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);

  const d = Math.floor(time / 86400000);
  const h = Math.floor((time % 86400000) / 3600000);
  const m = Math.floor((time % 3600000) / 60000);
  const s = Math.floor((time % 60000) / 1000);
  return { d, h, m, s };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass-dark flex flex-col items-center rounded-2xl px-4 py-3 sm:px-6">
      <span className="font-display text-3xl font-bold text-white sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-xs uppercase tracking-wider text-white/60">{label}</span>
    </div>
  );
}

export function SpecialOffers() {
  const target = useState(() => Date.now() + 1000 * 60 * 60 * 24 * 4 + 1000 * 60 * 60 * 7)[0];
  const { d, h, m, s } = useCountdown(target);

  const { data: section } = useQuery({
    queryKey: ["cms", "special_offers"],
    queryFn: () => getCmsSection("special_offers"),
    staleTime: 1000,
  });

  const sectionTitle = section?.title || "Special Offers Ending Soon";
  const sectionSubtitle = section?.subtitle || "Limited-time offers";
  const offers: Offer[] = (section?.content as any)?.offers || DEFAULT_OFFERS;

  return (
    <section id="offers" className="relative overflow-hidden bg-primary py-24">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-gold">
            <Timer className="h-4 w-4" /> {sectionSubtitle}
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
            {sectionTitle}
          </h2>
          <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
            <Unit value={d} label="Days" />
            <Unit value={h} label="Hours" />
            <Unit value={m} label="Mins" />
            <Unit value={s} label="Secs" />
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {offers.map((o, i) => {
            const Icon = ICON_MAP[o.icon] || Heart;
            return (
              <Reveal key={`${o.title}-${i}`} delay={i}>
                <div className="group flex h-full flex-col rounded-3xl bg-white p-8 shadow-soft transition-all duration-400 hover:-translate-y-2 hover:shadow-elegant">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-gold-gradient text-gold-foreground shadow-gold transition-transform duration-400 group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="mt-5 w-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                    {o.off}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold text-primary">{o.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{o.desc}</p>
                  <Button
                    variant="ocean"
                    className="mt-6 w-full"
                    onClick={() => {
                      if (o.link) {
                        window.open(o.link, "_blank");
                      } else {
                        toast.success(`Claiming offer: ${o.title}`);
                      }
                    }}
                  >
                    Claim Offer
                  </Button>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
