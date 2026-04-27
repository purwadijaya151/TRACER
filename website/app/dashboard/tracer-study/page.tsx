"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { TracerStudyDetailModal } from "@/components/tracer-study/TracerStudyDetailModal";
import { TracerStudyTable } from "@/components/tracer-study/TracerStudyTable";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { getTracerStudyExport } from "@/lib/actions/tracer-study.actions";
import { PRODI_OPTIONS, STATUS_KERJA_OPTIONS } from "@/lib/constants";
import { useTracerStudy } from "@/lib/hooks/useTracerStudy";
import type { TracerStudy, TracerStudyFilters } from "@/types";

const pageSize = 10;

export default function TracerStudyPage() {
  const [page, setPage] = useState(1);
  const [prodi, setProdi] = useState<TracerStudyFilters["prodi"]>("all");
  const [tahunLulus, setTahunLulus] = useState("all");
  const [statusKerja, setStatusKerja] = useState<TracerStudyFilters["status_kerja"]>("all");
  const [tahunPengisian, setTahunPengisian] = useState("all");
  const [detail, setDetail] = useState<TracerStudy | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters = useMemo<TracerStudyFilters>(
    () => ({
      prodi,
      tahun_lulus: tahunLulus === "all" ? "all" : Number(tahunLulus),
      status_kerja: statusKerja,
      tahun_pengisian: tahunPengisian === "all" ? "all" : Number(tahunPengisian)
    }),
    [prodi, statusKerja, tahunLulus, tahunPengisian]
  );
  const { data, summary, loading } = useTracerStudy(filters, page, pageSize);

  const runExport = async (format: "pdf" | "excel") => {
    setExporting(true);
    const result = await getTracerStudyExport({
      prodi: prodi === "all" ? [] : [prodi],
      tahunMulai: tahunLulus === "all" ? undefined : Number(tahunLulus),
      tahunAkhir: tahunLulus === "all" ? undefined : Number(tahunLulus),
      tahunPengisian: tahunPengisian === "all" ? undefined : Number(tahunPengisian),
      status_kerja: statusKerja
    });
    setExporting(false);

    if (result.error || !result.data) {
      toast.error(result.error ?? "Gagal export data");
      return;
    }
    if (format === "pdf") {
      const { exportPDF } = await import("@/lib/export/exportPDF");
      exportPDF(result.data, "Laporan Tracer Study", filters);
    } else {
      const { exportExcel } = await import("@/lib/export/exportExcel");
      exportExcel(result.data, "laporan-tracer-study");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4"><p className="text-sm font-medium text-slate-600">Rata-rata IPK</p><p className="mt-2 font-heading text-2xl font-semibold">{summary?.avg_ipk ?? 0}</p></Card>
        <Card className="p-4"><p className="text-sm font-medium text-slate-600">Waktu Tunggu Dominan</p><p className="mt-2 font-heading text-lg font-semibold">{summary?.avg_waktu_tunggu ?? "-"}</p></Card>
        <Card className="p-4"><p className="text-sm font-medium text-slate-600">Kesesuaian Rata-rata</p><p className="mt-2 font-heading text-2xl font-semibold">{summary?.avg_kesesuaian ?? 0}/5</p></Card>
        <Card className="p-4"><p className="text-sm font-medium text-slate-600">Modal Gaji</p><p className="mt-2 font-heading text-lg font-semibold">{summary?.modal_gaji ?? "-"}</p></Card>
      </div>

      <Card>
        <CardHeader
          title="Respons Tracer Study"
          description="Analisis respons alumni berdasarkan prodi, tahun, dan status kerja."
          action={
            <div className="flex gap-2">
              <Button variant="secondary" loading={exporting} onClick={() => runExport("pdf")}><Download className="h-4 w-4" /> PDF</Button>
              <Button variant="secondary" loading={exporting} onClick={() => runExport("excel")}><Download className="h-4 w-4" /> Excel</Button>
            </div>
          }
        />
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Select value={prodi} onChange={(e) => { setPage(1); setProdi(e.target.value as TracerStudyFilters["prodi"]); }}>
              <option value="all">Semua Prodi</option>
              {PRODI_OPTIONS.map((item) => <option key={item}>{item}</option>)}
            </Select>
            <Input placeholder="Tahun lulus" value={tahunLulus === "all" ? "" : tahunLulus} onChange={(e) => { setPage(1); setTahunLulus(e.target.value || "all"); }} />
            <Select value={statusKerja} onChange={(e) => { setPage(1); setStatusKerja(e.target.value as TracerStudyFilters["status_kerja"]); }}>
              <option value="all">Semua Status Kerja</option>
              {STATUS_KERJA_OPTIONS.map((item) => <option key={item}>{item}</option>)}
            </Select>
            <Input placeholder="Tahun pengisian" value={tahunPengisian === "all" ? "" : tahunPengisian} onChange={(e) => { setPage(1); setTahunPengisian(e.target.value || "all"); }} />
          </div>

          <TracerStudyTable rows={data?.rows ?? []} loading={loading} onDetail={setDetail} />
        </CardContent>
        <Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} />
      </Card>

      <TracerStudyDetailModal row={detail} open={Boolean(detail)} onClose={() => setDetail(null)} />
    </div>
  );
}
