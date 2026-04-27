"use server";

import { PRODI_OPTIONS, STATUS_KERJA_OPTIONS } from "@/lib/constants";
import { actionData, actionError, requireAdmin } from "@/lib/actions/_utils";
import type { DashboardStats, Prodi, StatusKerja, TracerStudy } from "@/types";

export async function getDashboardStats() {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<DashboardStats>(auth.error);

  const admin = auth.adminClient;

  try {
    const [
      alumniCount,
      submittedCount,
      notificationCount,
      recentSubmissions,
      ...aggregateCounts
    ] = await Promise.all([
      admin.from("alumni").select("id", { count: "exact", head: true }).eq("is_admin", false),
      admin
        .from("tracer_study")
        .select("id, alumni!inner(is_admin)", { count: "exact", head: true })
        .eq("is_submitted", true)
        .eq("alumni.is_admin", false),
      admin.from("notifications").select("id", { count: "exact", head: true }),
      admin
        .from("tracer_study")
        .select("*, alumni!inner(nim,nama_lengkap,prodi,tahun_lulus,ipk,email,no_hp,is_admin)")
        .eq("is_submitted", true)
        .eq("alumni.is_admin", false)
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .limit(5),
      ...PRODI_OPTIONS.map((prodi) =>
        admin.from("alumni").select("id", { count: "exact", head: true }).eq("is_admin", false).eq("prodi", prodi)
      ),
      ...PRODI_OPTIONS.map((prodi) =>
        admin
          .from("tracer_study")
          .select("id, alumni!inner(prodi,is_admin)", { count: "exact", head: true })
          .eq("is_submitted", true)
          .eq("alumni.is_admin", false)
          .eq("alumni.prodi", prodi)
      ),
      ...STATUS_KERJA_OPTIONS.map((status) =>
        admin
          .from("tracer_study")
          .select("id, alumni!inner(is_admin)", { count: "exact", head: true })
          .eq("is_submitted", true)
          .eq("alumni.is_admin", false)
          .eq("status_kerja", status)
      )
    ]);

    const prodiTotals = aggregateCounts.slice(0, PRODI_OPTIONS.length);
    const prodiSubmitted = aggregateCounts.slice(PRODI_OPTIONS.length, PRODI_OPTIONS.length * 2);
    const statusCounts = aggregateCounts.slice(PRODI_OPTIONS.length * 2);

    if (
      alumniCount.error ||
      submittedCount.error ||
      notificationCount.error ||
      recentSubmissions.error ||
      aggregateCounts.some((result) => result.error)
    ) {
      return actionError<DashboardStats>();
    }

    const totalAlumni = alumniCount.count ?? 0;
    const sudahMengisi = submittedCount.count ?? 0;

    const stats: DashboardStats = {
      total_alumni: totalAlumni,
      sudah_mengisi: sudahMengisi,
      belum_mengisi: Math.max(totalAlumni - sudahMengisi, 0),
      notif_terkirim: notificationCount.count ?? 0,
      response_by_prodi: PRODI_OPTIONS.map((prodi, index) => ({
        prodi: prodi as Prodi,
        total: prodiTotals[index]?.count ?? 0,
        mengisi: prodiSubmitted[index]?.count ?? 0
      })),
      status_kerja_distribution: STATUS_KERJA_OPTIONS.map((status, index) => ({
        status: status as StatusKerja,
        count: statusCounts[index]?.count ?? 0
      })),
      recent_submissions: (recentSubmissions.data ?? []) as TracerStudy[]
    };

    return actionData(stats);
  } catch {
    return actionError<DashboardStats>();
  }
}
