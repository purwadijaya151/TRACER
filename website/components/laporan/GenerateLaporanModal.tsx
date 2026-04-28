"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { getReportData, getReportPreviewCount } from "@/lib/actions/laporan.actions";
import { PRODI_OPTIONS, STATUS_KERJA_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ReportType } from "@/types";

const LARGE_EXPORT_THRESHOLD = 1000;

export function GenerateLaporanModal({
  open,
  onClose,
  reportType,
  reportTitle
}: {
  open: boolean;
  onClose: () => void;
  reportType: ReportType;
  reportTitle: string;
}) {
  const [format, setFormat] = useState<"pdf" | "excel">("pdf");
  const [prodi, setProdi] = useState<string[]>([]);
  const [tahunMulai, setTahunMulai] = useState("");
  const [tahunAkhir, setTahunAkhir] = useState("");
  const [statusKerja, setStatusKerja] = useState("all");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const isLargeExport = (previewCount ?? 0) > LARGE_EXPORT_THRESHOLD;

  const filters = useMemo(
    () => ({
      prodi,
      tahunMulai: tahunMulai ? Number(tahunMulai) : undefined,
      tahunAkhir: tahunAkhir ? Number(tahunAkhir) : undefined,
      status_kerja: statusKerja
    }),
    [prodi, statusKerja, tahunAkhir, tahunMulai]
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setPreviewCount(null);
    const timer = window.setTimeout(async () => {
      const result = await getReportPreviewCount(reportType, filters);
      if (!cancelled && !result.error) setPreviewCount(result.data ?? 0);
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [filters, open, reportType]);

  const generate = async () => {
    if (isLargeExport) {
      toast.info(`Menyiapkan ${previewCount?.toLocaleString("id-ID")} data. Proses export bisa lebih lama.`);
    }

    setLoading(true);
    setProgress(20);
    const result = await getReportData(reportType, filters);
    setProgress(70);

    if (result.error || !result.data) {
      setLoading(false);
      setProgress(0);
      toast.error(result.error ?? "Gagal generate laporan");
      return;
    }

    if (format === "pdf") {
      const { exportPDF } = await import("@/lib/export/exportPDF");
      exportPDF(result.data, reportTitle, filters);
    } else {
      const { exportExcel } = await import("@/lib/export/exportExcel");
      exportExcel(result.data, reportTitle.toLowerCase().replace(/\s+/g, "-"));
    }
    setProgress(100);
    setLoading(false);
    toast.success("Laporan berhasil dibuat");
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Generate ${reportTitle}`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Tutup</Button>
          <Button loading={loading} onClick={generate}>Generate</Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium leading-5 text-slate-700">Format</p>
          <div className="grid grid-cols-2 rounded-lg border border-slate-200 p-1">
            {(["pdf", "excel"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFormat(item)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-semibold",
                  format === item ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Tahun Mulai" type="number" value={tahunMulai} onChange={(e) => setTahunMulai(e.target.value)} />
          <Input label="Tahun Akhir" type="number" value={tahunAkhir} onChange={(e) => setTahunAkhir(e.target.value)} />
          <Select label="Status Kerja" value={statusKerja} onChange={(e) => setStatusKerja(e.target.value)}>
            <option value="all">Semua Status</option>
            {STATUS_KERJA_OPTIONS.map((status) => <option key={status}>{status}</option>)}
          </Select>
          <div>
            <p className="mb-2 text-sm font-medium leading-5 text-slate-700">Prodi</p>
            <div className="space-y-2 rounded-lg border border-slate-100 p-3">
              {PRODI_OPTIONS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={prodi.includes(item)}
                    onChange={(event) => setProdi(event.target.checked ? [...prodi, item] : prodi.filter((value) => value !== item))}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-navy-50 p-4 text-sm leading-6 text-navy">
          {previewCount === null
            ? "Menghitung estimasi data..."
            : `${previewCount.toLocaleString("id-ID")} data akan diekspor dari laporan ${reportTitle}.`}
        </div>

        {isLargeExport ? (
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Dataset besar akan diproses bertahap. Biarkan modal tetap terbuka sampai file selesai dibuat.</span>
          </div>
        ) : null}

        {loading || progress > 0 ? (
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs font-medium leading-5 text-slate-500">
              {progress < 70 ? "Mengambil data laporan..." : progress < 100 ? "Membuat file export..." : "Selesai."}
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
