"use client";

import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ReportType } from "@/types";

export function LaporanCard({
  title,
  description,
  icon: Icon,
  type,
  onClick
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  type: ReportType;
  onClick: (type: ReportType, title: string) => void;
}) {
  return (
    <button type="button" onClick={() => onClick(type, title)} className="text-left">
      <Card className="h-full p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="rounded-lg bg-navy-50 p-3 text-navy">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex gap-1">
            <Badge variant="info">PDF</Badge>
            <Badge variant="success">Excel</Badge>
          </div>
        </div>
        <h3 className="font-heading text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </Card>
    </button>
  );
}
