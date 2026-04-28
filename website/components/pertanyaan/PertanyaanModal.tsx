"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { createQuestionnaireQuestion, updateQuestionnaireQuestion } from "@/lib/actions/pertanyaan.actions";
import { QUESTIONNAIRE_DEFAULT_VERSION, QUESTION_TYPE_OPTIONS } from "@/lib/constants";
import { questionTypeLabel, type QuestionFormValues } from "@/lib/questionnaire";
import type { QuestionChoiceOption, QuestionMatrixRow, QuestionMultiChoiceOption, QuestionnaireQuestion } from "@/types";

const defaultValues: QuestionFormValues = {
  questionnaire_version: QUESTIONNAIRE_DEFAULT_VERSION,
  code: "",
  section_id: "",
  section_title: "",
  section_order: 1,
  order_index: 1,
  question_text: "",
  description: "",
  question_type: "text",
  is_required: false,
  is_active: true,
  options_text: "",
  matrix_rows_text: "",
  required_when_field: "",
  required_when_values: "",
  suffix: "",
  matrix_left_label: "A. Dikuasai saat lulus",
  matrix_right_label: "B. Diperlukan dalam pekerjaan"
};

export function PertanyaanModal({
  open,
  question,
  onClose,
  onSaved
}: {
  open: boolean;
  question: QuestionnaireQuestion | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [values, setValues] = useState<QuestionFormValues>(defaultValues);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(question ? questionToFormValues(question) : defaultValues);
  }, [open, question]);

  const setValue = <K extends keyof QuestionFormValues>(key: K, value: QuestionFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    setSaving(true);
    const result = question
      ? await updateQuestionnaireQuestion(question.id, values)
      : await createQuestionnaireQuestion(values);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success(question ? "Pertanyaan diperbarui" : "Pertanyaan ditambahkan");
    onSaved();
    onClose();
  };

  const showChoiceOptions = values.question_type === "single_choice" || values.question_type === "scale";
  const showMultiChoice = values.question_type === "multi_choice";
  const showMatrix = values.question_type === "matrix_pair";
  const showSuffix = values.question_type === "text" || values.question_type === "number" || values.question_type === "date";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={question ? "Edit Pertanyaan" : "Tambah Pertanyaan"}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button loading={saving} onClick={submit}>Simpan</Button>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Versi" value={values.questionnaire_version} onChange={(event) => setValue("questionnaire_version", event.target.value)} />
            <Input label="Urutan Section" type="number" value={values.section_order} onChange={(event) => setValue("section_order", Number(event.target.value || 1))} />
            <Input label="Urutan Pertanyaan" type="number" value={values.order_index} onChange={(event) => setValue("order_index", Number(event.target.value || 1))} />
            <Input label="Kode Pertanyaan" value={values.code} onChange={(event) => setValue("code", event.target.value)} placeholder="f8" />
            <Select label="Tipe Pertanyaan" value={values.question_type} onChange={(event) => setValue("question_type", event.target.value as QuestionFormValues["question_type"])}>
              {QUESTION_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{questionTypeLabel(type)}</option>)}
            </Select>
            <Input label="Kode Section" value={values.section_id} onChange={(event) => setValue("section_id", event.target.value)} placeholder="status" />
            <Input label="Nama Section" value={values.section_title} onChange={(event) => setValue("section_title", event.target.value)} placeholder="Status Alumni" />
          </div>

          <Textarea
            label="Teks Pertanyaan"
            value={values.question_text}
            onChange={(event) => setValue("question_text", event.target.value)}
            className="min-h-24"
          />
          <Textarea
            label="Catatan Admin"
            value={values.description ?? ""}
            onChange={(event) => setValue("description", event.target.value)}
            className="min-h-20"
          />

          {showChoiceOptions ? (
            <Textarea
              label="Opsi Jawaban"
              value={values.options_text ?? ""}
              onChange={(event) => setValue("options_text", event.target.value)}
              placeholder={"1|Bekerja\n2|Belum bekerja"}
            />
          ) : null}

          {showMultiChoice ? (
            <Textarea
              label="Opsi Pilihan Ganda"
              value={values.options_text ?? ""}
              onChange={(event) => setValue("options_text", event.target.value)}
              placeholder={"f401|1|Melalui iklan\nf402|1|Melamar langsung"}
            />
          ) : null}

          {showMatrix ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Label Kolom A" value={values.matrix_left_label ?? ""} onChange={(event) => setValue("matrix_left_label", event.target.value)} />
                <Input label="Label Kolom B" value={values.matrix_right_label ?? ""} onChange={(event) => setValue("matrix_right_label", event.target.value)} />
              </div>
              <Textarea
                label="Skala Matriks"
                value={values.options_text ?? ""}
                onChange={(event) => setValue("options_text", event.target.value)}
                placeholder={"1|Sangat Rendah\n2|Rendah\n3|Cukup\n4|Tinggi\n5|Sangat Tinggi"}
              />
              <Textarea
                label="Baris Matriks"
                value={values.matrix_rows_text ?? ""}
                onChange={(event) => setValue("matrix_rows_text", event.target.value)}
                placeholder={"Etika|f1761|f1762\nBahasa Inggris|f1765|f1766"}
              />
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="font-heading text-base font-semibold leading-6 text-slate-950">Perilaku</p>
            <label className="mt-4 flex items-start gap-3 text-sm leading-5 text-slate-700">
              <input
                type="checkbox"
                checked={values.is_required}
                onChange={(event) => setValue("is_required", event.target.checked)}
                className="mt-1"
              />
              Wajib dijawab
            </label>
            <label className="mt-3 flex items-start gap-3 text-sm leading-5 text-slate-700">
              <input
                type="checkbox"
                checked={values.is_active}
                onChange={(event) => setValue("is_active", event.target.checked)}
                className="mt-1"
              />
              Aktif di aplikasi
            </label>
          </div>

          <div className="rounded-lg border border-slate-100 p-4">
            <p className="font-heading text-base font-semibold leading-6 text-slate-950">Kondisional</p>
            <div className="mt-4 space-y-3">
              <Input label="Tampil/Wajib Jika Field" value={values.required_when_field ?? ""} onChange={(event) => setValue("required_when_field", event.target.value)} placeholder="f8" />
              <Input label="Nilai Pemicu" value={values.required_when_values ?? ""} onChange={(event) => setValue("required_when_values", event.target.value)} placeholder="1, 3" />
            </div>
          </div>

          {showSuffix ? (
            <Input label="Satuan/Suffix" value={values.suffix ?? ""} onChange={(event) => setValue("suffix", event.target.value)} placeholder="bulan" />
          ) : null}
        </aside>
      </div>
    </Modal>
  );
}

function questionToFormValues(question: QuestionnaireQuestion): QuestionFormValues {
  const metadata = question.metadata ?? {};
  return {
    questionnaire_version: question.questionnaire_version,
    code: question.code,
    section_id: question.section_id,
    section_title: question.section_title,
    section_order: question.section_order ?? 1,
    order_index: question.order_index,
    question_text: question.question_text,
    description: question.description ?? "",
    question_type: question.question_type,
    is_required: question.is_required,
    is_active: question.is_active,
    options_text: optionsToText(question),
    matrix_rows_text: matrixRowsToText(question),
    required_when_field: question.required_when?.field ?? "",
    required_when_values: question.required_when?.values.join(", ") ?? "",
    suffix: typeof metadata.suffix === "string" ? metadata.suffix : "",
    matrix_left_label: typeof metadata.leftLabel === "string" ? metadata.leftLabel : "A. Dikuasai saat lulus",
    matrix_right_label: typeof metadata.rightLabel === "string" ? metadata.rightLabel : "B. Diperlukan dalam pekerjaan"
  };
}

function optionsToText(question: QuestionnaireQuestion) {
  if (question.question_type === "matrix_pair" && isRecord(question.options) && Array.isArray(question.options.scale)) {
    return (question.options.scale as QuestionChoiceOption[])
      .map((option) => `${option.value}|${option.label}`)
      .join("\n");
  }
  if (question.question_type === "multi_choice" && Array.isArray(question.options)) {
    return (question.options as QuestionMultiChoiceOption[])
      .map((option) => `${option.field}|${option.value}|${option.label}`)
      .join("\n");
  }
  if (Array.isArray(question.options)) {
    return (question.options as QuestionChoiceOption[])
      .map((option) => `${option.value}|${option.label}`)
      .join("\n");
  }
  return "";
}

function matrixRowsToText(question: QuestionnaireQuestion) {
  if (!isRecord(question.options) || !Array.isArray(question.options.rows)) return "";
  return (question.options.rows as QuestionMatrixRow[])
    .map((row) => `${row.label}|${row.leftField}|${row.rightField}`)
    .join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
