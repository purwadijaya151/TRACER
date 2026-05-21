import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingFunctionError, isMissingRelationError } from "@/lib/actions/_utils";
import type { PengaturanSistem } from "@/types";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_REMINDER_MESSAGE = "Mohon lengkapi data tracer study Anda melalui aplikasi TracerStudy FT UNIHAZ.";
const AUTO_REMINDER_TITLE = "Pengingat Tracer Study";
const QUERY_BATCH_SIZE = 1000;
const INSERT_BATCH_SIZE = 500;

type NotificationTarget = "all" | "prodi" | "tahun" | "belum_mengisi";

export type NotificationTargetPayload = {
  target: NotificationTarget;
  prodi?: string[];
  tahunMulai?: number;
  tahunAkhir?: number;
};

export type NotificationBroadcastPayload = NotificationTargetPayload & {
  title: string;
  body: string;
};

export type AutoReminderResult = {
  sent: number;
  skipped: boolean;
  reason?: "disabled" | "no_recipients";
};

export class AdminNotificationServiceError extends Error {
  constructor(
    public readonly code:
      | "rate_limit"
      | "no_recipients"
      | "empty_prodi_target"
      | "feature_unavailable",
    message: string = code
  ) {
    super(message);
    this.name = "AdminNotificationServiceError";
  }
}

type ServiceOptions = {
  createdBy?: string | null;
};

export async function countNotificationRecipients(
  adminClient: SupabaseClient,
  payload: NotificationTargetPayload
) {
  const { data, error } = await adminClient.rpc("admin_count_notification_recipients", {
    p_target_type: payload.target,
    p_prodi: payload.prodi ?? null,
    p_tahun_mulai: payload.tahunMulai ?? null,
    p_tahun_akhir: payload.tahunAkhir ?? null
  });

  if (!error) return Number(data ?? 0);
  if (!isMissingFunctionError(error)) throw error;
  return countRecipientsFromBaseTables(adminClient, payload);
}

export async function broadcastNotifications(
  adminClient: SupabaseClient,
  payload: NotificationBroadcastPayload,
  options: ServiceOptions = {}
) {
  const { data, error } = await adminClient.rpc("admin_broadcast_notifications", {
    p_title: payload.title,
    p_body: payload.body,
    p_target_type: payload.target,
    p_prodi: payload.prodi ?? null,
    p_tahun_mulai: payload.tahunMulai ?? null,
    p_tahun_akhir: payload.tahunAkhir ?? null,
    p_created_by: options.createdBy ?? null
  });

  if (!error) {
    const row = Array.isArray(data) ? data[0] : data;
    return { sent: Number(row?.sent ?? 0) };
  }

  const message = typeof error.message === "string" ? error.message : "";
  if (message.includes("rate_limit")) {
    throw new AdminNotificationServiceError("rate_limit");
  }
  if (message.includes("no_recipients")) {
    throw new AdminNotificationServiceError("no_recipients");
  }
  if (message.includes("empty_prodi_target")) {
    throw new AdminNotificationServiceError("empty_prodi_target");
  }
  if (!isMissingFunctionError(error)) {
    throw error;
  }

  return broadcastFromBaseTables(adminClient, payload, options);
}

export async function runAutoReminder(adminClient: SupabaseClient, options: ServiceOptions = {}): Promise<AutoReminderResult> {
  const settings = await getNotificationSettings(adminClient);
  if (!settings.auto_reminder) {
    return { sent: 0, skipped: true, reason: "disabled" };
  }

  try {
    const result = await broadcastNotifications(
      adminClient,
      {
        title: AUTO_REMINDER_TITLE,
        body: settings.pesan_pengingat,
        target: "belum_mengisi"
      },
      options
    );
    return { sent: result.sent, skipped: false };
  } catch (error) {
    if (error instanceof AdminNotificationServiceError && error.code === "no_recipients") {
      return { sent: 0, skipped: true, reason: "no_recipients" };
    }
    throw error;
  }
}

export async function getNotificationSettings(adminClient: SupabaseClient): Promise<PengaturanSistem> {
  const { data, error } = await adminClient
    .from("pengaturan_sistem")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      return buildDefaultSettings();
    }
    throw error;
  }

  return (data as PengaturanSistem | null) ?? buildDefaultSettings();
}

function buildDefaultSettings(): PengaturanSistem {
  return {
    id: SETTINGS_ID,
    tracer_study_open: true,
    periode_tahun_mulai: new Date().getFullYear() - 5,
    periode_tahun_akhir: new Date().getFullYear(),
    pesan_pengingat: DEFAULT_REMINDER_MESSAGE,
    auto_reminder: false
  };
}

async function countRecipientsFromBaseTables(
  adminClient: SupabaseClient,
  payload: NotificationTargetPayload
) {
  let query = adminClient
    .from("alumni")
    .select("id", { count: "exact", head: true })
    .eq("is_admin", false);

  if (payload.target === "prodi") {
    if (!payload.prodi?.length) throw new AdminNotificationServiceError("empty_prodi_target");
    query = query.in("prodi", payload.prodi);
  }

  if (payload.target === "tahun") {
    if (payload.tahunMulai) query = query.gte("tahun_lulus", payload.tahunMulai);
    if (payload.tahunAkhir) query = query.lte("tahun_lulus", payload.tahunAkhir);
  }

  if (payload.target === "belum_mengisi") {
    const [totalResult, submittedResult] = await Promise.all([
      query,
      adminClient
        .from("tracer_study")
        .select("alumni_id, alumni!inner(is_admin)", { count: "exact", head: true })
        .eq("is_submitted", true)
        .eq("alumni.is_admin", false)
    ]);

    if (totalResult.error || submittedResult.error) {
      throw totalResult.error ?? submittedResult.error;
    }

    return Math.max((totalResult.count ?? 0) - (submittedResult.count ?? 0), 0);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function broadcastFromBaseTables(
  adminClient: SupabaseClient,
  payload: NotificationBroadcastPayload,
  options: ServiceOptions = {}
) {
  if (payload.target === "prodi" && !payload.prodi?.length) {
    throw new AdminNotificationServiceError("empty_prodi_target");
  }

  await assertBroadcastNotRateLimited(adminClient);

  const recipientIds = await collectRecipientIds(adminClient, payload);
  if (recipientIds.length === 0) {
    throw new AdminNotificationServiceError("no_recipients");
  }

  const targetLabel = buildTargetLabel(payload);
  const { data: createdBroadcast, error: broadcastError } = await adminClient
    .from("notification_broadcasts")
    .insert({
      title: payload.title,
      body: payload.body,
      target_type: payload.target,
      target_label: targetLabel,
      total_recipients: recipientIds.length,
      read_count: 0,
      created_by: options.createdBy ?? null
    })
    .select("id")
    .single();

  if (broadcastError) {
    if (isMissingRelationError(broadcastError)) {
      throw new AdminNotificationServiceError("feature_unavailable");
    }
    throw broadcastError;
  }

  const broadcastId = createdBroadcast?.id as string;

  try {
    for (let index = 0; index < recipientIds.length; index += INSERT_BATCH_SIZE) {
      const batch = recipientIds.slice(index, index + INSERT_BATCH_SIZE).map((alumniId) => ({
        alumni_id: alumniId,
        title: payload.title,
        body: payload.body,
        type: "broadcast",
        target_type: payload.target,
        target_label: targetLabel,
        broadcast_id: broadcastId
      }));

      const { error } = await adminClient.from("notifications").insert(batch);
      if (error) {
        if (isMissingRelationError(error)) {
          throw new AdminNotificationServiceError("feature_unavailable");
        }
        throw error;
      }
    }
  } catch (error) {
    await rollbackFallbackBroadcast(adminClient, broadcastId);
    throw error;
  }

  return { sent: recipientIds.length };
}

async function assertBroadcastNotRateLimited(adminClient: SupabaseClient) {
  const { data, error } = await adminClient
    .from("notification_broadcasts")
    .select("created_at")
    .order("created_at", { ascending: false })
    .range(0, 0);

  if (error) {
    if (isMissingRelationError(error)) {
      throw new AdminNotificationServiceError("feature_unavailable");
    }
    throw error;
  }

  const latestCreatedAt = data?.[0]?.created_at;
  if (!latestCreatedAt) return;

  const latestAt = new Date(latestCreatedAt).getTime();
  if (Number.isNaN(latestAt)) return;
  if (Date.now() - latestAt < 60_000) {
    throw new AdminNotificationServiceError("rate_limit");
  }
}

async function collectRecipientIds(
  adminClient: SupabaseClient,
  payload: NotificationTargetPayload
) {
  const alumniIds = await fetchAllAlumniIds(adminClient, payload);
  if (payload.target !== "belum_mengisi") {
    return alumniIds;
  }

  const submittedIds = await fetchAllSubmittedTracerIds(adminClient);
  const submittedSet = new Set(submittedIds);
  return alumniIds.filter((id) => !submittedSet.has(id));
}

async function fetchAllAlumniIds(
  adminClient: SupabaseClient,
  payload: NotificationTargetPayload
) {
  const ids: string[] = [];

  for (let offset = 0; ; offset += QUERY_BATCH_SIZE) {
    let query = adminClient
      .from("alumni")
      .select("id")
      .eq("is_admin", false)
      .order("id", { ascending: true })
      .range(offset, offset + QUERY_BATCH_SIZE - 1);

    if (payload.target === "prodi") {
      query = query.in("prodi", payload.prodi ?? []);
    }

    if (payload.target === "tahun") {
      if (payload.tahunMulai) query = query.gte("tahun_lulus", payload.tahunMulai);
      if (payload.tahunAkhir) query = query.lte("tahun_lulus", payload.tahunAkhir);
    }

    const { data, error } = await query;
    if (error) {
      if (isMissingRelationError(error)) {
        throw new AdminNotificationServiceError("feature_unavailable");
      }
      throw error;
    }

    const rows = (data ?? []) as Array<{ id: string }>;
    ids.push(...rows.map((row) => row.id));

    if (rows.length < QUERY_BATCH_SIZE) break;
  }

  return ids;
}

async function fetchAllSubmittedTracerIds(adminClient: SupabaseClient) {
  const ids: string[] = [];

  for (let offset = 0; ; offset += QUERY_BATCH_SIZE) {
    const { data, error } = await adminClient
      .from("tracer_study")
      .select("alumni_id")
      .eq("is_submitted", true)
      .order("alumni_id", { ascending: true })
      .range(offset, offset + QUERY_BATCH_SIZE - 1);

    if (error) {
      if (isMissingRelationError(error)) {
        throw new AdminNotificationServiceError("feature_unavailable");
      }
      throw error;
    }

    const rows = (data ?? []) as Array<{ alumni_id: string }>;
    ids.push(...rows.map((row) => row.alumni_id));

    if (rows.length < QUERY_BATCH_SIZE) break;
  }

  return ids;
}

function buildTargetLabel(payload: NotificationTargetPayload) {
  switch (payload.target) {
    case "prodi":
      return `Prodi: ${(payload.prodi ?? []).join(", ")}`;
    case "tahun":
      return `Tahun lulus ${payload.tahunMulai ?? "-"} - ${payload.tahunAkhir ?? "-"}`;
    case "belum_mengisi":
      return "Belum Mengisi Saja";
    default:
      return "Semua Alumni";
  }
}

async function rollbackFallbackBroadcast(adminClient: SupabaseClient, broadcastId: string) {
  await adminClient.from("notifications").delete().eq("broadcast_id", broadcastId);
  await adminClient.from("notification_broadcasts").delete().eq("id", broadcastId);
}
