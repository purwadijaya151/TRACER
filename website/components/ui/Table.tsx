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
    <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-lg border border-slate-100 bg-white">
      <table className={cn("w-full min-w-full divide-y divide-slate-100 text-[15px] leading-6", className)}>{children}</table>
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
        "sticky top-0 bg-white px-4 py-3 text-left text-sm font-semibold leading-5 text-slate-700",
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
    <td colSpan={colSpan} className={cn("px-4 py-3 align-middle leading-6 text-slate-700", className)}>
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
