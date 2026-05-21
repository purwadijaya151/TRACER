"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Modal } from "@/components/ui/Modal";
import { StarRating } from "@/components/ui/StarRating";
import { getTracerStudyDetail } from "@/lib/actions/tracer-study.actions";
import {
  answerValue,
  optionLabel,
  questionnaireSections,
  shouldShowQuestion,
  type AnswerMap,
  type QuestionnaireQuestion
} from "@/lib/questionnaire/tracer-study-launch";
import {
  getTracerCityDisplay,
  getTracerCompanyDisplay,
  getTracerMonthlyIncomeDisplay,
  getTracerPositionDisplay,
  getTracerProvinceDisplay,
  getTracerWaitTimeDisplay,
  getTracerWorkplaceLevelDisplay
} from "@/lib/tracer-study-display";
import { cn } from "@/lib/utils";
import type { TracerStudy } from "@/types";

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium leading-5 text-slate-600">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-900">{value || "-"}</p>
    </div>
  );
}

function QuestionAnswer({ question, answers }: { question: QuestionnaireQuestion; answers: AnswerMap }) {
  if (!shouldShowQuestion(question, answers)) return null;

  if (question.type === "matrix_pair") {
    return (
      <div className="sm:col-span-2">
        <p className="text-sm font-medium leading-5 text-slate-600">{question.label}</p>
        <div className="mt-3 overflow-hidden rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm leading-6">
            <thead className="bg-slate-50 text-left text-sm font-semibold leading-5 text-slate-600">
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

export function TracerStudyDetailModal({
  tracerStudyId,
  open,
  onClose
}: {
  tracerStudyId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [row, setRow] = useState<TracerStudy | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tracerStudyId) {
      if (!open) {
        setRow(null);
        setError(null);
      }
      return;
    }

    let cancelled = false;
    setLoading(true);
    setRow(null);
    setError(null);

    void (async () => {
      const result = await getTracerStudyDetail(tracerStudyId);
      if (cancelled) return;

      if (result.error || !result.data) {
        const message = result.error ?? "Gagal memuat detail tracer study";
        toast.error(message);
        setRow(null);
        setError(message);
      } else {
        setRow(result.data);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, tracerStudyId]);

  if (!open) return null;

  if (loading) {
    return (
      <Modal open={open} onClose={onClose} title="Detail Tracer Study" size="xl">
        <div className="space-y-3">
          <div className="h-10 rounded-lg bg-slate-100" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-20 rounded-lg bg-slate-100" />
            <div className="h-20 rounded-lg bg-slate-100" />
            <div className="h-20 rounded-lg bg-slate-100" />
            <div className="h-20 rounded-lg bg-slate-100" />
          </div>
        </div>
      </Modal>
    );
  }

  if (error || !row) {
    return (
      <Modal open={open} onClose={onClose} title="Detail Tracer Study" size="xl">
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error ?? "Detail tracer study tidak tersedia."}
        </div>
      </Modal>
    );
  }

  const answers = (row.answers ?? {}) as AnswerMap;
  const display = {
    city: getTracerCityDisplay(row),
    company: getTracerCompanyDisplay(row),
    position: getTracerPositionDisplay(row),
    province: getTracerProvinceDisplay(row),
    monthlyIncome: getTracerMonthlyIncomeDisplay(row),
    waitTime: getTracerWaitTimeDisplay(row),
    workplaceLevel: getTracerWorkplaceLevelDisplay(row)
  };
  const hasQuestionnaireAnswers = Boolean(row.answers && Object.keys(row.answers).length > 0);
  const suggestionRows = [
    { label: "Saran Kurikulum", value: row.saran_kurikulum },
    { label: "Kesan Kuliah", value: row.kesan_kuliah }
  ].filter((item) => item.value);
  const tabs = [
    {
      label: "Data Pribadi",
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="NPM" value={row.alumni?.nim} />
          <Field label="Nama" value={row.alumni?.nama_lengkap} />
          <Field label="Prodi" value={row.alumni?.prodi} />
          <Field label="Tahun Lulus" value={row.alumni?.tahun_lulus} />
          <Field label="IPK" value={row.alumni?.ipk} />
          <Field label="Email" value={row.alumni?.email} />
        </div>
      )
    },
    {
      label: "Data Pekerjaan",
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status Kerja" value={row.status_kerja} />
          <Field label="Perusahaan / Usaha" value={display.company} />
          <Field label="Pendapatan per Bulan" value={display.monthlyIncome} />
          <Field label="Waktu Tunggu" value={display.waitTime} />
          <Field label="Provinsi Kerja" value={display.province} />
          <Field label="Kota/Kabupaten Kerja" value={display.city} />
          <Field label="Tingkat Tempat Kerja" value={display.workplaceLevel} />
          <Field label="Posisi/Jabatan Wirausaha" value={display.position} />
        </div>
      )
    },
    {
      label: "Kompetensi",
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kesesuaian Bidang" value={<StarRating value={row.kesesuaian_bidang} />} />
          <Field label="Hard Skill" value={<StarRating value={row.nilai_hard_skill} />} />
          <Field label="Soft Skill" value={<StarRating value={row.nilai_soft_skill} />} />
          <Field label="Bahasa Asing" value={<StarRating value={row.nilai_bahasa_asing} />} />
          <Field label="IT" value={<StarRating value={row.nilai_it} />} />
          <Field label="Kepemimpinan" value={<StarRating value={row.nilai_kepemimpinan} />} />
        </div>
      )
    }
  ];

  if (suggestionRows.length > 0) {
    tabs.push({
      label: "Saran",
      content: (
        <div className="space-y-4">
          {suggestionRows.map((item) => (
            <Field key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      )
    });
  }

  if (hasQuestionnaireAnswers) {
    tabs.push({
      label: "Kuesioner Launch",
      content: (
        <div className="space-y-8">
          {questionnaireSections.map((section) => (
            <section key={section.id}>
              <h3 className="font-heading text-lg font-semibold leading-7 text-slate-900">{section.title}</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {section.questions.map((question) => (
                  <QuestionAnswer key={question.id} question={question} answers={answers} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Detail Tracer Study" size="xl">
      <TabGroup>
        <TabList className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {tabs.map((tab) => (
            <Tab
              key={tab.label}
              className={({ selected }) =>
                cn(
                  "focus-ring rounded-md px-3 py-2 text-sm font-semibold",
                  selected ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"
                )
              }
            >
              {tab.label}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {tabs.map((tab) => (
            <TabPanel key={tab.label}>{tab.content}</TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </Modal>
  );
}
