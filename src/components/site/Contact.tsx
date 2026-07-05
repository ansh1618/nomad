import { Phone, MessageCircle, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BRAND } from "@/config/brand";
import { Reveal } from "./Reveal";
import { toast } from "sonner";

const hours = [
  { day: "Monday – Friday", time: "9:00 AM – 8:00 PM" },
  { day: "Saturday", time: "10:00 AM – 6:00 PM" },
  { day: "Sunday", time: "By appointment" },
];

export function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden bg-gradient-to-b from-secondary/60 to-background py-24">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-gold">
            Let's plan together
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-primary sm:text-5xl">
            Get Your Free Quote
          </h2>
          <p className="mt-4 text-muted-foreground">
            Tell us about your dream trip and our travel experts will craft a personalized plan.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Reveal>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Thank you! Our travel expert will contact you shortly.");
                (e.target as HTMLFormElement).reset();
              }}
              className="rounded-3xl bg-card p-8 shadow-elegant"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input placeholder="Full name" required className="h-12" />
                <Input type="email" placeholder="Email address" required className="h-12" />
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input type="tel" placeholder="Phone number" className="h-12" />
                <Input placeholder="Destination of interest" className="h-12" />
              </div>
              <Textarea
                placeholder="Tell us about your ideal trip…"
                className="mt-4 min-h-32"
              />
              <Button type="submit" variant="hero" size="lg" className="mt-5 w-full">
                Request Free Quote
              </Button>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="ocean" className="flex-1">
                  <a href={`https://wa.me/${BRAND.phones[0].replace("+91", "91")}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="h-4 w-4" /> WhatsApp Us
                  </a>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <a href={`tel:${BRAND.phones[0]}`}>
                    <Phone className="h-4 w-4" /> Call Now
                  </a>
                </Button>
              </div>
            </form>
          </Reveal>

          <Reveal delay={1} className="flex flex-col gap-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-card p-6 shadow-soft">
                <MapPin className="h-6 w-6 text-gold" />
                <h4 className="mt-3 font-bold text-primary">Visit Us</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  221 Marine Drive, Mumbai, India 400020
                </p>
              </div>
              <div className="rounded-2xl bg-card p-6 shadow-soft">
                <Mail className="h-6 w-6 text-gold" />
                <h4 className="mt-3 font-bold text-primary">Email Us</h4>
                <p className="mt-1 text-sm text-muted-foreground">hello@wandernest.travel</p>
              </div>
            </div>

            <div className="rounded-2xl bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-gold" />
                <h4 className="font-bold text-primary">Business Hours</h4>
              </div>
              <ul className="mt-4 space-y-2">
                {hours.map((h) => (
                  <li key={h.day} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{h.day}</span>
                    <span className="font-semibold text-foreground">{h.time}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl shadow-soft">
              <iframe
                title="WanderNest Travels location"
                src="https://www.openstreetmap.org/export/embed.html?bbox=72.8%2C18.9%2C72.86%2C18.95&layer=mapnik&marker=18.925%2C72.83"
                className="h-64 w-full border-0"
                loading="lazy"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
