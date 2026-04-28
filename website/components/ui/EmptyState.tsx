import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", className)}>
      <div className="mb-3 rounded-full bg-navy-50 p-3 text-navy">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="font-heading text-base font-semibold leading-6 text-slate-900">{title}</p>
      <p className="mt-1 max-w-sm text-[15px] leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
