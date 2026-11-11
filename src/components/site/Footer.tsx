import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Mail, Phone, MapPin, MessageCircle, Sparkles, ShieldCheck } from "lucide-react";
import { useState } from "react";
import logoFallback from "@/assets/logo.jpg";
import { BRAND, WHATSAPP_NUMBER_DISPLAY, getWhatsAppUrl } from "@/config/brand";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/lib/queries/cms";
import { GoNomadikLogo } from "./GoNomadikLogo";

const FOOTER_DESTINATIONS = [
  { name: "Munsiyari Trek", slug: "munsiyari" },
  { name: "Kedarkantha Winter Summit", slug: "kedarkantha" },
  { name: "Kedarnath Dham Expedition", slug: "kedarnath" },
  { name: "Badrinath & Vasudhara Falls", slug: "badrinath-vasudhara" },
  { name: "Yulla Kanda Lake", slug: "yulla-kanda" },
  { name: "Rudranath & Kalpeshwar", slug: "rudranath-kalpeshwar" },
  { name: "Madmaheshwar Trek", slug: "madmaheshwar" },
  { name: "Kasol & Kheerganga", slug: "kasol-kheerganga" },
  { name: "Manali & Solang Valley", slug: "manali" },
  { name: "Jibhi & Jalori Pass", slug: "jibhi" },
  { name: "Chopta & Tungnath", slug: "chopta-tungnath" },
  { name: "McLeod Ganj & Triund", slug: "mcleodganj" },
];

export function Footer() {
  const year = new Date().getFullYear();

  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: getSiteSettings,
    staleTime: 5000,
  });

  const supportPhone = settings?.support_phone || BRAND.phones[0];
  const supportPhone2 = settings?.support_phone_2 || BRAND.phones[1];
  const supportEmail = "admin@gonomadik.in";
  const address = settings?.address || "Delhi NCR (Akshardham / Majnu ka Tilla Hub), India";
  const instagramUrl = settings?.instagram_url || BRAND.instagram;
  const youtubeUrl = settings?.youtube_url || "https://youtube.com/@gonomadik";

  return (
    <footer className="bg-[#0A1622] text-white relative overflow-hidden border-t border-white/10">
      {/* Decorative Brand Accent Glows */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-gold/10 blur-[130px]" />
      <div className="pointer-events-none absolute -left-40 -bottom-40 h-96 w-96 rounded-full bg-[#163A5F]/40 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 pt-20 pb-10">
        {/* Top Grid */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Info Column */}
          <div className="space-y-5 lg:col-span-2">
            <Link to="/" className="inline-block transition-transform hover:scale-105 duration-200">
              <GoNomadikLogo variant="dark" size="lg" />
            </Link>

            <div className="inline-block">
              <span className="text-[11px] font-poppins font-extrabold uppercase tracking-[0.25em] text-gold">
                TRAVEL MORE • DISCOVER DEEPER.
              </span>
            </div>

            <p className="text-xs text-white/70 leading-relaxed max-w-md font-poppins">
              India's premier road trip and Himalayan adventure community. We craft transformative journeys, verified boutique stays, and authentic friendships that linger long after the road ends.
            </p>

            {/* Social Channels */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white/80 hover:bg-gold hover:text-[#0F2942] transition-all duration-300 shadow"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white/80 hover:bg-gold hover:text-[#0F2942] transition-all duration-300 shadow"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-10 w-10 place-items-center rounded-xl bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all duration-300 shadow"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>

            <div className="pt-2 flex items-center gap-2 text-xs font-poppins text-white/60">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <span>Registered Travel Operator • Delhi NCR</span>
            </div>
          </div>

          {/* Destinations Column (Split in 2 sub-columns for clean density) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-gold">
              Himalayan Destinations
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {FOOTER_DESTINATIONS.map((d) => (
                <Link
                  key={d.slug}
                  to={`/destinations/${d.slug}` as any}
                  className="text-xs text-white/65 hover:text-gold transition-colors font-poppins truncate"
                >
                  {d.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact Details Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-gold">
              Get In Touch
            </h4>
            <div className="space-y-3 font-poppins text-xs text-white/70">
              <a
                href={getWhatsAppUrl("Hi GoNomadik team! I have a question about your trips.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-[#25D366] hover:text-[#25D366]/80 font-semibold"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>WhatsApp: {WHATSAPP_NUMBER_DISPLAY}</span>
              </a>

              <a
                href={`tel:${supportPhone}`}
                className="flex items-center gap-2.5 hover:text-gold transition-colors"
              >
                <Phone className="h-4 w-4 shrink-0 text-gold" />
                <span>{supportPhone}</span>
              </a>

              {supportPhone2 && (
                <a
                  href={`tel:${supportPhone2}`}
                  className="flex items-center gap-2.5 hover:text-gold transition-colors"
                >
                  <Phone className="h-4 w-4 shrink-0 text-gold" />
                  <span>{supportPhone2}</span>
                </a>
              )}

              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center gap-2.5 hover:text-gold transition-colors"
              >
                <Mail className="h-4 w-4 shrink-0 text-gold" />
                <span className="truncate">{supportEmail}</span>
              </a>

              <div className="flex items-start gap-2.5 text-white/60 pt-1">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gold" />
                <span className="leading-relaxed">{address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Manifesto Quote */}
        <div className="mt-16 border-t border-white/10 pt-8 text-center">
          <p className="font-display text-base sm:text-lg italic text-white/50 tracking-wide">
            &ldquo;Jobs fill your pockets, but adventures fill your soul.&rdquo;
          </p>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row text-xs font-poppins text-white/50">
          <p>© 2026 GoNomadik. All rights reserved.</p>
          <div className="flex flex-wrap gap-6 text-[11px]">
            <Link to={"/privacy" as any} className="hover:text-gold transition-colors">
              Privacy Policy
            </Link>
            <Link to={"/terms" as any} className="hover:text-gold transition-colors">
              Terms & Conditions
            </Link>
            <Link to={"/cancellation" as any} className="hover:text-gold transition-colors">
              Cancellation & Refund Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
