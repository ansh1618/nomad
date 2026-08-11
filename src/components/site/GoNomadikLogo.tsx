import { cn } from "@/lib/utils";

interface GoNomadikLogoProps {
  variant?: "light" | "dark"; // light = for light bg (Navy text), dark = for dark bg (White text)
  size?: "sm" | "md" | "lg";
  className?: string;
  showSubtitle?: boolean;
}

export function GoNomadikLogo({
  variant = "light",
  size = "md",
  className,
  showSubtitle = false,
}: GoNomadikLogoProps) {
  const isDarkBg = variant === "dark";

  const imgSizes = {
    sm: "h-7 sm:h-8",
    md: "h-9 sm:h-10",
    lg: "h-11 sm:h-13",
  };

  const textSizes = {
    sm: "text-xl sm:text-2xl",
    md: "text-2xl sm:text-3xl",
    lg: "text-3xl sm:text-4xl",
  };

  const primaryTextColor = isDarkBg ? "text-white" : "text-[#0A2540]";

  return (
    <div className={cn("inline-flex items-center gap-2 sm:gap-2.5 group select-none", className)}>
      {/* Standalone Round Icon Image (No extra CSS container/background) */}
      <div className="relative flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
        <img
          src="/images/gonomadik-round-emblem.png"
          alt="GoNomadik Emblem"
          className={cn(imgSizes[size], "w-auto aspect-square object-contain pointer-events-none drop-shadow-none border-none bg-transparent shadow-none")}
        />
      </div>

      {/* Adjacent Separate Wordmark Text Element */}
      <div className="flex flex-col text-left">
        <span
          className={cn("font-bold tracking-[-0.03em] leading-none", textSizes[size])}
          style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', 'Manrope', sans-serif" }}
        >
          <span className={primaryTextColor}>go</span>
          <span className="text-[#C8A96A]">noma</span>
          <span className={primaryTextColor}>dik</span>
          <span className="text-[#C8A96A]">.</span>
        </span>
        {showSubtitle && (
          <span className="text-[9px] sm:text-[10px] font-poppins font-medium tracking-[0.2em] uppercase text-slate-400 mt-1">
            Curated Road Trips
          </span>
        )}
      </div>
    </div>
  );
}
