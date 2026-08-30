import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, Luggage, Sparkles, User } from "lucide-react";
import { useAuth } from "./AuthContext";

export function MobileBottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();

  // Hide on admin routes, booking success, or direct payment flows
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/booking.success") ||
    pathname.startsWith("/invoice")
  ) {
    return null;
  }

  const navItems = [
    {
      label: "Home",
      to: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Explore",
      to: "/destinations",
      icon: Compass,
      isActive: pathname.startsWith("/destinations") || pathname.startsWith("/journeys"),
    },
    {
      label: "My Trips",
      to: "/account",
      icon: Luggage,
      isActive: pathname.startsWith("/account"),
    },
    {
      label: "Stories",
      to: "/stories",
      icon: Sparkles,
      isActive: pathname.startsWith("/stories"),
    },
    {
      label: "Profile",
      to: "/account",
      icon: User,
      isActive: pathname === "/account" || pathname === "/login",
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A192F]/95 backdrop-blur-lg border-t border-[#C8A96A]/20 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={`${item.label}-${idx}`}
              to={item.to}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                active
                  ? "text-[#C8A96A] scale-105"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5px]" : "stroke-[1.75px]"}`} />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#C8A96A] animate-pulse" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium tracking-tight ${active ? "font-bold text-[#C8A96A]" : "opacity-80"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
