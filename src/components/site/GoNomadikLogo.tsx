import { cn } from "@/lib/utils";

interface GoNomadikLogoProps {
  variant?: "light" | "dark"; // light = for light bg, dark = for dark bg
  size?: "sm" | "md" | "lg";
  className?: string;
  showSubtitle?: boolean;
}

export function GoNomadikLogo({
  variant = "light",
  size = "md",
  className,
}: GoNomadikLogoProps) {
  const isDarkBg = variant === "dark";

  const imgSizes = {
    sm: "h-8 sm:h-9",
    md: "h-10 sm:h-11",
    lg: "h-12 sm:h-14",
  };

  return (
    <div className={cn("inline-flex items-center shrink-0 group select-none", className)}>
      <img
        src="/images/gonomadik-full-logo.png"
        alt="GoNomadik Logo"
        className={cn(
          imgSizes[size],
          "w-auto object-contain pointer-events-none transition-transform duration-300 group-hover:scale-105 rounded-xl",
          isDarkBg && "bg-white/90 p-1 shadow-xs"
        )}
      />
    </div>
  );
}
