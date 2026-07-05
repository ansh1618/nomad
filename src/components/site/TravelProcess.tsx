import { Search, Settings2, CalendarCheck, PartyPopper } from "lucide-react";
import { Reveal } from "./Reveal";

const steps = [
  { icon: Search, title: "Choose Package", desc: "Browse handcrafted destinations and pick your favorite." },
  { icon: Settings2, title: "Customize Trip", desc: "Tailor dates, stays and experiences to fit you perfectly." },
  { icon: CalendarCheck, title: "Confirm Booking", desc: "Secure your trip with safe, flexible payment options." },
  { icon: PartyPopper, title: "Enjoy Vacation", desc: "Pack your bags — we handle every detail from here." },
];

export function TravelProcess() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-bold uppercase tracking-[0.2em] text-gold">Simple & seamless</span>
        <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
          How It Works
        </h2>
        <p className="mt-4 text-muted-foreground">Your dream trip is just four easy steps away.</p>
      </Reveal>

      <div className="relative mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent lg:block" />
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i} className="relative text-center">
            <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ocean text-primary-foreground shadow-elegant">
              <s.icon className="h-7 w-7" />
              <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-gold-gradient text-xs font-bold text-gold-foreground shadow-gold">
                {i + 1}
              </span>
            </div>
            <h3 className="mt-5 font-display text-xl font-bold text-primary">{s.title}</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{s.desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
