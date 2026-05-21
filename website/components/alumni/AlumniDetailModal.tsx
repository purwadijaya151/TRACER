"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { QuestionnaireAnswersPanel } from "@/components/tracer-study/QuestionnaireAnswersPanel";
import { getActiveQuestionnaireQuestions } from "@/lib/actions/pertanyaan.actions";
import { getLatestTracerStudyDetailByAlumni } from "@/lib/actions/tracer-study.actions";
import { buildQuestionnaireSections } from "@/lib/questionnaire-render";
import { cn, formatDate, getTracerRecord } from "@/lib/utils";
import type { Alumni, QuestionnaireQuestion, TracerStudy } from "@/types";

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium leading-5 text-slate-600">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-900">{value || "-"}</p>
    </div>
  );
}

export function AlumniDetailModal({
  alumni,
  open,
  onClose
}: {
  alumni: Alumni | null;
  open: boolean;
  onClose: () => void;
}) {
  const [tracerDetail, setTracerDetail] = useState<TracerStudy | null>(null);
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [questionnaireError, setQuestionnaireError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !alumni) {
      if (!open) {
        setTracerDetail(null);
        setQuestions([]);
        setQuestionnaireError(null);
      }
      return;
    }

    const tracer = getTracerRecord(alumni);
    if (!tracer?.is_submitted) {
      setTracerDetail(null);
      setQuestions([]);
      setQuestionnaireError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setQuestionnaireError(null);

    void (async () => {
      const tracerResult = await getLatestTracerStudyDetailByAlumni(alumni.id);
      if (cancelled) return;

      if (tracerResult.error) {
        toast.error(tracerResult.error);
        setTracerDetail(null);
        setQuestions([]);
        setQuestionnaireError(tracerResult.error);
        setLoading(false);
        return;
      }

      const latestTracer = tracerResult.data;
      setTracerDetail(latestTracer);

      if (!latestTracer?.answers) {
        setQuestions([]);
        setLoading(false);
        return;
      }

      const questionnaireResult = await getActiveQuestionnaireQuestions(latestTracer.questionnaire_version ?? undefined);
      if (cancelled) return;

      if (questionnaireResult.error) {
        toast.error(questionnaireResult.error);
        setQuestions([]);
        setQuestionnaireError(questionnaireResult.error);
      } else {
        setQuestions(questionnaireResult.data ?? []);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [alumni, open]);

  if (!alumni) return null;
  const tracer = getTracerRecord(alumni);
  const questionnaireSections = buildQuestionnaireSections(questions);
  const showQuestionnaireTab = Boolean(tracer?.is_submitted);
  const tabs = showQuestionnaireTab ? ["Profil Alumni", "Jawaban Kuesioner"] : ["Profil Alumni"];
  const birthPlaceAndDate = [alumni.tempat_lahir, formatDate(alumni.tanggal_lahir)]
    .filter(Boolean)
    .join(" / ");

  return (
    <Modal open={open} onClose={onClose} title="Detail Alumni" size="lg">
      <TabGroup>
        <TabList className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {tabs.map((tab) => (
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
            <DetailRow label="NPM" value={alumni.nim} />
            <DetailRow label="Nama" value={alumni.nama_lengkap} />
            <DetailRow label="Prodi" value={<Badge variant="info">{alumni.prodi}</Badge>} />
            <DetailRow label="Tahun Masuk" value={alumni.tahun_masuk} />
            <DetailRow label="Tahun Lulus" value={alumni.tahun_lulus} />
            <DetailRow label="IPK" value={alumni.ipk ?? "-"} />
            <DetailRow label="Email" value={alumni.email} />
            <DetailRow label="No HP" value={alumni.no_hp} />
            <DetailRow label="Tempat/Tanggal Lahir" value={birthPlaceAndDate || "-"} />
            <DetailRow
              label="Status Tracer"
              value={
                <Badge variant={tracer?.is_submitted ? "success" : "warning"}>
                  {tracer?.is_submitted ? "Sudah Mengisi" : "Belum Mengisi"}
                </Badge>
              }
            />
            <DetailRow label="Versi Kuesioner" value={tracerDetail?.questionnaire_version ?? "-"} />
            <DetailRow label="Tanggal Isi Terakhir" value={formatDate(tracerDetail?.submitted_at)} />
            <div className="sm:col-span-2">
              <DetailRow label="Alamat" value={alumni.alamat} />
            </div>
          </TabPanel>
          {showQuestionnaireTab ? (
            <TabPanel>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-10 rounded-lg bg-slate-100" />
                  <div className="h-24 rounded-lg bg-slate-100" />
                  <div className="h-24 rounded-lg bg-slate-100" />
                </div>
              ) : questionnaireError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {questionnaireError}
                </div>
              ) : tracerDetail?.answers ? (
                <QuestionnaireAnswersPanel
                  sections={questionnaireSections}
                  answers={tracerDetail.answers as Record<string, string | number | boolean | null>}
                />
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Jawaban tracer terbaru belum tersedia untuk alumni ini.
                </div>
              )}
            </TabPanel>
          ) : null}
        </TabPanels>
      </TabGroup>
    </Modal>
  );
}
