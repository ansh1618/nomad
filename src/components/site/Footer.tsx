import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.jpg";
import { BRAND } from "@/config/brand";

const destinations = [
  { name: "Manali", to: "/manali" },
  { name: "Jibhi", to: "/jibhi" },
  { name: "Chopta & Tungnath", to: "/chopta-tungnath" },
  { name: "McLeod Ganj", to: "/mcleodganj" },
  { name: "Udaipur", to: "/udaipur" },
];

const company = [
  { name: "About Nomadik", to: "/about" },
  { name: "Stories", to: "/stories" },
  { name: "Contact Us", to: "/contact" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white relative overflow-hidden">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 pt-20 pb-8">
        {/* Top grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="space-y-5 lg:col-span-1">
            <Link to="/" className="inline-block">
              <img src={logo} alt="Nomadik" className="h-14 w-auto rounded-lg" />
            </Link>
            <p className="text-xs text-white/60 leading-relaxed max-w-xs">
              Premium curated road trips across India. We don't sell destinations — we create memories, 
              friendships, and stories that stay with you forever.
            </p>
            <div className="flex gap-3">
              <a
                href="https://instagram.com/thenomadiktraveller"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-gold hover:text-gold-foreground transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com/@thenomadiktraveller"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-gold hover:text-gold-foreground transition-all duration-300"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href="https://g.page/nomadik"
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-gold hover:text-gold-foreground transition-all duration-300"
                aria-label="Google Reviews"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Destinations column */}
          <div>
            <h4 className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-gold mb-5">
              Destinations
            </h4>
            <ul className="space-y-3">
              {destinations.map((d) => (
                <li key={d.to}>
                  <Link
                    to={d.to}
                    className="text-sm text-white/60 hover:text-gold transition-colors duration-200"
                  >
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h4 className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-gold mb-5">
              Company
            </h4>
            <ul className="space-y-3">
              {company.map((c) => (
                <li key={c.to}>
                  <Link
                    to={c.to}
                    className="text-sm text-white/60 hover:text-gold transition-colors duration-200"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-3">
              <a href={`tel:${BRAND.phones[0]}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-gold transition-colors">
                <Phone className="h-4 w-4" /> {BRAND.phones[0]}
              </a>
              <a href={`mailto:${BRAND.email}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-gold transition-colors">
                <Mail className="h-4 w-4" /> {BRAND.email}
              </a>
              <p className="flex items-start gap-2 text-sm text-white/60">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" /> Delhi NCR, India
              </p>
            </div>
          </div>

          {/* Newsletter column */}
          <div>
            <h4 className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-gold mb-5">
              Road Updates
            </h4>
            <p className="text-xs text-white/60 leading-relaxed mb-4">
              Get early access to new departures, secret routes, and community stories. No spam — just the open road.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setEmail("");
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-gold/50 transition-colors"
                required
              />
              <button
                type="submit"
                className="rounded-xl bg-gold-gradient px-4 py-2.5 text-xs font-poppins font-bold text-gold-foreground hover:opacity-90 transition-opacity shadow-gold"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Signature quote */}
        <div className="mt-16 border-t border-white/10 pt-8 text-center">
          <p className="font-display text-lg italic text-white/40">
            "Life is short. Take the scenic route."
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-[10px] text-white/40 font-sans">
            © {year} The Nomadik Traveller. All rights reserved.
          </p>
          <div className="flex gap-6 text-[10px] text-white/40 font-sans">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white/60 transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
