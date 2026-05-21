import type { QuestionnaireQuestion as StoredQuestion } from "@/types";
import type {
  ChoiceOption,
  QuestionnaireQuestion as RuntimeQuestion,
  QuestionnaireSection
} from "@/lib/questionnaire/tracer-study-launch";

type QuestionGroup = {
  key: string;
  sectionId: string;
  title: string;
  sectionOrder: number;
  questions: Array<{ order: number; code: string; value: RuntimeQuestion }>;
};

type StoredRequiredWhen = { field?: unknown; values?: unknown } | null | undefined;
type MatrixOptionShape = {
  leftLabel?: unknown;
  rightLabel?: unknown;
  scale?: unknown;
  rows?: unknown;
} | null | undefined;

export function buildQuestionnaireSections(questions: StoredQuestion[]): QuestionnaireSection[] {
  const groups = new Map<string, QuestionGroup>();

  for (const question of questions.filter((item) => item.is_active)) {
    const key = `${question.questionnaire_version}:${question.section_id}`;
    const group = groups.get(key) ?? {
      key,
      sectionId: question.section_id,
      title: question.section_title,
      sectionOrder: question.section_order,
      questions: []
    };

    group.questions.push({
      order: question.order_index,
      code: question.code,
      value: toRuntimeQuestion(question)
    });
    groups.set(key, group);
  }

  return Array.from(groups.values())
    .sort((left, right) => left.sectionOrder - right.sectionOrder || left.title.localeCompare(right.title))
    .map((group) => ({
      id: group.sectionId,
      title: group.title,
      questions: group.questions
        .sort((left, right) => left.order - right.order || left.code.localeCompare(right.code))
        .map((item) => item.value)
    }));
}

function toRuntimeQuestion(question: StoredQuestion): RuntimeQuestion {
  const base = {
    id: question.code,
    code: question.code,
    label: question.question_text,
    required: question.is_required,
    requiredWhen: normalizeRequiredWhen(question.required_when)
  };

  if (question.question_type === "matrix_pair") {
    const matrix = normalizeMatrixOptions(question.options);
    return {
      ...base,
      type: "matrix_pair",
      leftLabel: matrix.leftLabel,
      rightLabel: matrix.rightLabel,
      scale: matrix.scale,
      rows: matrix.rows
    };
  }

  if (question.question_type === "multi_choice") {
    return {
      ...base,
      type: "multi_choice",
      options: normalizeMultiChoiceOptions(question.options)
    };
  }

  if (question.question_type === "single_choice") {
    return {
      ...base,
      type: "single_choice",
      options: normalizeChoiceOptions(question.options)
    };
  }

  if (question.question_type === "scale") {
    return {
      ...base,
      type: "scale",
      scale: normalizeChoiceOptions(question.options)
    };
  }

  if (question.question_type === "number") {
    return {
      ...base,
      type: "number",
      suffix: readString(question.metadata, "suffix") ?? undefined
    };
  }

  if (question.question_type === "date") {
    return {
      ...base,
      type: "date"
    };
  }

  return {
    ...base,
    type: "text"
  };
}

function normalizeRequiredWhen(value: StoredRequiredWhen) {
  if (!value || typeof value !== "object") return undefined;

  const field = typeof value.field === "string" ? value.field.trim() : "";
  const values = Array.isArray(value.values)
    ? value.values.map((item) => String(item).trim()).filter(Boolean)
    : [];

  if (!field || values.length === 0) return undefined;
  return { field, values };
}

function normalizeChoiceOptions(input: unknown): ChoiceOption[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const value = typeof item.value === "string" || typeof item.value === "number" ? String(item.value).trim() : "";
      const label = typeof item.label === "string" ? item.label.trim() : "";
      if (!value || !label) return null;
      return { value, label };
    })
    .filter((item): item is ChoiceOption => Boolean(item));
}

function normalizeMultiChoiceOptions(input: unknown) {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const field = typeof item.field === "string" ? item.field.trim() : "";
      const value = typeof item.value === "string" || typeof item.value === "number" ? String(item.value).trim() : "";
      const label = typeof item.label === "string" ? item.label.trim() : "";
      if (!field || !label) return null;
      return { field, value: value || "1", label };
    })
    .filter((item): item is { field: string; value: string; label: string } => Boolean(item));
}

function normalizeMatrixOptions(input: unknown) {
  const matrix = (input ?? null) as MatrixOptionShape;
  const leftLabel = typeof matrix?.leftLabel === "string" && matrix.leftLabel.trim() ? matrix.leftLabel.trim() : "A";
  const rightLabel = typeof matrix?.rightLabel === "string" && matrix.rightLabel.trim() ? matrix.rightLabel.trim() : "B";
  const scale = normalizeChoiceOptions(matrix?.scale);
  const rows = Array.isArray(matrix?.rows)
    ? matrix.rows
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const label = typeof item.label === "string" ? item.label.trim() : "";
          const leftField = typeof item.leftField === "string" ? item.leftField.trim() : "";
          const rightField = typeof item.rightField === "string" ? item.rightField.trim() : "";
          if (!label || !leftField || !rightField) return null;
          return { label, leftField, rightField };
        })
        .filter((item): item is { label: string; leftField: string; rightField: string } => Boolean(item))
    : [];

  return { leftLabel, rightLabel, scale, rows };
}

function readString(input: unknown, key: string) {
  if (!input || typeof input !== "object") return null;
  const value = Reflect.get(input, key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
