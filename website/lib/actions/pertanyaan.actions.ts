"use server";

import {
  actionData,
  actionError,
  getRange,
  isMissingRelationError,
  requireAdmin
} from "@/lib/actions/_utils";
import { buildIlikeOrFilter } from "@/lib/postgrest";
import { normalizeQuestionPayload, validateQuestionPayload, type QuestionFormValues } from "@/lib/questionnaire";
import { questionnaireQuestionSchema } from "@/lib/validation";
import type { PaginatedResult, QuestionnaireFilters, QuestionnaireQuestion } from "@/types";

export async function getQuestionnaireQuestions(filters: QuestionnaireFilters = {}, page = 1, pageSize = 20) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<PaginatedResult<QuestionnaireQuestion>>(auth.error);

  const { from, to } = getRange(page, pageSize);
  let query = auth.adminClient
    .from("questionnaire_questions")
    .select("*", { count: "exact" })
    .order("questionnaire_version", { ascending: false })
    .order("section_order", { ascending: true })
    .order("order_index", { ascending: true })
    .order("code", { ascending: true })
    .range(from, to);

  if (filters.version) query = query.eq("questionnaire_version", filters.version);
  if (filters.section && filters.section !== "all") query = query.eq("section_id", filters.section);
  if (filters.type && filters.type !== "all") query = query.eq("question_type", filters.type);
  if (filters.status === "active") query = query.eq("is_active", true);
  if (filters.status === "inactive") query = query.eq("is_active", false);
  if (filters.search) {
    const searchFilter = buildIlikeOrFilter(["code", "section_title", "question_text"], filters.search);
    if (searchFilter) query = query.or(searchFilter);
  }

  const { data, error, count } = await query;
  if (error) {
    if (isMissingRelationError(error)) {
      return actionData({ rows: [], total: 0, page, pageSize });
    }
    return actionError<PaginatedResult<QuestionnaireQuestion>>("Gagal memuat pertanyaan");
  }

  return actionData({
    rows: (data ?? []) as QuestionnaireQuestion[],
    total: count ?? 0,
    page,
    pageSize
  });
}

export async function createQuestionnaireQuestion(input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<QuestionnaireQuestion>(auth.error);

  const parsed = questionnaireQuestionSchema.safeParse(input);
  if (!parsed.success) return actionError<QuestionnaireQuestion>(parsed.error.issues[0]?.message ?? "Pertanyaan tidak valid");

  const values = parsed.data as QuestionFormValues;
  const optionError = validateQuestionPayload(values);
  if (optionError) return actionError<QuestionnaireQuestion>(optionError);

  const payload = normalizeQuestionPayload(values);
  const { data, error } = await auth.adminClient
    .from("questionnaire_questions")
    .insert(payload)
    .select()
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      return actionError<QuestionnaireQuestion>("Tabel pertanyaan belum tersedia. Jalankan migrasi database terlebih dahulu.");
    }
    if (error.code === "23505") return actionError<QuestionnaireQuestion>("Kode pertanyaan sudah ada pada versi ini");
    return actionError<QuestionnaireQuestion>("Gagal menyimpan pertanyaan");
  }

  return actionData(data as QuestionnaireQuestion);
}

export async function updateQuestionnaireQuestion(id: string, input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<QuestionnaireQuestion>(auth.error);

  const parsed = questionnaireQuestionSchema.safeParse(input);
  if (!parsed.success) return actionError<QuestionnaireQuestion>(parsed.error.issues[0]?.message ?? "Pertanyaan tidak valid");

  const values = parsed.data as QuestionFormValues;
  const optionError = validateQuestionPayload(values);
  if (optionError) return actionError<QuestionnaireQuestion>(optionError);

  const payload = normalizeQuestionPayload(values);
  const { data, error } = await auth.adminClient
    .from("questionnaire_questions")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return actionError<QuestionnaireQuestion>("Kode pertanyaan sudah ada pada versi ini");
    return actionError<QuestionnaireQuestion>("Gagal memperbarui pertanyaan");
  }

  return actionData(data as QuestionnaireQuestion);
}

export async function deleteQuestionnaireQuestion(id: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<{ deleted: number }>(auth.error);

  const { error } = await auth.adminClient
    .from("questionnaire_questions")
    .delete()
    .eq("id", id);

  if (error) return actionError<{ deleted: number }>("Gagal menghapus pertanyaan");
  return actionData({ deleted: 1 });
}
