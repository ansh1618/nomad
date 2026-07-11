import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X, Compass, User, Calendar, Heart, HelpCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerNomadikPlanner } from "./TripPlannerDialog";
import { triggerNomadikAuth } from "./AuthModal";
import { useAuth } from "./AuthContext";
import { cn } from "@/lib/utils";
import logoFallback from "@/assets/logo.jpg";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings, getNavItems } from "@/lib/queries/cms";
import { BRAND } from "@/config/brand";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // 1. Fetch site settings
  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: getSiteSettings,
    staleTime: 1000,
  });

  // 2. Fetch custom nav items from DB
  const { data: dbNavLinks = [] } = useQuery({
    queryKey: ["nav_items"],
    queryFn: getNavItems,
    staleTime: 1000,
  });

  // Default hardcoded links if DB is empty
  const defaultNavLinks = [
    { label: "Destinations", href: "/#destinations", is_external: false },
    { label: "Journeys", href: "/#packages", is_external: false },
    { label: "Stories", href: "/stories", is_external: false },
    { label: "About", href: "/about", is_external: false },
    { label: "Contact", href: "/contact", is_external: false },
  ];

  const activeLinks = dbNavLinks.length > 0 ? dbNavLinks : defaultNavLinks;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getFirstName = () => {
    if (!profile?.full_name) return "Explorer";
    return profile.full_name.trim().split(" ")[0];
  };

  const logoUrl = settings?.logo_url || logoFallback;
  const companyName = settings?.company_name || BRAND.name;
  const companyFullName = settings?.company_tagline || BRAND.fullName;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "glass shadow-soft py-2" : "bg-transparent py-4",
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5">
        {/* Brand Logo Lockup */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/20 shadow-soft transition-transform duration-300 group-hover:scale-105">
            <img src={logoUrl} alt="Nomadik Logo Mark" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col text-left">
            <span
              className={cn(
                "font-poppins text-xl font-bold tracking-wider uppercase leading-none transition-colors",
                scrolled ? "text-primary" : "text-white",
              )}
            >
              {companyName}
            </span>
            <span className="text-[9px] font-sans font-bold tracking-widest uppercase leading-none mt-1.5 text-accent">
              {companyFullName}
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <ul className="hidden items-center gap-8 lg:flex">
          {activeLinks.map((l, i) => {
            const isAnchor = l.href.startsWith("/#") || l.href.startsWith("#");
            if (isAnchor || l.is_external) {
              return (
                <li key={i}>
                  <a
                    href={l.href}
                    className={cn(
                      "relative text-xs font-poppins font-semibold uppercase tracking-wider transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-gold after:transition-all hover:after:w-full",
                      scrolled ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white",
                    )}
                  >
                    {l.label}
                  </a>
                </li>
              );
            }
            return (
              <li key={i}>
                <Link
                  to={l.href as any}
                  className={cn(
                    "relative text-xs font-poppins font-semibold uppercase tracking-wider transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-gold after:transition-all hover:after:w-full",
                    scrolled ? "text-foreground/80 hover:text-primary" : "text-white/90 hover:text-white",
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Action CTAs */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={scrolled ? "glass" : "outlineLight"} className="h-10 px-4 font-poppins text-xs font-bold gap-2">
                  👤 Hi, {getFirstName()} ▼
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-white/95 border border-border shadow-elegant rounded-xl p-1.5 glass">
                <DropdownMenuItem asChild className="rounded-lg py-2 text-xs font-semibold cursor-pointer">
                  <Link to="/account" className="flex items-center gap-2 text-primary">
                    <User className="h-4 w-4 text-accent" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg py-2 text-xs font-semibold cursor-pointer">
                  <Link to="/account" className="flex items-center gap-2 text-primary">
                    <Calendar className="h-4 w-4 text-accent" /> My Bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg py-2 text-xs font-semibold cursor-pointer">
                  <Link to="/account" className="flex items-center gap-2 text-primary">
                    <Heart className="h-4 w-4 text-accent" /> Wishlist
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg py-2 text-xs font-semibold cursor-pointer">
                  <Link to="/account" className="flex items-center gap-2 text-primary">
                    <HelpCircle className="h-4 w-4 text-accent" /> Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={() => signOut().then(() => navigate({ to: "/" }))}
                  className="rounded-lg py-2 text-xs font-semibold cursor-pointer text-[#E53E3E] hover:bg-red-50 focus:bg-red-50"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" /> Logout
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <button
                onClick={() => triggerNomadikAuth({ mode: "login" })}
                className={cn(
                  "text-xs font-poppins font-bold uppercase tracking-wider transition-colors hover:text-accent cursor-pointer px-3 py-2",
                  scrolled ? "text-foreground" : "text-white",
                )}
              >
                Login
              </button>
              <Button
                variant={scrolled ? "glass" : "outlineLight"}
                onClick={() => triggerNomadikAuth({ mode: "signup" })}
                className="h-10 px-4 font-poppins text-xs font-bold"
              >
                Sign Up
              </Button>
            </>
          )}

          <Button variant={scrolled ? "default" : "hero"} size="lg" asChild>
            <Link to="/destinations">Book Now</Link>
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className={cn(
            "grid h-10 w-10 place-items-center rounded-lg lg:hidden transition-colors",
            scrolled ? "text-primary" : "text-white",
          )}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Drawer */}
      {open && (
        <div className="glass mx-4 mt-3 animate-scale-in rounded-2xl p-5 shadow-elegant lg:hidden">
          <ul className="flex flex-col gap-1">
            {activeLinks.map((l, i) => {
              const isAnchor = l.href.startsWith("/#") || l.href.startsWith("#");
              if (isAnchor || l.is_external) {
                return (
                  <li key={i}>
                    <a
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-xs font-poppins font-semibold uppercase tracking-wider text-foreground/80 hover:bg-secondary/10 hover:text-primary"
                    >
                      {l.label}
                    </a>
                  </li>
                );
              }
              return (
                <li key={i}>
                  <Link
                    to={l.href as any}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-xs font-poppins font-semibold uppercase tracking-wider text-foreground/80 hover:bg-secondary/10 hover:text-primary"
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          
          <div className="flex flex-col gap-3.5 mt-4 border-t border-border/40 pt-4">
            {user ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-poppins font-semibold px-3">👤 Logged in as: {getFirstName()}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild onClick={() => setOpen(false)}>
                    <Link to="/account">My Dashboard</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[#E53E3E]"
                    onClick={() => {
                      setOpen(false);
                      signOut().then(() => navigate({ to: "/" }));
                    }}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { setOpen(false); triggerNomadikAuth({ mode: "login" }); }}>
                  Login
                </Button>
                <Button variant="outline" onClick={() => { setOpen(false); triggerNomadikAuth({ mode: "signup" }); }}>
                  Sign Up
                </Button>
              </div>
            )}
            <Button variant="hero" className="w-full" asChild onClick={() => setOpen(false)}>
              <Link to="/destinations">Book Now</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

