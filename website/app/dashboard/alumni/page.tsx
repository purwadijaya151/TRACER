"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Download, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AlumniDetailModal } from "@/components/alumni/AlumniDetailModal";
import { AlumniModal } from "@/components/alumni/AlumniModal";
import { AlumniTable } from "@/components/alumni/AlumniTable";
import { DeleteConfirmModal } from "@/components/alumni/DeleteConfirmModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { bulkDeleteAlumni, deleteAlumni, getAlumniExport } from "@/lib/actions/alumni.actions";
import { PRODI_OPTIONS } from "@/lib/constants";
import { useAlumni } from "@/lib/hooks/useAlumni";
import type { Alumni, AlumniFilters, ReportData } from "@/types";

const pageSize = 10;
const LARGE_EXPORT_THRESHOLD = 1000;

function AlumniPageContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [prodi, setProdi] = useState<AlumniFilters["prodi"]>("all");
  const [tahunLulus, setTahunLulus] = useState<string>("all");
  const [status, setStatus] = useState<AlumniFilters["status"]>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<Alumni | null>(null);
  const [detail, setDetail] = useState<Alumni | null>(null);
  const [deleting, setDeleting] = useState<Alumni | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const nextSearch = searchParams.get("search") ?? "";
    setSearch(nextSearch);
    setPage(1);
  }, [searchParams]);

  const filters = useMemo<AlumniFilters>(
    () => ({
      search,
      prodi,
      tahun_lulus: tahunLulus === "all" ? "all" : Number(tahunLulus),
      status
    }),
    [search, prodi, status, tahunLulus]
  );
  const { data, loading, refresh } = useAlumni(filters, page, pageSize);
  const rows = data?.rows ?? [];
  const totalRows = data?.total ?? 0;
  const isLargeExport = totalRows > LARGE_EXPORT_THRESHOLD;

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    const result = await deleteAlumni(deleting.id);
    setDeleteLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Alumni dihapus");
      setDeleting(null);
      await refresh();
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const result = await bulkDeleteAlumni(selectedIds);
    if (result.error) toast.error(result.error);
    else {
      toast.success(`${result.data?.deleted ?? 0} alumni dihapus`);
      setSelectedIds([]);
      await refresh();
    }
  };

  const runExport = async (format: "pdf" | "excel") => {
    setExporting(true);
    if (isLargeExport) {
      toast.info(`Menyiapkan ${totalRows.toLocaleString("id-ID")} data alumni. Proses export bisa lebih lama.`);
    }

    try {
      const result = await getAlumniExport(filters);

      if (result.error || !result.data) {
        toast.error(result.error ?? "Gagal export alumni");
        return;
      }

      const reportData: ReportData = { type: "alumni", rows: result.data };
      if (format === "pdf") {
        const { exportPDF } = await import("@/lib/export/exportPDF");
        exportPDF(reportData, "Laporan Data Alumni", filters);
      } else {
        const { exportExcel } = await import("@/lib/export/exportExcel");
        exportExcel(reportData, "laporan-data-alumni");
      }
    } catch {
      toast.error("Gagal membuat file export alumni");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Data Alumni"
          description="Kelola data alumni dan status pengisian tracer study."
          action={
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button variant="secondary" loading={exporting} onClick={() => runExport("pdf")}><Download className="h-4 w-4" /> PDF</Button>
              <Button variant="secondary" loading={exporting} onClick={() => runExport("excel")}><Download className="h-4 w-4" /> Excel</Button>
              <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
                <Plus className="h-4 w-4" /> Tambah Alumni
              </Button>
            </div>
          }
        />
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <Input placeholder="Cari NPM, nama, email..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
            <Select value={prodi} onChange={(e) => { setPage(1); setProdi(e.target.value as AlumniFilters["prodi"]); }}>
              <option value="all">Semua Prodi</option>
              {PRODI_OPTIONS.map((item) => <option key={item}>{item}</option>)}
            </Select>
            <Input placeholder="Tahun lulus" value={tahunLulus === "all" ? "" : tahunLulus} onChange={(e) => { setPage(1); setTahunLulus(e.target.value || "all"); }} />
            <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as AlumniFilters["status"]); }}>
              <option value="all">Semua Status</option>
              <option value="sudah">Sudah Mengisi</option>
              <option value="belum">Belum Mengisi</option>
            </Select>
          </div>

          {selectedIds.length > 0 ? (
            <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <span>{selectedIds.length} alumni dipilih</span>
              <Button variant="danger" size="sm" onClick={confirmBulkDelete}>
                <Trash2 className="h-4 w-4" /> Hapus Terpilih
              </Button>
            </div>
          ) : null}

          {isLargeExport ? (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Export akan mencakup {totalRows.toLocaleString("id-ID")} alumni sesuai filter aktif. Proses file bisa lebih lama.</span>
            </div>
          ) : null}

          <AlumniTable
            rows={rows}
            loading={loading}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            onDetail={(alumni) => setDetail(alumni)}
            onEdit={(alumni) => { setEditing(alumni); setModalOpen(true); }}
            onDelete={(alumni) => setDeleting(alumni)}
            rowOffset={(page - 1) * pageSize}
          />
        </CardContent>
        <Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} />
      </Card>

      <AlumniModal open={modalOpen} alumni={editing} onClose={() => setModalOpen(false)} onSaved={refresh} />
      <AlumniDetailModal alumni={detail} open={Boolean(detail)} onClose={() => setDetail(null)} />
      <DeleteConfirmModal
        open={Boolean(deleting)}
        title="Hapus Alumni"
        description={`Data ${deleting?.nama_lengkap ?? "alumni"} akan dihapus bersama akun Auth dan data terkait.`}
        loading={deleteLoading}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function AlumniPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-lg bg-white shadow-soft" />}>
      <AlumniPageContent />
    </Suspense>
  );
}
