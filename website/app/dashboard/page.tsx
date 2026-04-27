"use client";

import dynamic from "next/dynamic";
import { Bell, CheckCircle2, Users, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table, Td, Th } from "@/components/ui/Table";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useDashboardStats } from "@/lib/hooks/useDashboardStats";
import { formatDateTime } from "@/lib/utils";

const ResponseBarChart = dynamic(
  () => import("@/components/dashboard/ResponseBarChart").then((mod) => mod.ResponseBarChart),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-72" /> }
);

const StatusDonutChart = dynamic(
  () => import("@/components/dashboard/StatusDonutChart").then((mod) => mod.StatusDonutChart),
  { ssr: false, loading: () => <Skeleton variant="card" className="h-72" /> }
);

export default function DashboardPage() {
  const { data, loading } = useDashboardStats();

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} variant="card" />
          ))}
        </div>
        <Skeleton variant="card" className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Alumni" value={data.total_alumni} description="Data alumni terdaftar" icon={Users} />
        <MetricCard title="Sudah Mengisi" value={data.sudah_mengisi} description="Tracer study submitted" icon={CheckCircle2} />
        <MetricCard title="Belum Mengisi" value={data.belum_mengisi} description="Perlu pengingat" icon={XCircle} />
        <MetricCard title="Notifikasi" value={data.notif_terkirim} description="Pesan terkirim" icon={Bell} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Response Rate per Prodi" description="Perbandingan total alumni dan responden." />
          <CardContent>
            <ResponseBarChart data={data.response_by_prodi} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader title="Distribusi Status Kerja" description="Status pekerjaan alumni yang sudah submit." />
          <CardContent>
            <StatusDonutChart data={data.status_kerja_distribution} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Aktivitas Terbaru" description="Lima pengisian tracer study terakhir." />
        <CardContent>
          <Table>
            <thead>
              <tr>
                <Th>Nama</Th>
                <Th>Prodi</Th>
                <Th>Status</Th>
                <Th>Waktu Submit</Th>
              </tr>
            </thead>
            <tbody>
              {data.recent_submissions.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"}>
                  <Td className="font-semibold text-slate-900">{item.alumni?.nama_lengkap ?? "-"}</Td>
                  <Td>{item.alumni?.prodi ?? "-"}</Td>
                  <Td>{item.status_kerja}</Td>
                  <Td>{formatDateTime(item.submitted_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
