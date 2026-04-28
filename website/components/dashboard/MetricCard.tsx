import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

export function MetricCard({
  title,
  value,
  description,
  icon: Icon
}: {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium leading-5 text-slate-600">{title}</p>
          <p className="mt-2 font-heading text-[32px] font-semibold leading-10 text-slate-950">{value}</p>
          <p className="mt-1 text-sm leading-5 text-slate-600">{description}</p>
        </div>
        <div className="rounded-lg bg-navy-50 p-3 text-navy">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
