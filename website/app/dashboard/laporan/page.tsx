"use client";

import { BarChart3, BriefcaseBusiness, FileSpreadsheet, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState } from "react";
import { GenerateLaporanModal } from "@/components/laporan/GenerateLaporanModal";
import { LaporanCard } from "@/components/laporan/LaporanCard";
import type { ReportType } from "@/types";

const reports = [
  {
    type: "alumni",
    title: "Laporan Data Alumni",
    description: "Rekap alumni berdasarkan prodi, tahun lulus, dan status pengisian.",
    icon: GraduationCap
  },
  {
    type: "tracer",
    title: "Laporan Tracer Study",
    description: "Data pekerjaan, gaji, waktu tunggu, dan kesesuaian bidang.",
    icon: FileSpreadsheet
  },
  {
    type: "pekerjaan",
    title: "Statistik Pekerjaan",
    description: "Distribusi status kerja dan ringkasan bidang pekerjaan.",
    icon: BriefcaseBusiness
  },
  {
    type: "kompetensi",
    title: "Kompetensi Alumni",
    description: "Nilai kompetensi hard skill, soft skill, bahasa, IT, dan kepemimpinan.",
    icon: BarChart3
  }
] satisfies Array<{ type: ReportType; title: string; description: string; icon: LucideIcon }>;

export default function LaporanPage() {
  const [selected, setSelected] = useState<{ type: ReportType; title: string } | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold leading-8 text-slate-950">Laporan & Export</h2>
        <p className="mt-1 text-[15px] leading-6 text-slate-600">Pilih jenis laporan, filter data, lalu generate PDF atau Excel.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reports.map((report) => (
          <LaporanCard key={report.title} {...report} onClick={(type, title) => setSelected({ type, title })} />
        ))}
      </div>
      <GenerateLaporanModal
        open={Boolean(selected)}
        reportType={selected?.type ?? "tracer"}
        reportTitle={selected?.title ?? "Laporan"}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
