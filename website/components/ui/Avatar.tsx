import Image from "next/image";
import { buildAvatarUrl } from "@/lib/avatar-url";
import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  cacheKey,
  className,
  size = 36
}: {
  name?: string | null;
  src?: string | null;
  cacheKey?: string | null;
  className?: string;
  size?: number;
}) {
  const resolvedSrc = buildAvatarUrl(src, cacheKey);

  if (resolvedSrc) {
    return (
      <Image
        src={resolvedSrc}
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
        "flex shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px] font-semibold leading-none text-navy",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={name ?? "Avatar"}
    >
      {initials(name)}
    </div>
  );
}
