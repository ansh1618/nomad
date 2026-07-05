import { Reveal } from "./Reveal";

interface Reason {
  title: string;
  desc: string;
  svg: React.ReactNode;
}

const reasons: Reason[] = [
  {
    title: "Expert Trip Planning",
    desc: "We spend months mapping hidden mountain cafes, campsites, and panoramic scenic points so you get a curated trail.",
    svg: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75h15m-15 5.625h15m-15 5.625h15M3 12l1.875 1.875L8.625 10" />
        <circle cx="4" cy="6.75" r="1" fill="currentColor" />
        <circle cx="4" cy="17.25" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Verified Stays",
    desc: "Vetted premium cottages, traditional wooden cabins, and heritage Havelis with reliable Wi-Fi and spectacular views.",
    svg: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.505-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    title: "Safe Road Journeys",
    desc: "All trips run in AC Tempo Traveller caravans led by GPS-tracked support systems and driven by seasoned highway captains.",
    svg: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: "Experienced Trip Captains",
    desc: "Ditch the standard tour guides. Travel with enthusiastic storytellers who double as photographers and campfire leads.",
    svg: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
  {
    title: "24×7 Trip Support",
    desc: "Real Trip Captains and coordinators standing by in our Delhi NCR headquarters to solve any on-road query in real time.",
    svg: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    ),
  },
  {
    title: "Flexible Itineraries",
    desc: "Want to spend an extra hour at the lakeside or start late? Our journeys respect your pace and visual cravings.",
    svg: (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
];

export function WhyChooseUs() {
  return (
    <section id="why-us" className="relative overflow-hidden bg-primary py-24">
      {/* Decorative background glows */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-poppins font-bold uppercase tracking-[0.25em] text-gold">
            THE NOMADIK PROMISE
          </span>
          <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
            Why We Don't Sell Trips
          </h2>
          <p className="mt-4 text-white/70 text-sm leading-relaxed">
            We don't believe in selling destinations. We create memories, friendships, stories and experiences that stay with you forever.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <Reveal key={r.title} delay={i}>
              <div className="glass-dark group h-full rounded-3xl p-8 transition-all duration-400 hover:-translate-y-2 hover:bg-white/10 border border-white/5">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gold-gradient text-gold-foreground shadow-gold transition-transform duration-400 group-hover:scale-105">
                  {r.svg}
                </div>
                <h3 className="mt-6 font-display text-xl font-bold text-white">{r.title}</h3>
                <p className="mt-3 text-xs leading-relaxed text-white/70 font-sans">{r.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
