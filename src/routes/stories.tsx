import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Reveal } from "@/components/site/Reveal";
import { Star, MessageCircle, ArrowRight, Instagram, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Explorer Stories & Journals | Nomadik" },
      { name: "description", content: "Read our community's travel logs, checklists, reviews, and explore the Nomadik community forum." },
    ],
  }),
  component: StoriesRoute,
});

const blogs = [
  { title: "Top 10 Hidden Places in Himachal", category: "Secret Routes", readTime: "5 min read", desc: "Ditch the commercial trails. Explore the silent forests of Sethan, Jibhi, and Shangarh with our maps." },
  { title: "The Ultimate Mountain Packing Guide", category: "Pro Tips", readTime: "8 min read", desc: "From thermals to walking gear, what to carry (and what to leave behind) on a Himalayan trek." },
  { title: "Chopta: Best Cafes & Local Food Guide", category: "Foodie Trails", readTime: "4 min read", desc: "A guide to the finest local pahadi meals, organic tea stalls, and wood-fired cafes on the Tungnath route." },
  { title: "My First Solo Trip with Nomadik", category: "Explorer Log", readTime: "6 min read", desc: "How a 3-day weekend escape to Udaipur connected a solo traveler with a lifelong community of friends." },
  { title: "Essential Road Trip Checklist", category: "Safety Guides", readTime: "7 min read", desc: "Vitals to inspect before keying up your car engine for a long-distance mountain convoy." }
];

const reviews = [
  { name: "Suresh Menon", location: "Bangalore", text: "Nomadik isn't a typical travel agency. We drove through stunning passes, sang around bonfires, and made friendships that are staying for life." },
  { name: "Kriti Bhatia", location: "Delhi NCR", text: "As a female solo traveler, I was skeptical. But the Trip Captain made the entire road journey extremely comfortable and safe. The Jibhi cabins were gorgeous!" },
  { name: "Akash Singhal", location: "Mumbai", text: "The Udaipur road trip convoy was super organized. Spotless stays, local food stories, and no typical tourist rush. Extremely curated." }
];

function StoriesRoute() {
  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="pt-24 pb-20 font-sans text-foreground">
        
        {/* Header */}
        <section className="bg-ocean py-20 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 max-w-7xl mx-auto px-5 text-center space-y-4">
            <Reveal>
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">NOMADIK LOGS</span>
              <h1 className="font-display text-4xl font-bold sm:text-6xl mt-2">Explorer Stories</h1>
              <p className="max-w-2xl mx-auto text-sm text-white/80 mt-3">
                Road diaries, packing logs, verified reviews, and snapshots from the Nomadik explorer community.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Blog section - Travel Journal */}
        <section className="max-w-7xl mx-auto px-5 py-20">
          <Reveal className="text-center max-w-2xl mx-auto pb-12">
            <h2 className="font-display text-3xl font-bold text-primary">Travel Journal</h2>
            <p className="text-xs text-muted-foreground mt-2">Expert guides and stories by our Trip Captains</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((b, i) => (
              <Reveal key={i} delay={i} className="group">
                <article className="hover-lift border border-border bg-card p-6 rounded-3xl flex flex-col justify-between h-full space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-poppins font-bold text-accent uppercase tracking-wider">
                      <span>{b.category}</span>
                      <span className="text-muted-foreground font-normal normal-case">{b.readTime}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-primary group-hover:text-accent transition-colors">
                      {b.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                  <button className="text-xs font-poppins font-semibold text-secondary flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read Log <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Explorer Reviews */}
        <section className="bg-muted/30 py-20">
          <div className="max-w-4xl mx-auto px-5">
            <Reveal className="text-center pb-12">
              <h2 className="font-display text-3xl font-bold text-primary">Explorer Reviews</h2>
              <p className="text-xs text-muted-foreground mt-2">Verified feedback on the road trip experience</p>
            </Reveal>

            <div className="space-y-6">
              {reviews.map((r, i) => (
                <Reveal key={i} delay={i} className="bg-white border border-border p-6 rounded-2xl shadow-soft flex flex-col sm:flex-row gap-4 justify-between items-start">
                  <div className="space-y-2 max-w-2xl">
                    <p className="text-xs text-foreground/80 leading-relaxed italic">
                      "{r.text}"
                    </p>
                    <span className="block text-[11px] font-poppins font-bold text-primary">
                      — {r.name}, {r.location}
                    </span>
                  </div>
                  <div className="flex flex-col items-end shrink-0 gap-1 mt-2 sm:mt-0">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className="h-3.5 w-3.5 fill-gold text-gold" />
                      ))}
                    </div>
                    <span className="text-[9px] font-poppins text-muted-foreground tracking-wide font-bold">GOOGLE REVIEWS</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* WhatsApp Explorer Tribe CTA */}
        <section className="max-w-4xl mx-auto px-5 py-20">
          <Reveal className="bg-secondary text-white p-8 rounded-3xl shadow-elegant text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <Compass className="h-10 w-10 text-gold mx-auto animate-spin-slow" />
            <h2 className="font-display text-3xl font-bold text-white">Join The Nomadik Explorer Tribe</h2>
            <p className="text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
              Connect with fellow road travelers, discuss secret routes, access priority bookings, and coordinate co-travels in our private WhatsApp community.
            </p>
            <Button size="lg" variant="hero" className="shadow-gold uppercase tracking-wider text-xs px-8" asChild>
              <a href="https://wa.me/919999999999" target="_blank" rel="noreferrer">
                <MessageCircle className="h-4.5 w-4.5" /> Join WhatsApp Community
              </a>
            </Button>
          </Reveal>
        </section>

      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
