import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

const variants: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/15",
  error: "bg-red-50 text-red-700 ring-red-600/15",
  info: "bg-navy-50 text-navy ring-navy/15",
  neutral: "bg-slate-100 text-slate-700 ring-slate-600/10"
};

export function Badge({
  children,
  variant = "neutral",
  className
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-semibold leading-5 ring-1 ring-inset",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
