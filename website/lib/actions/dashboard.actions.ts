"use server";

import { actionData, actionError, requireAdmin } from "@/lib/actions/_utils";
import {
  buildResponseByProdi,
  buildStatusKerjaDistribution,
  type DashboardAlumniRow,
  type DashboardSubmissionAggregateRow
} from "@/lib/dashboard-metrics";
import { normalizeTracerStudyRows, type TracerStudyRowWithJoinedAlumni } from "@/lib/tracer-study-row";
import type { DashboardStats, Prodi, StatusKerja } from "@/types";

export async function getDashboardStats() {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<DashboardStats>(auth.error);

  const admin = auth.adminClient;

  try {
    const [
      alumniRows,
      submissionRows,
      notificationCount,
      recentSubmissions
    ] = await Promise.all([
      admin.from("alumni").select("prodi").eq("is_admin", false),
      admin
        .from("tracer_study")
        .select("status_kerja, alumni!inner(prodi,is_admin)")
        .eq("is_submitted", true)
        .eq("alumni.is_admin", false),
      admin.from("notifications").select("id", { count: "exact", head: true }),
      admin
        .from("tracer_study")
        .select("id,alumni_id,status_kerja,is_submitted,submitted_at,created_at,updated_at,alumni!inner(nim,nama_lengkap,prodi,tahun_lulus,ipk,email,no_hp,is_admin)")
        .eq("is_submitted", true)
        .eq("alumni.is_admin", false)
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .limit(5)
    ]);

    if (alumniRows.error || submissionRows.error || notificationCount.error || recentSubmissions.error) {
      return actionError<DashboardStats>();
    }

    const totalAlumni = (alumniRows.data ?? []).length;
    const submittedRows = (submissionRows.data ?? []) as DashboardSubmissionAggregateRow[];
    const sudahMengisi = submittedRows.length;
    const responseByProdi = buildResponseByProdi((alumniRows.data ?? []) as DashboardAlumniRow[], submittedRows);
    const statusKerjaDistribution = buildStatusKerjaDistribution(submittedRows);
    const recentSubmissionRows = normalizeTracerStudyRows((recentSubmissions.data ?? []) as TracerStudyRowWithJoinedAlumni[]);

    const stats: DashboardStats = {
      total_alumni: totalAlumni,
      sudah_mengisi: sudahMengisi,
      belum_mengisi: Math.max(totalAlumni - sudahMengisi, 0),
      notif_terkirim: notificationCount.count ?? 0,
      response_by_prodi: responseByProdi.map((item) => ({ ...item, prodi: item.prodi as Prodi })),
      status_kerja_distribution: statusKerjaDistribution.map((item) => ({ ...item, status: item.status as StatusKerja })),
      recent_submissions: recentSubmissionRows
    };

    return actionData(stats);
  } catch {
    return actionError<DashboardStats>();
  }
}
