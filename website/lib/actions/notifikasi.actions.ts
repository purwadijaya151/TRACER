"use server";

import {
  actionData,
  actionError,
  getRange,
  isMissingFunctionError,
  isMissingRelationError,
  requireAdmin
} from "@/lib/actions/_utils";
import { notificationSchema } from "@/lib/validation";
import type { NotificationBroadcast, NotificationFilters, PaginatedResult } from "@/types";

type AdminContext = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;

type BroadcastPayload = {
  title: string;
  body: string;
  target: "all" | "prodi" | "tahun" | "belum_mengisi";
  prodi?: string[];
  tahunMulai?: number;
  tahunAkhir?: number;
};

export async function getRecipientCount(input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<number>(auth.error);

  const parsed = notificationSchema.safeParse(input);
  if (!parsed.success) return actionError<number>(parsed.error.issues[0]?.message ?? "Target notifikasi tidak valid");

  const payload = parsed.data as BroadcastPayload;
  const { data, error } = await auth.adminClient.rpc("admin_count_notification_recipients", {
    p_target_type: payload.target,
    p_prodi: payload.prodi ?? null,
    p_tahun_mulai: payload.tahunMulai ?? null,
    p_tahun_akhir: payload.tahunAkhir ?? null
  });

  if (error) {
    if (isMissingFunctionError(error)) return countRecipientsFromBaseTables(auth, payload);
    return actionError<number>("Gagal menghitung penerima");
  }
  return actionData(Number(data ?? 0));
}

export async function getNotifications(filters: NotificationFilters = {}, page = 1, pageSize = 10) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<PaginatedResult<NotificationBroadcast>>(auth.error);

  const { from, to } = getRange(page, pageSize);
  let query = auth.adminClient
    .from("notification_broadcasts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.search) {
    const search = `%${filters.search}%`;
    query = query.or(`title.ilike.${search},body.ilike.${search},target_label.ilike.${search}`);
  }

  const { data, error, count } = await query;
  if (error) {
    if (isMissingRelationError(error)) {
      return actionData({
        rows: [],
        total: 0,
        page,
        pageSize
      });
    }
    return actionError<PaginatedResult<NotificationBroadcast>>();
  }

  return actionData({
    rows: (data ?? []) as NotificationBroadcast[],
    total: count ?? 0,
    page,
    pageSize
  });
}

export async function getNotificationStats() {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<{ total: number; read: number; unread: number }>(auth.error);

  const [total, read, unread] = await Promise.all([
    auth.adminClient.from("notifications").select("id", { count: "exact", head: true }),
    auth.adminClient.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", true),
    auth.adminClient.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false)
  ]);

  if (total.error || read.error || unread.error) {
    if ([total.error, read.error, unread.error].some(isMissingRelationError)) {
      return actionData({ total: 0, read: 0, unread: 0 });
    }
    return actionError<{ total: number; read: number; unread: number }>();
  }

  return actionData({
    total: total.count ?? 0,
    read: read.count ?? 0,
    unread: unread.count ?? 0
  });
}

export async function broadcastNotifikasi(input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<{ sent: number }>(auth.error);

  const parsed = notificationSchema.safeParse(input);
  if (!parsed.success) return actionError<{ sent: number }>(parsed.error.issues[0]?.message ?? "Data notifikasi tidak valid");

  const payload = parsed.data as BroadcastPayload;

  const { data, error } = await auth.adminClient.rpc("admin_broadcast_notifications", {
    p_title: payload.title,
    p_body: payload.body,
    p_target_type: payload.target,
    p_prodi: payload.prodi ?? null,
    p_tahun_mulai: payload.tahunMulai ?? null,
    p_tahun_akhir: payload.tahunAkhir ?? null,
    p_created_by: auth.user.id
  });

  if (error) {
    if (error.message.includes("rate_limit")) {
      return actionError<{ sent: number }>("Broadcast dibatasi maksimal 1 kali per menit");
    }
    if (error.message.includes("no_recipients")) {
      return actionError<{ sent: number }>("Tidak ada alumni yang cocok dengan target");
    }
    if (error.message.includes("empty_prodi_target")) {
      return actionError<{ sent: number }>("Pilih minimal satu prodi");
    }
    if (isMissingFunctionError(error)) {
      return actionError<{ sent: number }>("Fitur broadcast belum tersedia. Jalankan migrasi database notifikasi terlebih dahulu.");
    }
    return actionError<{ sent: number }>("Gagal mengirim notifikasi");
  }

  const row = Array.isArray(data) ? data[0] : data;
  return actionData({ sent: Number(row?.sent ?? 0) });
}

export async function deleteNotifikasi(id: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<{ deleted: number }>(auth.error);

  const { data, error } = await auth.adminClient.rpc("admin_delete_notification_broadcast", {
    p_broadcast_id: id
  });
  if (error) {
    if (isMissingFunctionError(error)) return actionError<{ deleted: number }>("Fitur hapus broadcast belum tersedia");
    return actionError<{ deleted: number }>("Gagal menghapus notifikasi");
  }

  return actionData({ deleted: Number(data ?? 0) });
}

async function countRecipientsFromBaseTables(auth: AdminContext, payload: BroadcastPayload) {
  let query = auth.adminClient
    .from("alumni")
    .select("id", { count: "exact", head: true })
    .eq("is_admin", false);

  if (payload.target === "prodi") {
    if (!payload.prodi?.length) return actionError<number>("Pilih minimal satu prodi");
    query = query.in("prodi", payload.prodi);
  }

  if (payload.target === "tahun") {
    if (payload.tahunMulai) query = query.gte("tahun_lulus", payload.tahunMulai);
    if (payload.tahunAkhir) query = query.lte("tahun_lulus", payload.tahunAkhir);
  }

  if (payload.target === "belum_mengisi") {
    const { data: submitted } = await auth.adminClient
      .from("tracer_study")
      .select("alumni_id")
      .eq("is_submitted", true)
      .limit(5000);
    const submittedIds = (submitted ?? []).map((row) => row.alumni_id).filter(Boolean);
    if (submittedIds.length > 0) query = query.not("id", "in", `(${submittedIds.join(",")})`);
  }

  const { count, error } = await query;
  if (error) return actionError<number>("Gagal menghitung penerima");
  return actionData(count ?? 0);
}
