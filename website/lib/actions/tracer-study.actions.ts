"use server";

import { actionData, actionError, getRange, reportActionError, requireAdmin } from "@/lib/actions/_utils";
import { reportFilterSchema, tracerStudyFilterSchema } from "@/lib/validation";
import type { PaginatedResult, TracerStudy, TracerStudyFilters } from "@/types";

type AdminContext = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;
const TRACER_EXPORT_BATCH_SIZE = 1000;

type TracerSummaryRow = {
  kesesuaian_bidang: number | null;
  waktu_tunggu: string | null;
  rentang_gaji: string | null;
  alumni: { ipk: number | null } | Array<{ ipk: number | null }> | null;
};
type TracerQueryResult<T> = {
  data: T[] | null;
  error: { code?: string; message?: string; details?: string; hint?: string } | null;
};

function submissionYearRange(year: number) {
  return {
    start: `${year}-01-01`,
    end: `${year + 1}-01-01`
  };
}

export async function getTracerStudies(filters: TracerStudyFilters = {}, page = 1, pageSize = 10) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<PaginatedResult<TracerStudy>>(auth.error);

  const parsed = tracerStudyFilterSchema.safeParse(filters);
  if (!parsed.success) return actionError<PaginatedResult<TracerStudy>>("Filter tracer study tidak valid");

  const { from, to } = getRange(page, pageSize);
  let query = auth.adminClient
    .from("tracer_study")
    .select("*, alumni!inner(nim,nama_lengkap,prodi,tahun_lulus,ipk,email,no_hp,is_admin)", { count: "exact" })
    .eq("is_submitted", true)
    .eq("alumni.is_admin", false)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (filters.prodi && filters.prodi !== "all") query = query.eq("alumni.prodi", filters.prodi);
  if (filters.tahun_lulus && filters.tahun_lulus !== "all") query = query.eq("alumni.tahun_lulus", filters.tahun_lulus);
  if (filters.status_kerja && filters.status_kerja !== "all") query = query.eq("status_kerja", filters.status_kerja);
  if (filters.tahun_pengisian && filters.tahun_pengisian !== "all") {
    const range = submissionYearRange(Number(filters.tahun_pengisian));
    query = query.gte("submitted_at", range.start).lt("submitted_at", range.end);
  }

  const { data, error, count } = await query;
  if (error) {
    reportActionError("tracerStudy.getTracerStudies", error, { page, pageSize });
    return actionError<PaginatedResult<TracerStudy>>();
  }

  return actionData({
    rows: (data ?? []) as TracerStudy[],
    total: count ?? 0,
    page,
    pageSize
  });
}

export async function getTracerSummary(filters: TracerStudyFilters = {}) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return actionError<{
      avg_ipk: number;
      avg_kesesuaian: number;
      avg_waktu_tunggu: string;
      modal_gaji: string;
    }>(auth.error);
  }

  const parsed = tracerStudyFilterSchema.safeParse(filters);
  if (!parsed.success) {
    return actionError<{
      avg_ipk: number;
      avg_kesesuaian: number;
      avg_waktu_tunggu: string;
      modal_gaji: string;
    }>("Filter tracer study tidak valid");
  }

  const rowsResult = await getAllTracerSummaryRows(auth, parsed.data as TracerStudyFilters);
  if (!rowsResult.ok) {
    reportActionError("tracerStudy.getTracerSummary", rowsResult.error);
    return actionError<{
      avg_ipk: number;
      avg_kesesuaian: number;
      avg_waktu_tunggu: string;
      modal_gaji: string;
    }>("Gagal memuat ringkasan tracer study");
  }

  const rows = rowsResult.rows;

  const avg = (values: Array<number | null | undefined>) => {
    const valid = values.filter((value): value is number => typeof value === "number");
    if (valid.length === 0) return 0;
    return Number((valid.reduce((total, value) => total + value, 0) / valid.length).toFixed(2));
  };

  const mode = (values: Array<string | null | undefined>) => {
    const counts = new Map<string, number>();
    values.filter(Boolean).forEach((value) => counts.set(value as string, (counts.get(value as string) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  };

  return actionData({
    avg_ipk: avg(rows.map((row) => Array.isArray(row.alumni) ? row.alumni[0]?.ipk : row.alumni?.ipk)),
    avg_kesesuaian: avg(rows.map((row) => row.kesesuaian_bidang)),
    avg_waktu_tunggu: mode(rows.map((row) => row.waktu_tunggu)),
    modal_gaji: mode(rows.map((row) => row.rentang_gaji))
  });
}

async function getAllTracerSummaryRows(auth: AdminContext, filters: TracerStudyFilters) {
  const pageSize = 1000;
  const rows: TracerSummaryRow[] = [];

  for (let from = 0; ; from += pageSize) {
    let query = auth.adminClient
      .from("tracer_study")
      .select("kesesuaian_bidang,waktu_tunggu,rentang_gaji,submitted_at,alumni!inner(ipk,prodi,tahun_lulus,is_admin)")
      .eq("is_submitted", true)
      .eq("alumni.is_admin", false)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .range(from, from + pageSize - 1);

    if (filters.prodi && filters.prodi !== "all") query = query.eq("alumni.prodi", filters.prodi);
    if (filters.tahun_lulus && filters.tahun_lulus !== "all") query = query.eq("alumni.tahun_lulus", filters.tahun_lulus);
    if (filters.status_kerja && filters.status_kerja !== "all") query = query.eq("status_kerja", filters.status_kerja);
    if (filters.tahun_pengisian && filters.tahun_pengisian !== "all") {
      const range = submissionYearRange(Number(filters.tahun_pengisian));
      query = query.gte("submitted_at", range.start).lt("submitted_at", range.end);
    }

    const { data, error } = await query;
    if (error) return { ok: false as const, error };

    const batch = (data ?? []) as unknown as TracerSummaryRow[];
    rows.push(...batch);
    if (batch.length < pageSize) return { ok: true as const, rows };
  }
}

async function getAllTracerExportRows(
  buildQuery: (from: number, to: number) => PromiseLike<TracerQueryResult<TracerStudy>>
) {
  const rows: TracerStudy[] = [];

  for (let from = 0; ; from += TRACER_EXPORT_BATCH_SIZE) {
    const { data, error } = await buildQuery(from, from + TRACER_EXPORT_BATCH_SIZE - 1);
    if (error) return { ok: false as const, error };

    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < TRACER_EXPORT_BATCH_SIZE) return { ok: true as const, rows };
  }
}

export async function getTracerStudyExport(filters: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<TracerStudy[]>(auth.error);

  const parsed = reportFilterSchema.safeParse(filters);
  if (!parsed.success) return actionError<TracerStudy[]>("Filter laporan tidak valid");

  const data = parsed.data;
  const result = await getAllTracerExportRows((from, to) => {
    let query = auth.adminClient
      .from("tracer_study")
      .select("*, alumni!inner(nim,nama_lengkap,prodi,tahun_lulus,ipk,email,no_hp,is_admin)")
      .eq("is_submitted", true)
      .eq("alumni.is_admin", false)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    if (data.prodi?.length) query = query.in("alumni.prodi", data.prodi);
    if (data.tahunMulai) query = query.gte("alumni.tahun_lulus", data.tahunMulai);
    if (data.tahunAkhir) query = query.lte("alumni.tahun_lulus", data.tahunAkhir);
    if (data.status_kerja && data.status_kerja !== "all") query = query.eq("status_kerja", data.status_kerja);
    if (data.tahunPengisian) {
      const range = submissionYearRange(data.tahunPengisian);
      query = query.gte("submitted_at", range.start).lt("submitted_at", range.end);
    }
    return query;
  });

  if (!result.ok) {
    reportActionError("tracerStudy.getTracerStudyExport", result.error);
    return actionError<TracerStudy[]>("Gagal mengambil data laporan");
  }

  return actionData(result.rows);
}
