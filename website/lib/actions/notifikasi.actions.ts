"use server";

import {
  actionData,
  actionError,
  getRange,
  isMissingFunctionError,
  isMissingRelationError,
  reportActionError,
  requireAdmin
} from "@/lib/actions/_utils";
import {
  AdminNotificationServiceError,
  broadcastNotifications,
  countNotificationRecipients,
  type NotificationBroadcastPayload,
  type NotificationTargetPayload
} from "@/lib/notifications/admin-notification-service";
import { buildIlikeOrFilter } from "@/lib/postgrest";
import { notificationSchema, notificationTargetSchema } from "@/lib/validation";
import type { NotificationBroadcast, NotificationFilters, PaginatedResult } from "@/types";

export async function getRecipientCount(input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<number>(auth.error);

  const parsed = notificationTargetSchema.safeParse(input);
  if (!parsed.success) return actionError<number>(parsed.error.issues[0]?.message ?? "Target notifikasi tidak valid");

  const payload = parsed.data as NotificationTargetPayload;

  try {
    return actionData(await countNotificationRecipients(auth.adminClient, payload));
  } catch (error) {
    if (error instanceof AdminNotificationServiceError && error.code === "empty_prodi_target") {
      return actionError<number>("Pilih minimal satu prodi");
    }
    reportActionError("notifikasi.getRecipientCount", error, { target: payload.target });
    return actionError<number>("Gagal menghitung penerima");
  }
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
    const searchFilter = buildIlikeOrFilter(["title", "body", "target_label"], filters.search);
    if (searchFilter) query = query.or(searchFilter);
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
    reportActionError("notifikasi.getNotifications", error, { page, pageSize });
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
    reportActionError("notifikasi.getNotificationStats", total.error ?? read.error ?? unread.error);
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

  const payload = parsed.data as NotificationBroadcastPayload;

  try {
    return actionData(await broadcastNotifications(auth.adminClient, payload, { createdBy: auth.user.id }));
  } catch (error) {
    if (error instanceof AdminNotificationServiceError) {
      if (error.code === "rate_limit") {
        return actionError<{ sent: number }>("Broadcast dibatasi maksimal 1 kali per menit");
      }
      if (error.code === "no_recipients") {
        return actionError<{ sent: number }>("Tidak ada alumni yang cocok dengan target");
      }
      if (error.code === "empty_prodi_target") {
        return actionError<{ sent: number }>("Pilih minimal satu prodi");
      }
      if (error.code === "feature_unavailable") {
        return actionError<{ sent: number }>("Fitur broadcast belum tersedia. Jalankan migrasi database notifikasi terlebih dahulu.");
      }
    }
    reportActionError("notifikasi.broadcastNotifikasi", error, { target: payload.target });
    return actionError<{ sent: number }>("Gagal mengirim notifikasi");
  }
}

export async function deleteNotifikasi(id: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<{ deleted: number }>(auth.error);

  const { data, error } = await auth.adminClient.rpc("admin_delete_notification_broadcast", {
    p_broadcast_id: id
  });
  if (error) {
    if (isMissingFunctionError(error)) return actionError<{ deleted: number }>("Fitur hapus broadcast belum tersedia");
    reportActionError("notifikasi.deleteNotifikasi", error, { id });
    return actionError<{ deleted: number }>("Gagal menghapus notifikasi");
  }

  return actionData({ deleted: Number(data ?? 0) });
}
