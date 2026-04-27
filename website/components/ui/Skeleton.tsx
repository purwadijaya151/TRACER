import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  variant = "text"
}: {
  className?: string;
  variant?: "text" | "card" | "table-row";
}) {
  const base = "animate-pulse rounded bg-slate-200";
  if (variant === "card") return <div className={cn(base, "h-28", className)} />;
  if (variant === "table-row") return <div className={cn(base, "h-12", className)} />;
  return <span className={cn(base, "block h-4 w-32", className)} />;
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row} className={row % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"}>
          {Array.from({ length: columns }).map((__, column) => (
            <td key={column} className="px-4 py-3">
              <Skeleton className={column === 0 ? "w-8" : "w-full"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
