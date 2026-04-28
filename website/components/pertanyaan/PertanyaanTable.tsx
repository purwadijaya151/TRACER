"use client";

import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyTableRow, Table, Td, Th } from "@/components/ui/Table";
import { questionTypeLabel } from "@/lib/questionnaire";
import type { QuestionnaireQuestion } from "@/types";

export function PertanyaanTable({
  rows,
  loading,
  onEdit,
  onDelete
}: {
  rows: QuestionnaireQuestion[];
  loading: boolean;
  onEdit: (question: QuestionnaireQuestion) => void;
  onDelete: (question: QuestionnaireQuestion) => void;
}) {
  return (
    <Table className="min-w-[920px]">
      <thead>
        <tr>
          <Th className="w-20 whitespace-nowrap">Urut</Th>
          <Th className="min-w-[300px]">Pertanyaan</Th>
          <Th className="min-w-[190px]">Section</Th>
          <Th className="w-36 whitespace-nowrap">Tipe</Th>
          <Th className="w-32 whitespace-nowrap">Status</Th>
          <Th className="w-32 text-right">Aksi</Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {loading ? (
          <EmptyTableRow colSpan={6} title="Memuat pertanyaan" description="Mengambil konfigurasi kuisioner." />
        ) : rows.length === 0 ? (
          <EmptyTableRow colSpan={6} title="Belum ada pertanyaan" description="Tambahkan pertanyaan agar Android bisa memakai konfigurasi dinamis." />
        ) : (
          rows.map((question, index) => (
            <tr key={question.id} className={index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"}>
              <Td>
                <span className="font-semibold text-slate-900">{question.section_order}.{question.order_index}</span>
              </Td>
              <Td>
                <div className="max-w-xl">
                  <p className="font-semibold text-slate-950">{question.question_text}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {question.code} - {question.questionnaire_version}
                  </p>
                </div>
              </Td>
              <Td>
                <p className="font-medium text-slate-900">{question.section_title}</p>
                <p className="text-sm leading-5 text-slate-600">{question.section_id} - urutan {question.section_order}</p>
              </Td>
              <Td>
                <Badge variant="info">{questionTypeLabel(question.question_type)}</Badge>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={question.is_active ? "success" : "neutral"}>{question.is_active ? "Aktif" : "Nonaktif"}</Badge>
                  {question.is_required ? <Badge variant="warning">Wajib</Badge> : null}
                </div>
              </Td>
              <Td>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" aria-label={`Edit ${question.code}`} onClick={() => onEdit(question)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Hapus ${question.code}`} onClick={() => onDelete(question)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </Td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
