import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewStarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showValueLabel?: boolean;
  className?: string;
}

export function ReviewStarRating({
  value,
  onChange,
  readonly = true,
  size = "md",
  showValueLabel = false,
  className,
}: ReviewStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4.5 w-4.5",
    lg: "h-6 w-6",
    xl: "h-8 w-8",
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={cn("inline-flex items-center gap-1 font-poppins", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(displayValue);
          const isHalf = star === Math.ceil(displayValue) && displayValue % 1 !== 0;

          return (
            <button
              key={star}
              type="button"
              disabled={readonly}
              onClick={() => !readonly && onChange?.(star)}
              onMouseEnter={() => !readonly && setHoverValue(star)}
              onMouseLeave={() => !readonly && setHoverValue(null)}
              className={cn(
                "transition-all duration-150 relative focus:outline-none",
                !readonly && "cursor-pointer hover:scale-125",
                readonly && "cursor-default",
              )}
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={cn(
                  currentSize,
                  isFilled
                    ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-sm"
                    : isHalf
                      ? "fill-[#F59E0B]/60 text-[#F59E0B]"
                      : "fill-slate-200 text-slate-300",
                )}
              />
            </button>
          );
        })}
      </div>

      {showValueLabel && (
        <span className="text-xs font-bold text-slate-800 ml-1 font-poppins">
          {Number(displayValue).toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface AspectRatingBarProps {
  label: string;
  rating: number;
  icon?: React.ReactNode;
}

export function AspectRatingBar({ label, rating, icon }: AspectRatingBarProps) {
  const percentage = Math.min(100, Math.max(0, (rating / 5) * 100));

  return (
    <div className="space-y-1 font-poppins">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-600 font-medium flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="font-bold text-slate-900">{rating.toFixed(1)}</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-[#C8A96A] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
