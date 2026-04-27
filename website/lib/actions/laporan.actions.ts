"use server";

import { actionData, actionError, requireAdmin } from "@/lib/actions/_utils";
import { reportFilterSchema } from "@/lib/validation";
import type { Alumni, ReportData, ReportType, TracerStudy } from "@/types";

function submissionYearRange(year: number) {
  return {
    start: `${year}-01-01`,
    end: `${year + 1}-01-01`
  };
}

export async function getReportData(reportType: ReportType, filters: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<ReportData>(auth.error);

  const parsed = reportFilterSchema.safeParse(filters);
  if (!parsed.success) return actionError<ReportData>("Filter laporan tidak valid");

  const values = parsed.data;

  if (reportType === "alumni") {
    let query = auth.adminClient
      .from("admin_alumni_with_status")
      .select("*")
      .eq("is_admin", false)
      .order("tahun_lulus", { ascending: false })
      .order("nama_lengkap", { ascending: true })
      .limit(5000);

    if (values.prodi?.length) query = query.in("prodi", values.prodi);
    if (values.tahunMulai) query = query.gte("tahun_lulus", values.tahunMulai);
    if (values.tahunAkhir) query = query.lte("tahun_lulus", values.tahunAkhir);

    const { data, error } = await query;
    if (error) return actionError<ReportData>("Gagal mengambil data alumni");

    const rows = ((data ?? []) as Array<Alumni & { tracer_submitted?: boolean }>).map((row) => {
      const { tracer_submitted: tracerSubmitted, ...alumni } = row;
      return {
        ...alumni,
        tracer_study: tracerSubmitted ? [{ is_submitted: true } as TracerStudy] : []
      } as Alumni;
    });

    return actionData<ReportData>({ type: "alumni", rows });
  }

  let query = auth.adminClient
    .from("tracer_study")
    .select("*, alumni!inner(nim,nama_lengkap,prodi,tahun_lulus,ipk,email,no_hp,is_admin)")
    .eq("is_submitted", true)
    .eq("alumni.is_admin", false)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(5000);

  if (values.prodi?.length) query = query.in("alumni.prodi", values.prodi);
  if (values.tahunMulai) query = query.gte("alumni.tahun_lulus", values.tahunMulai);
  if (values.tahunAkhir) query = query.lte("alumni.tahun_lulus", values.tahunAkhir);
  if (values.status_kerja && values.status_kerja !== "all") query = query.eq("status_kerja", values.status_kerja);
  if (values.tahunPengisian) {
    const range = submissionYearRange(values.tahunPengisian);
    query = query.gte("submitted_at", range.start).lt("submitted_at", range.end);
  }

  const { data, error } = await query;
  if (error) return actionError<ReportData>("Gagal mengambil data laporan");

  return actionData<ReportData>({ type: reportType, rows: (data ?? []) as TracerStudy[] });
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
    if (error) return actionError<number>("Gagal menghitung data laporan");
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
  if (error) return actionError<number>("Gagal menghitung data laporan");
  return actionData(count ?? 0);
}
