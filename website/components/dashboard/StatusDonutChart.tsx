"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DashboardStats } from "@/types";

const colors = ["#1A2B5F", "#C9A84C", "#2E4080", "#94A3B8"];

export function StatusDonutChart({ data }: { data: DashboardStats["status_kerja_distribution"] }) {
  return (
    <div className="grid min-h-72 gap-4 md:grid-cols-[1fr_180px]">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            innerRadius={64}
            outerRadius={96}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-3 self-center">
        {data.map((item, index) => (
          <div key={item.status} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
              {item.status}
            </span>
            <span className="font-semibold text-slate-900">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
