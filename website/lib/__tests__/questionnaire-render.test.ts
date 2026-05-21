import { describe, expect, it } from "vitest";
import { buildQuestionnaireSections } from "@/lib/questionnaire-render";
import type { QuestionnaireQuestion } from "@/types";

describe("buildQuestionnaireSections", () => {
  it("groups active questions by section and preserves display order", () => {
    const rows: QuestionnaireQuestion[] = [
      {
        id: "2",
        questionnaire_version: "launch-v1",
        code: "f2",
        section_id: "profile",
        section_title: "Profil",
        section_order: 1,
        order_index: 2,
        question_text: "Nama lengkap",
        description: null,
        question_type: "textarea",
        is_required: true,
        is_active: true,
        options: [],
        required_when: null,
        metadata: null,
        created_at: "",
        updated_at: ""
      },
      {
        id: "1",
        questionnaire_version: "launch-v1",
        code: "f1",
        section_id: "profile",
        section_title: "Profil",
        section_order: 1,
        order_index: 1,
        question_text: "NPM",
        description: null,
        question_type: "text",
        is_required: true,
        is_active: true,
        options: [],
        required_when: null,
        metadata: null,
        created_at: "",
        updated_at: ""
      },
      {
        id: "3",
        questionnaire_version: "launch-v1",
        code: "f3",
        section_id: "status",
        section_title: "Status",
        section_order: 2,
        order_index: 1,
        question_text: "Status saat ini",
        description: null,
        question_type: "single_choice",
        is_required: true,
        is_active: true,
        options: [{ value: "1", label: "Bekerja" }],
        required_when: null,
        metadata: null,
        created_at: "",
        updated_at: ""
      },
      {
        id: "4",
        questionnaire_version: "launch-v1",
        code: "f4",
        section_id: "hidden",
        section_title: "Hidden",
        section_order: 3,
        order_index: 1,
        question_text: "Jangan tampil",
        description: null,
        question_type: "text",
        is_required: false,
        is_active: false,
        options: [],
        required_when: null,
        metadata: null,
        created_at: "",
        updated_at: ""
      }
    ];

    const sections = buildQuestionnaireSections(rows);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.title).toBe("Profil");
    expect(sections[0]?.questions.map((question) => question.id)).toEqual(["f1", "f2"]);
    expect(sections[0]?.questions[1]?.type).toBe("text");
    expect(sections[1]?.title).toBe("Status");
    expect(sections[1]?.questions[0]).toMatchObject({
      id: "f3",
      type: "single_choice",
      label: "Status saat ini"
    });
  });
});
