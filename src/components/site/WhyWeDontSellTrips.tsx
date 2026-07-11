import { useQuery } from "@tanstack/react-query";
import { Reveal } from "./Reveal";
import { triggerNomadikPlanner } from "./TripPlannerDialog";
import { Button } from "@/components/ui/button";
import { getCmsSection } from "@/lib/queries/cms";

export function WhyWeDontSellTrips() {
  const { data: section } = useQuery({
    queryKey: ["cms", "manifesto"],
    queryFn: () => getCmsSection("manifesto"),
    staleTime: 1000,
  });

  const badge = (section?.content as any)?.badge || "OUR MANIFESTO";
  const title = section?.title || "We Don't Believe in Selling Trips.";
  const quote = section?.subtitle || "\"We create memories, friendships, stories and experiences that stay with you forever. Nomadik isn't a booking site; it's a doorway to a tribe of explorers who believe every road has a story.\"";
  const ctaLabel = (section?.content as any)?.cta_label || "Become A Nomadik Explorer";

  return (
    <section className="bg-background py-24 border-t border-b border-border relative overflow-hidden">
      {/* Decorative vector path representing winding road */}
      <div className="absolute inset-y-0 right-0 w-1/3 opacity-5 pointer-events-none hidden lg:block">
        <svg className="w-full h-full text-primary" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M10 0 Q40 40 10 70 T90 100" strokeDasharray="3 3" />
        </svg>
      </div>

      <div className="mx-auto max-w-4xl px-5 text-center space-y-8">
        <Reveal>
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold block">{badge}</span>
        </Reveal>
        
        <Reveal delay={1}>
          <h2 className="font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl leading-[1.1]">
            {title.includes("Selling Trips") ? (
              <>
                We Don't Believe in <br className="hidden sm:inline" />
                <span className="text-gradient-gold">Selling Trips.</span>
              </>
            ) : (
              title
            )}
          </h2>
        </Reveal>

        <Reveal delay={2} className="max-w-2xl mx-auto">
          <p className="font-display text-xl sm:text-2xl text-muted-foreground leading-relaxed italic">
            {quote}
          </p>
        </Reveal>

        <Reveal delay={3} className="pt-4">
          <Button size="lg" variant="hero" onClick={() => triggerNomadikPlanner()}>
            {ctaLabel}
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
