import { Link } from "@tanstack/react-router";
import { Instagram, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import logoFallback from "@/assets/logo.jpg";
import { BRAND } from "@/config/brand";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings, getFooterSections } from "@/lib/queries/cms";
import { getDestinations } from "@/lib/queries/destinations";

export function Footer() {
  const [email, setEmail] = useState("");
  const year = new Date().getFullYear();

  // 1. Fetch site settings mapping
  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: getSiteSettings,
    staleTime: 1000,
  });

  // 2. Fetch footer sections custom links
  const { data: dbFooterSections = [] } = useQuery({
    queryKey: ["footer_sections"],
    queryFn: getFooterSections,
    staleTime: 1000,
  });

  // 3. Fetch published destinations to build dynamic list
  const { data: destsResult } = useQuery({
    queryKey: ["destinations", "published-footer"],
    queryFn: () => getDestinations({ page: 1, pageSize: 6, status: "PUBLISHED" }),
    staleTime: 1000,
  });

  const publishedDests = destsResult?.data ?? [];

  // Extract contact fields
  const supportPhone = settings?.support_phone || BRAND.phones[0];
  const supportPhone2 = settings?.support_phone_2 || BRAND.phones[1];
  const supportEmail = settings?.support_email || BRAND.email;
  const address = settings?.address || "Delhi NCR, India";
  
  const logoUrl = settings?.logo_url || logoFallback;
  const copyrightText = settings?.footer_copyright || `© ${year} The Nomadik Traveller. All rights reserved.`;
  const footerQuote = settings?.footer_quote || "Life is short. Take the scenic route.";

  // Social links from settings or BRAND fallback
  const instagramUrl = settings?.instagram_url || BRAND.instagram;
  const youtubeUrl = settings?.youtube_url || "https://youtube.com/@gonomadik";
  const redditUrl = settings?.reddit_url || "https://www.reddit.com/user/gonomadik/";

  // Render columns. We check if DB footer sections exist. If not, use standard columns.
  const renderFooterColumns = () => {
    if (dbFooterSections && dbFooterSections.length > 0) {
      return dbFooterSections.map((sec) => (
        <div key={sec.id}>
          <h4 className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-gold mb-5">
            {sec.title}
          </h4>
          <ul className="space-y-3">
            {sec.links?.map((link, idx) => {
              const isExt = link.is_external;
              if (isExt) {
                return (
                  <li key={idx}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/60 hover:text-gold transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                );
              }
              return (
                <li key={idx}>
                  <Link
                    to={link.href as any}
                    className="text-sm text-white/60 hover:text-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ));
    }

    // Default fallback columns
    return (
      <>
        {/* Dynamic Destinations Column */}
        <div>
          <h4 className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-gold mb-5">
            Destinations
          </h4>
          <ul className="space-y-3">
            {publishedDests.length > 0 ? (
              publishedDests.map((d) => (
                <li key={d.id}>
                  <Link
                    to={`/destinations/${d.slug}` as any}
                    className="text-sm text-white/60 hover:text-gold transition-colors duration-200"
                  >
                    {d.name}
                  </Link>
                </li>
              ))
            ) : (
              <>
                <li><Link to="/manali" className="text-sm text-white/60 hover:text-gold transition-colors">Manali</Link></li>
                <li><Link to="/jibhi" className="text-sm text-white/60 hover:text-gold transition-colors">Jibhi</Link></li>
                <li><Link to="/chopta-tungnath" className="text-sm text-white/60 hover:text-gold transition-colors">Chopta</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Company Links Column */}
        <div>
          <h4 className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-gold mb-5">
            Company
          </h4>
          <ul className="space-y-3">
            <li>
              <Link to="/about" className="text-sm text-white/60 hover:text-gold transition-colors duration-200">
                About Nomadik
              </Link>
            </li>
            <li>
              <Link to="/stories" className="text-sm text-white/60 hover:text-gold transition-colors duration-200">
                Stories
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-sm text-white/60 hover:text-gold transition-colors duration-200">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      </>
    );
  };

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
              <img src={logoUrl} alt="Nomadik" className="h-14 w-auto rounded-lg object-contain" />
            </Link>
            <p className="text-xs text-white/60 leading-relaxed max-w-xs">
              Premium curated road trips across India. We don't sell destinations — we create memories, 
              friendships, and stories that stay with you forever.
            </p>
            <div className="flex gap-3">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-gold hover:text-gold-foreground transition-all duration-300"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-gold hover:text-gold-foreground transition-all duration-300"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href={redditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/70 hover:bg-gold hover:text-gold-foreground transition-all duration-300"
                aria-label="Reddit"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.85-1.64-6.28-1.72l1.32-4.16 4.31.92c.04.97.85 1.76 1.84 1.76 1.02 0 1.85-.83 1.85-1.85S18.99 3 17.97 3c-.76 0-1.42.46-1.71 1.12l-4.73-1c-.21-.04-.42.09-.49.3l-1.61 5.08C7.03 6.58 4.79 7.21 3.14 8.24 2.58 7.48 1.68 7 0.72 7 1.35 7 0 8.35 0 10c0 .96.48 1.86 1.24 2.42-.05.34-.08.69-.08 1.05 0 3.75 4.34 6.8 9.68 6.8s9.68-3.05 9.68-6.8c0-.36-.03-.71-.08-1.05.76-.56 1.24-1.46 1.24-2.42zm-16 2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm8.4 2.75c-.94.94-2.73.94-3.67 0-.2-.2-.2-.51 0-.71.2-.2.51-.2.71 0 .55.55 1.71.55 2.26 0 .2-.2.51-.2.71 0 .2.2.2.51 0 .71zM15.5 14c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Render layout columns */}
          {renderFooterColumns()}

          {/* Contact Details Column */}
          <div>
            <h4 className="text-xs font-poppins font-bold uppercase tracking-[0.2em] text-gold mb-5">
              Support & Contact
            </h4>
            <div className="space-y-3 text-white/70">
              <a href={`tel:${supportPhone}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-gold transition-colors">
                <Phone className="h-4 w-4 shrink-0" /> {supportPhone}
              </a>
              {supportPhone2 && (
                <a href={`tel:${supportPhone2}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-gold transition-colors">
                  <Phone className="h-4 w-4 shrink-0" /> {supportPhone2}
                </a>
              )}
              <a href={`mailto:${supportEmail}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-gold transition-colors">
                <Mail className="h-4 w-4 shrink-0" /> {supportEmail}
              </a>
              <p className="flex items-start gap-2 text-sm text-white/60">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" /> {address}
              </p>
            </div>
          </div>
        </div>

        {/* Signature quote */}
        <div className="mt-16 border-t border-white/10 pt-8 text-center">
          <p className="font-display text-lg italic text-white/40">
            "{footerQuote}"
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-[10px] text-white/40 font-sans">
            {copyrightText}
          </p>
          <div className="flex gap-6 text-[10px] text-white/40 font-sans">
            <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
            <Link to="/cancellation" className="hover:text-white/60 transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

