"use client";

import {
  answerValue,
  optionLabel,
  shouldShowQuestion,
  type AnswerMap,
  type QuestionnaireQuestion,
  type QuestionnaireSection
} from "@/lib/questionnaire/tracer-study-launch";

function AnswerField({ label, value }: { label: string; value?: React.ReactNode }) {
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
    return <AnswerField label={question.label} value={selected.join(", ") || "-"} />;
  }

  if (question.type === "single_choice") {
    const value = answerValue(answers, question.id);
    return <AnswerField label={question.label} value={optionLabel(question.options, value) || "-"} />;
  }

  if (question.type === "scale") {
    return <AnswerField label={question.label} value={optionLabel(question.scale, answerValue(answers, question.id)) || "-"} />;
  }

  const value = answerValue(answers, question.id);
  return <AnswerField label={question.label} value={value ? `${value}${question.suffix ? ` ${question.suffix}` : ""}` : "-"} />;
}

export function QuestionnaireAnswersPanel({
  sections,
  answers
}: {
  sections: QuestionnaireSection[];
  answers: AnswerMap;
}) {
  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Pertanyaan aktif untuk versi kuesioner ini belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
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
  );
}
