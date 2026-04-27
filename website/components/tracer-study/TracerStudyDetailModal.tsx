"use client";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Modal } from "@/components/ui/Modal";
import { StarRating } from "@/components/ui/StarRating";
import {
  answerValue,
  optionLabel,
  questionnaireSections,
  shouldShowQuestion,
  type AnswerMap,
  type QuestionnaireQuestion
} from "@/lib/questionnaire/tracer-study-launch";
import { cn } from "@/lib/utils";
import type { TracerStudy } from "@/types";

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-900">{value || "-"}</p>
    </div>
  );
}

function QuestionAnswer({ question, answers }: { question: QuestionnaireQuestion; answers: AnswerMap }) {
  if (!shouldShowQuestion(question, answers)) return null;

  if (question.type === "matrix_pair") {
    return (
      <div className="sm:col-span-2">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-600">{question.label}</p>
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm leading-6">
            <thead className="bg-slate-50 text-left text-[13px] font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-3 py-2">Kompetensi</th>
                <th className="px-3 py-2">{question.leftLabel}</th>
                <th className="px-3 py-2">{question.rightLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {question.rows.map((matrixRow) => (
                <tr key={matrixRow.leftField}>
                  <td className="px-3 py-2 font-medium text-slate-900">{matrixRow.label}</td>
                  <td className="px-3 py-2 text-slate-700">
                    {optionLabel(question.scale, answerValue(answers, matrixRow.leftField)) || "-"}
                  </td>
                  <td className="px-3 py-2 text-slate-700">
                    {optionLabel(question.scale, answerValue(answers, matrixRow.rightField)) || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (question.type === "multi_choice") {
    const selected = question.options
      .filter((option) => answerValue(answers, option.field) === option.value)
      .map((option) => option.label);
    const other = question.otherField ? answerValue(answers, question.otherField) : null;
    return <Field label={question.label} value={[...selected, other].filter(Boolean).join(", ") || "-"} />;
  }

  if (question.type === "single_choice") {
    const value = answerValue(answers, question.id);
    const other = question.otherField ? answerValue(answers, question.otherField) : null;
    return <Field label={question.label} value={[optionLabel(question.options, value), other].filter(Boolean).join(" - ") || "-"} />;
  }

  if (question.type === "scale") {
    return <Field label={question.label} value={optionLabel(question.scale, answerValue(answers, question.id)) || "-"} />;
  }

  const value = answerValue(answers, question.id);
  return <Field label={question.label} value={value ? `${value}${question.suffix ? ` ${question.suffix}` : ""}` : "-"} />;
}

const legacyTabs = ["Data Pribadi", "Data Pekerjaan", "Kompetensi", "Saran"];

export function TracerStudyDetailModal({
  row,
  open,
  onClose
}: {
  row: TracerStudy | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!row) return null;

  const answers = (row.answers ?? {}) as AnswerMap;
  const displayTabs = row.answers ? [...legacyTabs, "Kuesioner Launch"] : legacyTabs;

  return (
    <Modal open={open} onClose={onClose} title="Detail Tracer Study" size="xl">
      <TabGroup>
        <TabList className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {displayTabs.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                cn(
                  "focus-ring rounded-md px-3 py-2 text-sm font-semibold",
                  selected ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel className="grid gap-4 sm:grid-cols-2">
            <Field label="NPM" value={row.alumni?.nim} />
            <Field label="Nama" value={row.alumni?.nama_lengkap} />
            <Field label="Prodi" value={row.alumni?.prodi} />
            <Field label="Tahun Lulus" value={row.alumni?.tahun_lulus} />
            <Field label="IPK" value={row.alumni?.ipk} />
            <Field label="Email" value={row.alumni?.email} />
          </TabPanel>
          <TabPanel className="grid gap-4 sm:grid-cols-2">
            <Field label="Status Kerja" value={row.status_kerja} />
            <Field label="Perusahaan" value={row.nama_perusahaan} />
            <Field label="Bidang" value={row.bidang_pekerjaan} />
            <Field label="Jabatan" value={row.jabatan} />
            <Field label="Gaji" value={row.rentang_gaji} />
            <Field label="Provinsi" value={row.provinsi_kerja} />
            <Field label="Waktu Tunggu" value={row.waktu_tunggu} />
          </TabPanel>
          <TabPanel className="grid gap-4 sm:grid-cols-2">
            <Field label="Kesesuaian Bidang" value={<StarRating value={row.kesesuaian_bidang} />} />
            <Field label="Hard Skill" value={<StarRating value={row.nilai_hard_skill} />} />
            <Field label="Soft Skill" value={<StarRating value={row.nilai_soft_skill} />} />
            <Field label="Bahasa Asing" value={<StarRating value={row.nilai_bahasa_asing} />} />
            <Field label="IT" value={<StarRating value={row.nilai_it} />} />
            <Field label="Kepemimpinan" value={<StarRating value={row.nilai_kepemimpinan} />} />
          </TabPanel>
          <TabPanel className="space-y-4">
            <Field label="Saran Kurikulum" value={row.saran_kurikulum} />
            <Field label="Kesan Kuliah" value={row.kesan_kuliah} />
          </TabPanel>
          {row.answers ? (
            <TabPanel className="space-y-8">
              {questionnaireSections.map((section) => (
                <section key={section.id}>
                  <h3 className="font-heading text-base font-semibold text-slate-900">{section.title}</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {section.questions.map((question) => (
                      <QuestionAnswer key={question.id} question={question} answers={answers} />
                    ))}
                  </div>
                </section>
              ))}
            </TabPanel>
          ) : null}
        </TabPanels>
      </TabGroup>
    </Modal>
  );
}
