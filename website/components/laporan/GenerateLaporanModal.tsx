"use client";

import { useState } from "react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { getReportData, getReportPreviewCount } from "@/lib/actions/laporan.actions";
import { PRODI_OPTIONS, STATUS_KERJA_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ReportType } from "@/types";

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

  const filters = {
    prodi,
    tahunMulai: tahunMulai ? Number(tahunMulai) : undefined,
    tahunAkhir: tahunAkhir ? Number(tahunAkhir) : undefined,
    status_kerja: statusKerja
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(async () => {
      const result = await getReportPreviewCount(reportType, filters);
      if (!result.error) setPreviewCount(result.data ?? 0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [filters.prodi, filters.status_kerja, filters.tahunAkhir, filters.tahunMulai, open, reportType]);

  const generate = async () => {
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Format</p>
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Prodi</p>
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

        <div className="rounded-lg bg-navy-50 p-4 text-sm text-navy">
          {previewCount ?? 0} data akan diekspor dari laporan {reportTitle}.
        </div>

        {loading || progress > 0 ? (
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
