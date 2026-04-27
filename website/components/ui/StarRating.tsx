import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  max = 5,
  className
}: {
  value?: number | null;
  max?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`Rating ${value ?? 0} dari ${max}`}>
      {Array.from({ length: max }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < (value ?? 0) ? "fill-gold text-gold" : "text-slate-300"
          )}
        />
      ))}
    </div>
  );
}
