"use client";

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
        <svg
          key={index}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={cn(
            "h-4 w-4",
            index < (value ?? 0) ? "fill-gold text-gold" : "text-slate-300"
          )}
        >
          <path
            fill="currentColor"
            d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5Z"
          />
        </svg>
      ))}
    </div>
  );
}
