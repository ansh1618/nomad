import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { FloatingUI } from "@/components/site/FloatingUI";
import { Reveal } from "@/components/site/Reveal";
import { Compass, Users, ShieldCheck, Instagram, Linkedin, Mail, Mountain, Bus, Star, MapPin } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us | Nomadik Founders & Story" },
      { name: "description", content: "Meet Harsh Kumar Jha and Ansh Goyal, the founders behind Nomadik, creating safer, simpler, and meaningful road travel experiences." },
    ],
  }),
  component: AboutRoute,
});

const values = [
  { 
    icon: Compass, 
    title: "Experience-First", 
    desc: "We prioritize local cafe walks, high-altitude summits, and stream walks over packed travel packages." 
  },
  { 
    icon: Users, 
    title: "Tribe & Connection", 
    desc: "We don't plan standard tours. We build communities, connect solo travelers, and coordinate co-travels." 
  },
  { 
    icon: ShieldCheck, 
    title: "Explorer Safety", 
    desc: "Vetted premium cottages, GPS-tracked caravans, and experienced mountain guides on all paths." 
  }
];

const founders = [
  {
    name: "Harsh Kumar Jha",
    role: "Founder",
    image: "/images/team/harsh-kumar-jha.jpg",
    bio: "The dreamer and the doer. Harsh handles the big picture, partnerships and everything that keeps Nomadik moving forward.",
    socials: {
      instagram: "#",
      linkedin: "#",
      email: "mailto:harsh@nomadik.co.in"
    }
  },
  {
    name: "Ansh Goyal",
    role: "Co-Founder & Tech Lead",
    image: "/images/team/ansh-goyal.jpg",
    bio: "The coder and the planner. Ansh builds the tech, designs the systems and turns ideas into smooth travel experiences.",
    socials: {
      instagram: "#",
      linkedin: "#",
      email: "mailto:ansh@nomadik.co.in"
    }
  }
];

function AboutRoute() {
  return (
    <div className="bg-[#FAF9F5] min-h-screen flex flex-col justify-between selection:bg-[#F59E0B]/20">
      <Navbar />
      <main className="pt-24 pb-20 font-sans text-foreground">
        
        {/* Hero Banner */}
        <section className="bg-[#0F172A] py-20 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-amber-900/20" />
          <div className="relative z-10 max-w-7xl mx-auto px-5 text-center space-y-4">
            <Reveal>
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-[#F59E0B] bg-[#F59E0B]/10 px-4 py-1.5 rounded-full border border-[#F59E0B]/30">
                OUR STORY & MISSION
              </span>
              <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-wide mt-3 text-white">
                Why We Don't Sell Trips
              </h1>
              <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/80 mt-3 italic font-display leading-relaxed">
                "We don't believe in selling destinations. We create memories, friendships, stories, and experiences that stay with you forever."
              </p>
            </Reveal>
          </div>
        </section>

        {/* Our Purpose */}
        <section className="max-w-4xl mx-auto px-5 py-16 text-center space-y-4">
          <Reveal>
            <h2 className="font-display text-3xl font-bold text-[#0F172A]">Travel Beyond Ordinary</h2>
            <p className="text-sm text-slate-600 leading-relaxed mt-4">
              Nomadik was founded by friends who were tired of commercial tourist packages. Standard buses, crowded viewpoints, and rushed timelines left us feeling exhausted, not refreshed. We believed road travel should be about slow exploration, hidden mountain cafes, storytelling around bonfires, and building a community of lifelong friends. 
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              Today, Nomadik designs curated road itineraries for travelers who seek true experiences, not just pin drops. Every road we drive has a story waiting to be discovered.
            </p>
          </Reveal>
        </section>

        {/* Core Values */}
        <section className="bg-white py-16 border-y border-slate-200/60">
          <div className="max-w-7xl mx-auto px-5">
            <Reveal className="text-center pb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#0F172A]">Our Core Values</h2>
              <div className="w-12 h-1 bg-[#F59E0B] mx-auto mt-3 rounded-full" />
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((v, i) => (
                <Reveal key={i} delay={i}>
                  <div className="bg-[#FAF9F5] border border-slate-200 p-8 rounded-3xl text-center space-y-4 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F59E0B]/15 text-[#D97706] border border-[#F59E0B]/30">
                      <v.icon className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-xl font-bold text-[#0F172A]">{v.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{v.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* The Founders Section */}
        <section className="py-20 bg-[#FAF9F5] relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-5">
            
            {/* Header */}
            <Reveal className="text-center max-w-2xl mx-auto mb-14 space-y-2">
              <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-[#D97706]">
                THE NOMADIK TEAM
              </span>
              <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#0F172A] tracking-tight">
                The Founders Behind Nomadik
              </h2>
              <p className="text-sm text-slate-600 font-poppins pt-2 leading-relaxed">
                We're just two travel-obsessed friends on a mission to make road trips safer, simpler and a lot more meaningful.
              </p>
            </Reveal>

            {/* Founders Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
              {founders.map((founder, idx) => (
                <Reveal key={founder.name} delay={idx}>
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row items-center gap-6 h-full">
                    {/* Founder Photo */}
                    <div className="w-full sm:w-48 aspect-[3/4] rounded-2xl overflow-hidden shrink-0 shadow-md border border-slate-100">
                      <img 
                        src={founder.image} 
                        alt={founder.name}
                        className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Bio Info */}
                    <div className="space-y-3 flex-1 text-left">
                      <div>
                        <h3 className="font-display text-2xl font-bold text-[#0F172A] leading-tight">
                          {founder.name}
                        </h3>
                        <p className="text-xs font-poppins font-semibold text-[#D97706] uppercase tracking-wider mt-1">
                          {founder.role}
                        </p>
                      </div>

                      <div className="w-8 h-0.5 bg-[#F59E0B]" />

                      <p className="text-xs text-slate-600 font-poppins leading-relaxed">
                        {founder.bio}
                      </p>

                      {/* Social Icons */}
                      <div className="flex items-center gap-2.5 pt-2">
                        <a 
                          href={founder.socials.instagram} 
                          target="_blank" 
                          rel="noreferrer"
                          aria-label="Instagram"
                          className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#D97706] hover:border-[#D97706] hover:bg-amber-50 transition-all"
                        >
                          <Instagram className="h-4 w-4" />
                        </a>
                        <a 
                          href={founder.socials.linkedin} 
                          target="_blank" 
                          rel="noreferrer"
                          aria-label="LinkedIn"
                          className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#D97706] hover:border-[#D97706] hover:bg-amber-50 transition-all"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                        <a 
                          href={founder.socials.email}
                          aria-label="Email"
                          className="h-8 w-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-[#D97706] hover:border-[#D97706] hover:bg-amber-50 transition-all"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Stats Counter Banner */}
            <Reveal className="mt-16 max-w-5xl mx-auto">
              <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8 shadow-2xl text-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
                  <div className="space-y-1.5 p-2">
                    <div className="flex items-center justify-center gap-2">
                      <Users className="h-5 w-5 text-[#F59E0B]" />
                      <span className="font-display text-2xl sm:text-3xl font-bold text-white">5000+</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-poppins uppercase tracking-wider">Happy Travelers</p>
                  </div>

                  <div className="space-y-1.5 p-2 pt-4 md:pt-2">
                    <div className="flex items-center justify-center gap-2">
                      <Mountain className="h-5 w-5 text-[#F59E0B]" />
                      <span className="font-display text-2xl sm:text-3xl font-bold text-white">25+</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-poppins uppercase tracking-wider">Unique Destinations</p>
                  </div>

                  <div className="space-y-1.5 p-2 pt-4 md:pt-2">
                    <div className="flex items-center justify-center gap-2">
                      <Bus className="h-5 w-5 text-[#F59E0B]" />
                      <span className="font-display text-2xl sm:text-3xl font-bold text-white">100+</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-poppins uppercase tracking-wider">Road Journeys</p>
                  </div>

                  <div className="space-y-1.5 p-2 pt-4 md:pt-2">
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-5 w-5 text-[#F59E0B] fill-[#F59E0B]" />
                      <span className="font-display text-2xl sm:text-3xl font-bold text-white">4.9/5</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-poppins uppercase tracking-wider">Traveler Rating</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Quote at Bottom */}
            <Reveal className="mt-16 text-center max-w-2xl mx-auto space-y-3">
              <span className="text-4xl text-[#F59E0B] font-serif leading-none block">“</span>
              <p className="font-display text-xl sm:text-2xl font-bold text-[#0F172A] italic leading-relaxed">
                We don't just plan trips, we create stories that stay with you forever.
              </p>
            </Reveal>

          </div>
        </section>

      </main>
      <Footer />
      <FloatingUI />
    </div>
  );
}

