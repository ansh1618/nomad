import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Reveal } from "@/components/site/Reveal";
import { triggerNomadikPlanner } from "@/components/site/TripPlannerDialog";
import { Phone, MessageCircle, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us & Book Consultation | Nomadik" },
      { name: "description", content: "Contact Nomadik. Schedule a free consultation call, request callback, or message our Trip Captains directly on WhatsApp." },
    ],
  }),
  component: ContactRoute,
});

const hours = [
  { day: "Monday – Friday", time: "9:00 AM – 8:00 PM" },
  { day: "Saturday", time: "10:00 AM – 6:00 PM" },
  { day: "Sunday", time: "By appointment" },
];

function ContactRoute() {
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you! A Nomadik Trip Captain will contact you shortly.");
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="pt-24 pb-20 font-sans text-foreground">
        
        {/* Banner */}
        <section className="bg-ocean py-20 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 max-w-7xl mx-auto px-5 text-center space-y-4">
            <Reveal>
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">GET IN TOUCH</span>
              <h1 className="font-display text-4xl font-bold sm:text-6xl mt-2">Connect With Nomadik</h1>
              <p className="max-w-2xl mx-auto text-sm text-white/80 mt-3">
                Have questions about a route? Want to coordinate a custom corporate trip? We're ready to explore with you.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Contact Split */}
        <section className="max-w-7xl mx-auto px-5 py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            
            {/* Form Column */}
            <Reveal>
              <form onSubmit={handleContactSubmit} className="rounded-3xl border border-border bg-card p-8 shadow-elegant space-y-4">
                <h3 className="font-display text-2xl font-bold text-primary">Send a Message</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input placeholder="Full Name" required className="h-12 bg-white" />
                  <Input type="email" placeholder="Email Address" required className="h-12 bg-white" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input type="tel" placeholder="Phone Number" required className="h-12 bg-white" />
                  <Input placeholder="Route of Interest" className="h-12 bg-white" />
                </div>
                <Textarea placeholder="How can we help you plan your road trip?" className="min-h-32 bg-white" />
                <Button type="submit" variant="hero" size="lg" className="w-full h-12 shadow-gold">
                  Send Inquiry
                </Button>

                {/* Instant Actions */}
                <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-border mt-6">
                  <Button type="button" variant="ocean" className="flex-1" onClick={() => triggerNomadikPlanner({ tab: "consultation" })}>
                    Book Free Consultation
                  </Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => triggerNomadikPlanner({ tab: "callback" })}>
                    Request Call Back
                  </Button>
                </div>
              </form>
            </Reveal>

            {/* Info Column */}
            <Reveal className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-border rounded-2xl bg-card p-6 shadow-soft">
                  <MapPin className="h-6 w-6 text-accent" />
                  <h4 className="mt-3 font-poppins font-bold text-sm text-primary uppercase">Office Hub</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Sector 62, Noida, Delhi NCR, India 201301
                  </p>
                </div>
                <div className="border border-border rounded-2xl bg-card p-6 shadow-soft">
                  <Mail className="h-6 w-6 text-accent" />
                  <h4 className="mt-3 font-poppins font-bold text-sm text-primary uppercase">Email Support</h4>
                  <p className="mt-1 text-xs text-muted-foreground">hello@thenomadiktraveller.com</p>
                </div>
              </div>

              {/* Hours */}
              <div className="border border-border rounded-2xl bg-card p-6 shadow-soft space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-3">
                  <Clock className="h-5 w-5 text-accent" />
                  <h4 className="font-poppins font-bold text-sm text-primary uppercase tracking-wide">Business Hours</h4>
                </div>
                <ul className="space-y-2">
                  {hours.map((h) => (
                    <li key={h.day} className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-sans">{h.day}</span>
                      <span className="font-semibold text-foreground font-poppins">{h.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interactive OpenStreetMap */}
              <div className="overflow-hidden rounded-2xl border border-border shadow-soft">
                <iframe
                  title="Nomadik Noida Hub Location"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=77.34%2C28.61%2C77.39%2C28.65&layer=mapnik&marker=28.625%2C77.365"
                  className="h-60 w-full border-0"
                  loading="lazy"
                />
              </div>
            </Reveal>

          </div>
        </section>

      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
