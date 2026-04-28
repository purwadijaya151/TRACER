import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import type {
  QuestionChoiceOption,
  QuestionMatrixRow,
  QuestionMultiChoiceOption,
  QuestionRequiredWhen,
  QuestionType
} from "@/types";

export type QuestionFormValues = {
  questionnaire_version: string;
  code: string;
  section_id: string;
  section_title: string;
  section_order: number;
  order_index: number;
  question_text: string;
  description?: string | null;
  question_type: QuestionType;
  is_required: boolean;
  is_active: boolean;
  options_text?: string | null;
  matrix_rows_text?: string | null;
  required_when_field?: string | null;
  required_when_values?: string | null;
  suffix?: string | null;
  matrix_left_label?: string | null;
  matrix_right_label?: string | null;
};

export function questionTypeLabel(type: QuestionType) {
  return QUESTION_TYPE_LABELS[type] ?? type;
}

export function parseChoiceOptions(text?: string | null): QuestionChoiceOption[] {
  return splitLines(text).map((line, index) => {
    const [rawValue, ...labelParts] = line.split("|").map((part) => part.trim());
    const label = labelParts.join("|").trim();
    if (!label) return { value: String(index + 1), label: rawValue };
    return { value: rawValue, label };
  });
}

export function parseMultiChoiceOptions(text?: string | null): QuestionMultiChoiceOption[] {
  return splitLines(text).map((line) => {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length >= 3) {
      return {
        field: parts[0],
        value: parts[1],
        label: parts.slice(2).join("|")
      };
    }
    if (parts.length === 2) {
      return {
        field: parts[0],
        value: "1",
        label: parts[1]
      };
    }
    return {
      field: slugCode(parts[0]),
      value: "1",
      label: parts[0]
    };
  });
}

export function parseMatrixRows(text?: string | null): QuestionMatrixRow[] {
  return splitLines(text).map((line) => {
    const parts = line.split("|").map((part) => part.trim());
    if (parts.length < 3) {
      const field = slugCode(parts[0]);
      return {
        label: parts[0],
        leftField: `${field}_a`,
        rightField: `${field}_b`
      };
    }
    return {
      label: parts[0],
      leftField: parts[1],
      rightField: parts.slice(2).join("|")
    };
  });
}

export function parseRequiredWhen(field?: string | null, values?: string | null): QuestionRequiredWhen | null {
  const normalizedField = field?.trim();
  const parsedValues = splitValues(values);
  if (!normalizedField || parsedValues.length === 0) return null;
  return {
    field: normalizedField,
    values: parsedValues
  };
}

export function normalizeQuestionPayload(input: QuestionFormValues) {
  const requiredWhen = parseRequiredWhen(input.required_when_field, input.required_when_values);
  const metadata: Record<string, unknown> = {};
  const suffix = input.suffix?.trim();
  if (suffix) metadata.suffix = suffix;

  let options: unknown = [];
  if (input.question_type === "single_choice" || input.question_type === "scale") {
    options = parseChoiceOptions(input.options_text);
  } else if (input.question_type === "multi_choice") {
    options = parseMultiChoiceOptions(input.options_text);
  } else if (input.question_type === "matrix_pair") {
    const leftLabel = input.matrix_left_label?.trim() || "A";
    const rightLabel = input.matrix_right_label?.trim() || "B";
    metadata.leftLabel = leftLabel;
    metadata.rightLabel = rightLabel;
    options = {
      leftLabel,
      rightLabel,
      scale: parseChoiceOptions(input.options_text),
      rows: parseMatrixRows(input.matrix_rows_text)
    };
  }

  return {
    questionnaire_version: input.questionnaire_version.trim(),
    code: input.code.trim(),
    section_id: input.section_id.trim(),
    section_title: input.section_title.trim(),
    section_order: input.section_order,
    order_index: input.order_index,
    question_text: input.question_text.trim(),
    description: input.description?.trim() || null,
    question_type: input.question_type,
    is_required: input.is_required,
    is_active: input.is_active,
    options,
    required_when: requiredWhen,
    metadata: Object.keys(metadata).length > 0 ? metadata : null
  };
}

export function validateQuestionPayload(input: QuestionFormValues) {
  if (requiresChoiceOptions(input.question_type) && parseChoiceOptions(input.options_text).length === 0) {
    return `${questionTypeLabel(input.question_type)} membutuhkan opsi`;
  }
  if (input.question_type === "multi_choice" && parseMultiChoiceOptions(input.options_text).length === 0) {
    return "Pilihan ganda membutuhkan daftar opsi";
  }
  if (input.question_type === "matrix_pair") {
    if (parseChoiceOptions(input.options_text).length === 0) return "Matriks membutuhkan skala jawaban";
    if (parseMatrixRows(input.matrix_rows_text).length === 0) return "Matriks membutuhkan minimal satu baris";
  }
  return null;
}

function requiresChoiceOptions(type: QuestionType) {
  return type === "single_choice" || type === "scale";
}

function splitLines(text?: string | null) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitValues(text?: string | null) {
  return (text ?? "")
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function slugCode(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}
