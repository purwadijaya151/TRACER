"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileQuestion, Plus } from "lucide-react";
import { toast } from "sonner";
import { DeleteConfirmModal } from "@/components/alumni/DeleteConfirmModal";
import { PertanyaanModal } from "@/components/pertanyaan/PertanyaanModal";
import { PertanyaanTable } from "@/components/pertanyaan/PertanyaanTable";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { deleteQuestionnaireQuestion, getQuestionnaireQuestions } from "@/lib/actions/pertanyaan.actions";
import { QUESTIONNAIRE_DEFAULT_VERSION, QUESTION_TYPE_OPTIONS } from "@/lib/constants";
import { questionTypeLabel } from "@/lib/questionnaire";
import type { PaginatedResult, QuestionnaireFilters, QuestionnaireQuestion, QuestionType } from "@/types";

const pageSize = 12;

export default function PertanyaanPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<QuestionType | "all">("all");
  const [status, setStatus] = useState<QuestionnaireFilters["status"]>("all");
  const [version, setVersion] = useState(QUESTIONNAIRE_DEFAULT_VERSION);
  const [data, setData] = useState<PaginatedResult<QuestionnaireQuestion> | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionnaireQuestion | null>(null);
  const [deleting, setDeleting] = useState<QuestionnaireQuestion | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filters = useMemo<QuestionnaireFilters>(
    () => ({
      search,
      type,
      status,
      version: version || undefined
    }),
    [search, status, type, version]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getQuestionnaireQuestions(filters, page, pageSize);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setData(result.data);
  }, [filters, page]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rows = data?.rows ?? [];
  const activeCount = rows.filter((row) => row.is_active).length;
  const sectionCount = new Set(rows.map((row) => row.section_id)).size;

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    const result = await deleteQuestionnaireQuestion(deleting.id);
    setDeleteLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Pertanyaan dihapus");
    setDeleting(null);
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-soft">
          <div className="flex items-center gap-3">
            <FileQuestion className="h-5 w-5 text-navy" />
            <p className="font-heading text-base font-semibold leading-6 text-slate-950">Pertanyaan Aktif</p>
          </div>
          <p className="mt-3 font-heading text-3xl font-semibold leading-10 text-slate-950">{activeCount}</p>
          <p className="text-sm leading-5 text-slate-600">Pada halaman hasil filter saat ini</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-soft">
          <p className="font-heading text-base font-semibold leading-6 text-slate-950">Section</p>
          <p className="mt-3 font-heading text-3xl font-semibold leading-10 text-slate-950">{sectionCount}</p>
          <p className="text-sm leading-5 text-slate-600">Kelompok kuisioner yang terdeteksi</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-soft">
          <p className="font-heading text-base font-semibold leading-6 text-slate-950">Versi</p>
          <p className="mt-3 font-heading text-3xl font-semibold leading-10 text-slate-950">{version || "-"}</p>
          <p className="text-sm leading-5 text-slate-600">Target konfigurasi Android</p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Bank Pertanyaan"
          description="Kelola struktur kuisioner, tipe input, opsi jawaban, dan kondisi tampil."
          action={
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
              <Plus className="h-4 w-4" />
              Tambah Pertanyaan
            </Button>
          }
        />
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr]">
            <Input placeholder="Cari kode, section, atau teks..." value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} />
            <Input placeholder="Versi" value={version} onChange={(event) => { setPage(1); setVersion(event.target.value); }} />
            <Select value={type} onChange={(event) => { setPage(1); setType(event.target.value as QuestionType | "all"); }}>
              <option value="all">Semua Tipe</option>
              {QUESTION_TYPE_OPTIONS.map((item) => <option key={item} value={item}>{questionTypeLabel(item)}</option>)}
            </Select>
            <Select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as QuestionnaireFilters["status"]); }}>
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </Select>
          </div>

          <PertanyaanTable
            rows={rows}
            loading={loading}
            onEdit={(question) => { setEditing(question); setModalOpen(true); }}
            onDelete={setDeleting}
          />
        </CardContent>
        <Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} />
      </Card>

      <PertanyaanModal open={modalOpen} question={editing} onClose={() => setModalOpen(false)} onSaved={refresh} />
      <DeleteConfirmModal
        open={Boolean(deleting)}
        title="Hapus Pertanyaan"
        description={`Pertanyaan "${deleting?.code ?? ""}" akan dihapus dari bank kuisioner.`}
        loading={deleteLoading}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
