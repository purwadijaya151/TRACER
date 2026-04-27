"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { DashboardStats } from "@/types";

export function ResponseBarChart({ data }: { data: DashboardStats["response_by_prodi"] }) {
  const rows = data.map((item) => ({
    prodi: item.prodi.replace("Teknik ", ""),
    Mengisi: item.mengisi,
    Total: item.total
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="prodi" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="Total" fill="#DCE2F3" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Mengisi" fill="#1A2B5F" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
