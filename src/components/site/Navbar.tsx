/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  Menu,
  X,
  User,
  Calendar,
  Settings,
  CircleHelp,
  LogOut,
  Shield,
  MessageCircle,
  Compass,
  ChevronDown,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerNomadikAuth } from "./AuthModal";
import { useAuth } from "./AuthContext";
import { cn } from "@/lib/utils";
import logoFallback from "@/assets/logo.jpg";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/lib/queries/cms";
import { BRAND, getWhatsAppUrl } from "@/config/brand";
import { GoNomadikLogo } from "./GoNomadikLogo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface NavbarProps {
  /** auto     – homepage: transparent hero → dark-navy on scroll; light-bg pages: white header; dark-bg pages: dark-navy
   *  solid    – always dark-navy with white text
   *  transparent – always transparent (white text, use only on pages with dark hero images)
   *  light    – always light/white header with dark-navy text
   */
  variant?: "auto" | "solid" | "transparent" | "light";
  className?: string;
}

/** Pages whose body background is light (#F8F7F3 or white). The header
 *  on these pages should be white with dark-navy text so nav links are
 *  always readable from the very first frame, regardless of scroll state. */
const LIGHT_BG_PAGES = [
  "/privacy",
  "/terms",
  "/cancellation",
  "/about",
  "/contact",
  "/account",
  "/payment-demo",
  "/student-verification",
];

const FEATURED_NAV_DESTINATIONS = [
  { name: "Manali & Solang", slug: "manali", duration: "3N/4D", price: "₹6,499", state: "Himachal" },
  { name: "Munsiyari & Johar", slug: "munsiyari", duration: "3N/4D", price: "₹8,499", state: "Uttarakhand" },
  { name: "Kedarkantha Summit", slug: "kedarkantha", duration: "4N/5D", price: "₹9,499", state: "Uttarakhand" },
  { name: "Jibhi & Jalori Pass", slug: "jibhi", duration: "2N/3D", price: "₹5,999", state: "Himachal" },
  { name: "Kedarnath Dham", slug: "kedarnath", duration: "3N/4D", price: "₹10,499", state: "Uttarakhand" },
  { name: "Kasol & Kheerganga", slug: "kasol-kheerganga", duration: "2N/3D", price: "₹6,499", state: "Himachal" },
];

export function Navbar({ variant = "auto", className }: NavbarProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const { user, profile, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const returnTo = location.pathname !== "/" ? location.pathname : undefined;

  // Fetch site settings
  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: getSiteSettings,
    staleTime: 5000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const getFirstName = () => {
    const name =
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      "Explorer";
    return name.trim().split(" ")[0];
  };

  const avatarUrl =
    profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const isHome = location.pathname === "/";
  const isLightPage =
    variant === "light" ||
    (variant === "auto" &&
      LIGHT_BG_PAGES.some((p) => location.pathname === p || location.pathname.startsWith(p + "/")));

  const isTransparentHome = isHome && !scrolled && variant !== "solid" && variant !== "light";
  const isLightHeader = isLightPage && !isTransparentHome;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        isTransparentHome
          ? "bg-transparent py-4 text-white"
          : isLightHeader
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_2px_15px_rgba(0,0,0,0.05)] py-3 text-[#102B46]"
          : "bg-[#0F2942]/95 backdrop-blur-md border-b border-white/10 shadow-[0_4px_25px_rgba(10,22,34,0.4)] py-3 text-white",
        className,
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8">
        {/* Brand Logo Lockup */}
        <Link to="/" className="shrink-0 transition-transform hover:scale-105 duration-200">
          <GoNomadikLogo variant={isLightHeader ? "light" : "dark"} size="md" />
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="hidden items-center gap-7 lg:flex">
          {/* Destinations with Interactive Mega-Dropdown */}
          <li
            className="relative"
            onMouseEnter={() => setDestDropdownOpen(true)}
            onMouseLeave={() => setDestDropdownOpen(false)}
          >
            <Link
              to="/destinations"
              className={cn(
                "flex items-center gap-1.5 text-xs font-poppins uppercase tracking-wider font-semibold transition-colors py-2",
                location.pathname.startsWith("/destinations")
                  ? "text-gold font-bold"
                  : isLightHeader
                  ? "text-[#102B46]/85 hover:text-gold"
                  : "text-white/85 hover:text-gold",
              )}
            >
              <span>Destinations</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", destDropdownOpen && "rotate-180")} />
            </Link>

            {/* Dropdown Menu */}
            {destDropdownOpen && (
              <div
                className={cn(
                  "absolute top-full -left-20 w-[420px] rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-200",
                  isLightHeader
                    ? "bg-white border border-slate-200 text-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.12)]"
                    : "bg-[#0F2942] border border-white/15 text-white"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-between pb-3 mb-2 border-b",
                    isLightHeader ? "border-slate-100" : "border-white/10"
                  )}
                >
                  <span className="text-[11px] font-poppins font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> Popular Himalayan Routes
                  </span>
                  <Link
                    to="/destinations"
                    onClick={() => setDestDropdownOpen(false)}
                    className={cn(
                      "text-[11px] font-poppins font-semibold flex items-center gap-1 transition-colors",
                      isLightHeader ? "text-slate-500 hover:text-gold" : "text-white/70 hover:text-gold"
                    )}
                  >
                    View All (15+) <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {FEATURED_NAV_DESTINATIONS.map((dest) => (
                    <Link
                      key={dest.slug}
                      to={`/destinations/${dest.slug}` as any}
                      onClick={() => setDestDropdownOpen(false)}
                      className={cn(
                        "group p-2.5 rounded-xl transition-colors border",
                        isLightHeader
                          ? "hover:bg-slate-50 border-transparent hover:border-slate-200"
                          : "hover:bg-white/10 border-transparent hover:border-white/10"
                      )}
                    >
                      <div
                        className={cn(
                          "text-xs font-poppins font-bold transition-colors truncate",
                          isLightHeader
                            ? "text-slate-900 group-hover:text-gold"
                            : "text-white group-hover:text-gold"
                        )}
                      >
                        {dest.name}
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-2 mt-1 text-[10px] font-poppins",
                          isLightHeader ? "text-slate-500" : "text-white/60"
                        )}
                      >
                        <span>{dest.duration}</span>
                        <span>•</span>
                        <span className="text-amber-500 font-semibold">{dest.price}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </li>

          {/* Upcoming Trips */}
          <li>
            <Link
              to="/destinations"
              className={cn(
                "text-xs font-poppins uppercase tracking-wider font-semibold transition-colors",
                isLightHeader ? "text-[#102B46]/85 hover:text-gold" : "text-white/85 hover:text-gold",
              )}
            >
              Upcoming Trips
            </Link>
          </li>

          {/* College Trips */}
          <li>
            <Link
              to="/college-trips"
              className={cn(
                "relative text-xs font-poppins uppercase tracking-wider font-semibold transition-colors",
                location.pathname.startsWith("/college-trips")
                  ? "text-gold font-bold"
                  : isLightHeader
                  ? "text-[#102B46]/85 hover:text-gold"
                  : "text-white/85 hover:text-gold",
              )}
            >
              College Trips
              <span className="absolute -top-2.5 -right-3.5 bg-gold text-[#0F2942] text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                HOT
              </span>
            </Link>
          </li>

          {/* About Us */}
          <li>
            <Link
              to="/about"
              className={cn(
                "text-xs font-poppins uppercase tracking-wider font-semibold transition-colors",
                location.pathname === "/about"
                  ? "text-gold font-bold"
                  : isLightHeader
                  ? "text-[#102B46]/85 hover:text-gold"
                  : "text-white/85 hover:text-gold",
              )}
            >
              About Us
            </Link>
          </li>

          {/* Stories / Community */}
          <li>
            <Link
              to="/stories"
              className={cn(
                "text-xs font-poppins uppercase tracking-wider font-semibold transition-colors",
                location.pathname.startsWith("/stories")
                  ? "text-gold font-bold"
                  : isLightHeader
                  ? "text-[#102B46]/85 hover:text-gold"
                  : "text-white/85 hover:text-gold",
              )}
            >
              Stories & Blog
            </Link>
          </li>

          {/* Contact */}
          <li>
            <Link
              to="/contact"
              className={cn(
                "text-xs font-poppins uppercase tracking-wider font-semibold transition-colors",
                location.pathname === "/contact"
                  ? "text-gold font-bold"
                  : isLightHeader
                  ? "text-[#102B46]/85 hover:text-gold"
                  : "text-white/85 hover:text-gold",
              )}
            >
              Contact
            </Link>
          </li>
        </ul>

        {/* Action CTAs */}
        <div className="hidden items-center gap-3.5 lg:flex">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-10 px-3 font-poppins text-xs font-bold gap-2 shadow-xs cursor-pointer",
                    isLightHeader
                      ? "border-slate-200 text-[#102B46] bg-slate-100 hover:bg-slate-200 hover:border-gold"
                      : "border-white/25 text-white bg-white/10 hover:bg-white/20 hover:border-gold"
                  )}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={getFirstName()}
                      className="h-6 w-6 rounded-full object-cover border border-gold"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gold/25 flex items-center justify-center text-[10px] font-bold text-gold">
                      {getFirstName().charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span>{getFirstName()}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={cn(
                  "w-56 shadow-2xl rounded-2xl p-2 backdrop-blur-xl",
                  isLightHeader
                    ? "bg-white border border-slate-200 text-slate-800 shadow-[0_10px_35px_rgba(0,0,0,0.12)]"
                    : "bg-[#0F2942] border border-white/15 text-white"
                )}
              >
                <div
                  className={cn(
                    "px-3 py-2 border-b mb-1",
                    isLightHeader ? "border-slate-100" : "border-white/10"
                  )}
                >
                  <p
                    className={cn(
                      "text-xs font-poppins font-bold",
                      isLightHeader ? "text-slate-900" : "text-white"
                    )}
                  >
                    {getFirstName()}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] truncate",
                      isLightHeader ? "text-slate-500" : "text-white/60"
                    )}
                  >
                    {user?.email}
                  </p>
                </div>
                <DropdownMenuItem
                  asChild
                  className={cn(
                    "rounded-xl py-2 text-xs font-semibold cursor-pointer",
                    isLightHeader ? "hover:bg-slate-100 text-slate-700" : "hover:bg-white/10"
                  )}
                >
                  <Link to="/account" search={{ tab: "profile" } as any} className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gold" /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className={cn(
                    "rounded-xl py-2 text-xs font-semibold cursor-pointer",
                    isLightHeader ? "hover:bg-slate-100 text-slate-700" : "hover:bg-white/10"
                  )}
                >
                  <Link to="/account" search={{ tab: "bookings" } as any} className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gold" /> My Bookings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  className={cn(
                    "rounded-xl py-2 text-xs font-semibold cursor-pointer",
                    isLightHeader ? "hover:bg-slate-100 text-slate-700" : "hover:bg-white/10"
                  )}
                >
                  <Link to="/account" search={{ tab: "settings" } as any} className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-gold" /> Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className={isLightHeader ? "bg-slate-100" : "bg-white/10"} />
                <DropdownMenuItem
                  onClick={() => signOut().then(() => navigate({ to: "/" }))}
                  className="rounded-xl py-2 text-xs font-semibold cursor-pointer text-red-500 hover:bg-red-500/10 focus:bg-red-500/10"
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
                onClick={() => triggerNomadikAuth({ mode: "login", returnTo })}
                className={cn(
                  "text-xs font-poppins font-bold uppercase tracking-wider transition-colors cursor-pointer px-2.5 py-2",
                  isLightHeader ? "text-[#102B46] hover:text-gold" : "text-white hover:text-gold"
                )}
              >
                Login
              </button>
            </>
          )}

          {/* Primary Book Now CTA with golden glow */}
          <Button
            className="font-poppins font-bold text-xs tracking-wider uppercase h-10 px-5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] text-[#0F2942] shadow-[0_0_15px_rgba(212,175,55,0.35)] hover:shadow-[0_0_25px_rgba(212,175,55,0.55)] transition-all cursor-pointer"
            size="lg"
            asChild
          >
            <Link to="/destinations">Book Now</Link>
          </Button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl transition-colors",
            isLightHeader
              ? "bg-slate-100 border border-slate-200 text-[#102B46]"
              : "bg-white/10 border border-white/15 text-white"
          )}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5 text-gold" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {open && (
        <div
          className={cn(
            "mx-4 mt-3 rounded-2xl p-6 shadow-2xl lg:hidden animate-in slide-in-from-top duration-300 border",
            isLightHeader
              ? "bg-white border-slate-200 text-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.12)]"
              : "bg-[#0F2942] border-white/15 text-white"
          )}
        >
          <ul
            className={cn(
              "flex flex-col gap-1.5 pb-4 border-b",
              isLightHeader ? "border-slate-100" : "border-white/10"
            )}
          >
            <li>
              <Link
                to="/destinations"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-poppins font-bold uppercase tracking-wider",
                  isLightHeader ? "text-slate-900 hover:bg-slate-50" : "text-white hover:bg-white/10"
                )}
              >
                <span>Destinations</span>
                <span className="text-gold text-[10px]">15+ Trips</span>
              </Link>
            </li>
            <li>
              <Link
                to="/college-trips"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-poppins font-bold uppercase tracking-wider",
                  isLightHeader ? "text-slate-900 hover:bg-slate-50" : "text-white hover:bg-white/10"
                )}
              >
                <span>College Trips</span>
                <span className="bg-gold text-[#0F2942] text-[9px] font-extrabold px-2 py-0.5 rounded-full">SPECIAL</span>
              </Link>
            </li>
            <li>
              <Link
                to="/about"
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-xl px-3.5 py-3 text-xs font-poppins font-semibold uppercase tracking-wider",
                  isLightHeader ? "text-slate-700 hover:bg-slate-50" : "text-white/80 hover:bg-white/10"
                )}
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                to="/stories"
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-xl px-3.5 py-3 text-xs font-poppins font-semibold uppercase tracking-wider",
                  isLightHeader ? "text-slate-700 hover:bg-slate-50" : "text-white/80 hover:bg-white/10"
                )}
              >
                Stories & Blog
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-xl px-3.5 py-3 text-xs font-poppins font-semibold uppercase tracking-wider",
                  isLightHeader ? "text-slate-700 hover:bg-slate-50" : "text-white/80 hover:bg-white/10"
                )}
              >
                Contact
              </Link>
            </li>
          </ul>

          <div className="flex flex-col gap-3 pt-4">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                    {getFirstName().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div
                      className={cn(
                        "text-xs font-poppins font-bold",
                        isLightHeader ? "text-slate-900" : "text-white"
                      )}
                    >
                      {getFirstName()}
                    </div>
                    <div
                      className={cn(
                        "text-[10px]",
                        isLightHeader ? "text-slate-500" : "text-white/60"
                      )}
                    >
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    onClick={() => setOpen(false)}
                    className={cn(
                      isLightHeader
                        ? "border-slate-200 text-[#102B46] bg-slate-50 hover:bg-slate-100"
                        : "border-white/20 text-white bg-white/5"
                    )}
                  >
                    <Link to="/account" search={{ tab: "bookings" } as any}>
                      My Bookings
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/30 text-red-500 bg-red-500/10 hover:bg-red-500/20"
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    triggerNomadikAuth({ mode: "login", returnTo });
                  }}
                  className={cn(
                    isLightHeader
                      ? "border-slate-200 text-[#102B46] bg-slate-50 hover:bg-slate-100"
                      : "border-white/20 text-white bg-white/5"
                  )}
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    triggerNomadikAuth({ mode: "signup", returnTo });
                  }}
                  className="border-gold/40 text-gold bg-gold/10 hover:bg-gold/20"
                >
                  Sign Up
                </Button>
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-gold to-amber-500 text-[#0F2942] font-poppins font-extrabold uppercase tracking-wider py-3.5 rounded-xl shadow-lg"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link to="/destinations">Explore & Book Trips</Link>
            </Button>

            <a
              href={getWhatsAppUrl("Hi GoNomadik! I want to inquire about upcoming trips.")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white font-poppins font-bold text-xs shadow transition-colors"
              onClick={() => setOpen(false)}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Travel Desk
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
