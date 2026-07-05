import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Reveal } from "@/components/site/Reveal";
import { Compass, Users, Heart, ShieldCheck, Award } from "lucide-react";
import teamFounder from "@/assets/dest-udaipur.jpg"; // using Udaipur as nice backdrop placeholder for founder profile
import teamCaptain1 from "@/assets/dest-manali.jpg"; // using Manali as nice backdrop placeholder for team captain
import teamCaptain2 from "@/assets/dest-goa.jpg"; // using Goa as nice backdrop placeholder for team captain

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us & Meet the Captains | Nomadik" },
      { name: "description", content: "Learn about Nomadik's mission, values, and meet our founders, trip captains, and local guides." },
    ],
  }),
  component: AboutRoute,
});

const values = [
  { icon: Compass, title: "Experience-First", desc: "We prioritize local cafe walks, high-altitude summits, and stream walks over packed travel packages." },
  { icon: Users, title: "Tribe & Connection", desc: "We don't plan standard tours. We build communities, connect solo travelers, and coordinate co-travels." },
  { icon: ShieldCheck, title: "Explorer Safety", desc: "Vetted premium cottages, GPS-tracked caravans, and experienced mountain guides on all paths." }
];

const team = [
  { name: "Anshul Tanwar", role: "Co-Founder & Captain", img: teamFounder, bio: "Avid road traveler and explorer. Spends half the year mapping new trails in Kinnaur and Spiti Valley." },
  { name: "Vikram Malhotra", role: "Himachal Trip Lead", img: teamCaptain1, bio: "Triund & Jalori Pass specialist. Certified mountain guide with over 80 high-altitude group treks." },
  { name: "Shalini Dixit", role: "Rajasthan Explorer Lead", img: teamCaptain2, bio: "Heritage walking storyteller. Specializes in Udaipur haveli walks, local Rajasthani cuisines, and history." }
];

function AboutRoute() {
  return (
    <div className="bg-background min-h-screen flex flex-col justify-between">
      <Navbar />
      <main className="pt-24 pb-20 font-sans text-foreground">
        
        {/* Banner */}
        <section className="bg-ocean py-20 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 max-w-7xl mx-auto px-5 text-center space-y-4">
            <Reveal>
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">OUR STORY</span>
              <h1 className="font-display text-4xl font-bold sm:text-6xl mt-2">Why We Don't Sell Trips</h1>
              <p className="max-w-2xl mx-auto text-sm text-white/80 mt-3 italic font-display">
                \"We don't believe in selling destinations. We create memories, friendships, stories, and experiences that stay with you forever.\"
              </p>
            </Reveal>
          </div>
        </section>

        {/* Our Purpose */}
        <section className="max-w-4xl mx-auto px-5 py-20 text-center space-y-6">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-primary">Travel Beyond Ordinary</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              Nomadik was founded by a small group of friends who were tired of commercial tourist packages. Standard buses, crowded viewpoints, and rushed timelines left us feeling exhausted, not refreshed. We believed road travel should be about slow exploration, hidden mountain cafes, storytelling around bonfires, and building a community of friends. 
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              Today, Nomadik designs curated itineraries for travelers who seek experiences, not just pin drops. Every road we drive has a story waiting to be discovered.
            </p>
          </Reveal>
        </section>

        {/* Core Values */}
        <section className="bg-muted/30 py-20">
          <div className="max-w-7xl mx-auto px-5">
            <Reveal className="text-center pb-12">
              <h2 className="font-display text-3xl font-bold text-primary">Our Core Values</h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((v, i) => (
                <Reveal key={i} delay={i}>
                  <div className="bg-white border border-border p-8 rounded-3xl shadow-soft text-center space-y-4">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-gold-gradient text-gold-foreground shadow-gold">
                      <v.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-primary">{v.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Meet the Team */}
        <section className="max-w-7xl mx-auto px-5 py-20">
          <Reveal className="text-center pb-12">
            <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">THE TRIBE LEADER</span>
            <h2 className="font-display text-3xl font-bold text-primary mt-2">Meet Your Trip Captains</h2>
            <p className="text-xs text-muted-foreground mt-2">Experienced guides who lead all road convoys</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <Reveal key={i} delay={i}>
                <div className="border border-border bg-card rounded-3xl overflow-hidden shadow-soft flex flex-col h-full">
                  <div className="h-64 overflow-hidden relative">
                    <img src={member.img} alt={member.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <span className="absolute bottom-4 left-4 bg-gold-gradient text-gold-foreground font-poppins font-bold px-3 py-1 rounded-lg text-xs">
                      {member.role}
                    </span>
                  </div>
                  <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-display text-xl font-bold text-primary">{member.name}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed pt-2">
                        {member.bio}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}
