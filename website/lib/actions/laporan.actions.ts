"use server";

import { actionData, actionError, reportActionError, requireAdmin } from "@/lib/actions/_utils";
import { reportFilterSchema } from "@/lib/validation";
import type { Alumni, ReportData, ReportType, TracerStudy } from "@/types";

const REPORT_BATCH_SIZE = 1000;

type ReportQueryResult<T> = {
  data: T[] | null;
  error: { code?: string; message?: string; details?: string; hint?: string } | null;
};

function submissionYearRange(year: number) {
  return {
    start: `${year}-01-01`,
    end: `${year + 1}-01-01`
  };
}

async function getAllReportRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<ReportQueryResult<T>>
) {
  const rows: T[] = [];

  for (let from = 0; ; from += REPORT_BATCH_SIZE) {
    const { data, error } = await buildQuery(from, from + REPORT_BATCH_SIZE - 1);
    if (error) return { ok: false as const, error };

    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < REPORT_BATCH_SIZE) return { ok: true as const, rows };
  }
}

export async function getReportData(reportType: ReportType, filters: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<ReportData>(auth.error);

  const parsed = reportFilterSchema.safeParse(filters);
  if (!parsed.success) return actionError<ReportData>("Filter laporan tidak valid");

  const values = parsed.data;

  if (reportType === "alumni") {
    const result = await getAllReportRows<Alumni & { tracer_submitted?: boolean }>((from, to) => {
      let query = auth.adminClient
        .from("admin_alumni_with_status")
        .select("*")
        .eq("is_admin", false)
        .order("tahun_lulus", { ascending: false })
        .order("nama_lengkap", { ascending: true })
        .range(from, to);

      if (values.prodi?.length) query = query.in("prodi", values.prodi);
      if (values.tahunMulai) query = query.gte("tahun_lulus", values.tahunMulai);
      if (values.tahunAkhir) query = query.lte("tahun_lulus", values.tahunAkhir);
      return query;
    });

    if (!result.ok) {
      reportActionError("laporan.getReportData.alumni", result.error, { reportType });
      return actionError<ReportData>("Gagal mengambil data alumni");
    }

    const rows = result.rows.map((row) => {
      const { tracer_submitted: tracerSubmitted, ...alumni } = row;
      return {
        ...alumni,
        tracer_study: tracerSubmitted ? [{ is_submitted: true } as TracerStudy] : []
      } as Alumni;
    });

    return actionData<ReportData>({ type: "alumni", rows });
  }

  const result = await getAllReportRows<TracerStudy>((from, to) => {
    let query = auth.adminClient
      .from("tracer_study")
      .select("*, alumni!inner(nim,nama_lengkap,prodi,tahun_lulus,ipk,email,no_hp,is_admin)")
      .eq("is_submitted", true)
      .eq("alumni.is_admin", false)
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    if (values.prodi?.length) query = query.in("alumni.prodi", values.prodi);
    if (values.tahunMulai) query = query.gte("alumni.tahun_lulus", values.tahunMulai);
    if (values.tahunAkhir) query = query.lte("alumni.tahun_lulus", values.tahunAkhir);
    if (values.status_kerja && values.status_kerja !== "all") query = query.eq("status_kerja", values.status_kerja);
    if (values.tahunPengisian) {
      const range = submissionYearRange(values.tahunPengisian);
      query = query.gte("submitted_at", range.start).lt("submitted_at", range.end);
    }
    return query;
  });

  if (!result.ok) {
    reportActionError("laporan.getReportData.tracer", result.error, { reportType });
    return actionError<ReportData>("Gagal mengambil data laporan");
  }

  return actionData<ReportData>({ type: reportType, rows: result.rows });
}

export async function getReportPreviewCount(reportType: ReportType, filters: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<number>(auth.error);

  const parsed = reportFilterSchema.safeParse(filters);
  if (!parsed.success) return actionError<number>("Filter laporan tidak valid");

  const values = parsed.data;
  if (reportType === "alumni") {
    let query = auth.adminClient
      .from("admin_alumni_with_status")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", false);
    if (values.prodi?.length) query = query.in("prodi", values.prodi);
    if (values.tahunMulai) query = query.gte("tahun_lulus", values.tahunMulai);
    if (values.tahunAkhir) query = query.lte("tahun_lulus", values.tahunAkhir);
    const { count, error } = await query;
    if (error) {
      reportActionError("laporan.getReportPreviewCount.alumni", error, { reportType });
      return actionError<number>("Gagal menghitung data laporan");
    }
    return actionData(count ?? 0);
  }

  let query = auth.adminClient
    .from("tracer_study")
    .select("id, alumni!inner(prodi,tahun_lulus,is_admin)", { count: "exact", head: true })
    .eq("is_submitted", true)
    .eq("alumni.is_admin", false);
  if (values.prodi?.length) query = query.in("alumni.prodi", values.prodi);
  if (values.tahunMulai) query = query.gte("alumni.tahun_lulus", values.tahunMulai);
  if (values.tahunAkhir) query = query.lte("alumni.tahun_lulus", values.tahunAkhir);
  if (values.status_kerja && values.status_kerja !== "all") query = query.eq("status_kerja", values.status_kerja);
  if (values.tahunPengisian) {
    const range = submissionYearRange(values.tahunPengisian);
    query = query.gte("submitted_at", range.start).lt("submitted_at", range.end);
  }
  const { count, error } = await query;
  if (error) {
    reportActionError("laporan.getReportPreviewCount.tracer", error, { reportType });
    return actionError<number>("Gagal menghitung data laporan");
  }
  return actionData(count ?? 0);
}
