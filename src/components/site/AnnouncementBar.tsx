import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ArrowRight } from "lucide-react";
import { getActiveAnnouncementBar } from "@/lib/queries/cms";

export function AnnouncementBar() {
  const [closed, setClosed] = useState(false);

  const { data: announcement } = useQuery({
    queryKey: ["active_announcement"],
    queryFn: getActiveAnnouncementBar,
    staleTime: 1000,
  });

  if (closed || !announcement || !announcement.is_active) {
    return null;
  }

  const bgColor = announcement.bg_color || "#1e3a5f";
  const textColor = announcement.text_color || "#ffffff";

  return (
    <div
      style={{ backgroundColor: bgColor, color: textColor }}
      className="relative z-[99] flex w-full items-center justify-center px-4 py-2 text-center text-xs font-poppins font-semibold shadow-soft transition-all duration-300"
    >
      <div className="flex items-center justify-center gap-2 flex-wrap pr-6">
        <span>{announcement.message}</span>
        {announcement.link && (
          <a
            href={announcement.link}
            className="inline-flex items-center gap-1 underline hover:opacity-90 transition-opacity"
            target={announcement.link.startsWith("http") ? "_blank" : "_self"}
            rel="noopener noreferrer"
          >
            {announcement.link_text || "Learn More"}{" "}
            <ArrowRight className="h-3 w-3" />
          </a>
        )}
      </div>
      <button
        onClick={() => setClosed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
