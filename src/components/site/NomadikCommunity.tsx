import { Reveal } from "./Reveal";
import { MessageCircle, Users, Shield } from "lucide-react";
import { BRAND } from "@/config/brand";

export function NomadikCommunity() {
  return (
    <section className="bg-primary py-24 relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-5 text-center space-y-8">
        <Reveal>
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">
            JOIN THE TRIBE
          </span>
        </Reveal>

        <Reveal delay={1}>
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl leading-tight">
            The Nomadik <span className="text-gradient-gold">Explorer Community</span>
          </h2>
        </Reveal>

        <Reveal delay={2}>
          <p className="mx-auto max-w-xl text-white/70 text-sm leading-relaxed">
            Join 5,000+ explorers in our private WhatsApp community. Get early access to departures, 
            connect with co-travelers, share trip photos, and hear real road stories before anyone else.
          </p>
        </Reveal>

        <Reveal delay={3}>
          <div className="flex flex-wrap justify-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-white/80">
              <Users className="h-5 w-5 text-gold" />
              <span className="text-sm font-sans">5,000+ Members</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Shield className="h-5 w-5 text-gold" />
              <span className="text-sm font-sans">Verified Explorers Only</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <MessageCircle className="h-5 w-5 text-gold" />
              <span className="text-sm font-sans">Active Daily</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={4} className="pt-4">
          <a
            href={BRAND.community}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-[#25D366] px-8 py-4 text-sm font-poppins font-bold text-white shadow-lg hover:bg-[#20bd5a] transition-colors duration-300 hover:scale-105 transform"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Join WhatsApp Community
          </a>
        </Reveal>
      </div>
    </section>
  );
}
