import { describe, expect, it } from "vitest";
import {
  normalizeQuestionPayload,
  parseChoiceOptions,
  parseMultiChoiceOptions,
  parseRequiredWhen,
  validateQuestionPayload
} from "@/lib/questionnaire";

describe("questionnaire helpers", () => {
  it("parses choice options from admin line format", () => {
    expect(parseChoiceOptions("1|Bekerja\n2|Belum bekerja")).toEqual([
      { value: "1", label: "Bekerja" },
      { value: "2", label: "Belum bekerja" }
    ]);
  });

  it("parses multi choice options with explicit answer fields", () => {
    expect(parseMultiChoiceOptions("f401|1|Melalui iklan")).toEqual([
      { field: "f401", value: "1", label: "Melalui iklan" }
    ]);
  });

  it("normalizes conditional logic and matrix metadata", () => {
    const payload = normalizeQuestionPayload({
      questionnaire_version: "launch-v1",
      code: "kompetensi",
      section_id: "kompetensi",
      section_title: "Kompetensi",
      section_order: 4,
      order_index: 1,
      question_text: "Nilai kompetensi",
      question_type: "matrix_pair",
      is_required: true,
      is_active: true,
      options_text: "1|Rendah\n2|Tinggi",
      matrix_rows_text: "Etika|f1761|f1762",
      required_when_field: "f8",
      required_when_values: "1,3",
      matrix_left_label: "A",
      matrix_right_label: "B"
    });

    expect(payload.required_when).toEqual({ field: "f8", values: ["1", "3"] });
    expect(payload.section_order).toBe(4);
    expect(payload.metadata).toEqual({ leftLabel: "A", rightLabel: "B" });
    expect(payload.options).toEqual({
      leftLabel: "A",
      rightLabel: "B",
      scale: [{ value: "1", label: "Rendah" }, { value: "2", label: "Tinggi" }],
      rows: [{ label: "Etika", leftField: "f1761", rightField: "f1762" }]
    });
  });

  it("rejects choice questions without options", () => {
    expect(validateQuestionPayload({
      questionnaire_version: "launch-v1",
      code: "f8",
      section_id: "status",
      section_title: "Status",
      section_order: 1,
      order_index: 1,
      question_text: "Status saat ini",
      question_type: "single_choice",
      is_required: true,
      is_active: true,
      options_text: ""
    })).toBe("Pilihan Tunggal membutuhkan opsi");
  });

  it("ignores incomplete conditional rules", () => {
    expect(parseRequiredWhen("f8", "")).toBeNull();
  });
});
