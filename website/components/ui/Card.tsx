import { cn } from "@/lib/utils";

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("rounded-lg bg-white shadow-soft", className)}>{children}</section>;
}

export function CardHeader({
  title,
  description,
  action,
  className
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        <h2 className="font-heading text-[19px] font-semibold leading-7 text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-[15px] leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action ? <div className="min-w-0 sm:shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardContent({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
