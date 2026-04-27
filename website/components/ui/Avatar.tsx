import Image from "next/image";
import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  className,
  size = 36
}: {
  name?: string | null;
  src?: string | null;
  className?: string;
  size?: number;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name ?? "Avatar"}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-navy-50 text-xs font-bold text-navy",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={name ?? "Avatar"}
    >
      {initials(name)}
    </div>
  );
}
