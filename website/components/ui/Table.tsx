import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

export function Table({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100 bg-white">
      <table className={cn("min-w-full divide-y divide-slate-100 text-sm", className)}>{children}</table>
    </div>
  );
}

export function Th({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "sticky top-0 bg-white px-4 py-3 text-left font-heading text-xs font-semibold uppercase tracking-wide text-slate-600",
        className
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-4 py-3 align-middle text-slate-700", className)}>
      {children}
    </td>
  );
}

export function EmptyTableRow({
  colSpan,
  title,
  description
}: {
  colSpan: number;
  title: string;
  description: string;
}) {
  return (
    <tr>
      <Td colSpan={colSpan} className="py-10">
        <EmptyState title={title} description={description} />
      </Td>
    </tr>
  );
}
