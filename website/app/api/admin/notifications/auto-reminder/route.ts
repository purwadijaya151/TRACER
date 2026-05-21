import { requireAdmin } from "@/lib/actions/_utils";
import { AdminNotificationServiceError, runAutoReminder } from "@/lib/notifications/admin-notification-service";
import { createAdminClient } from "@/lib/supabase/server";
import { notificationErrorStatus } from "../route-response";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return Response.json({ message: "CRON_SECRET belum dikonfigurasi" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAutoReminder(createAdminClient(), { createdBy: null });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(_request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return Response.json({ message: auth.error }, { status: auth.error.includes("akses") ? 403 : 401 });
  }

  try {
    const result = await runAutoReminder(auth.adminClient, { createdBy: auth.user.id });
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof AdminNotificationServiceError) {
    const message = mapAutoReminderErrorMessage(error);
    return Response.json({ message }, { status: notificationErrorStatus(message) });
  }

  return Response.json({ message: "Gagal menjalankan auto reminder" }, { status: 500 });
}

function mapAutoReminderErrorMessage(error: AdminNotificationServiceError) {
  switch (error.code) {
    case "rate_limit":
      return "Broadcast dibatasi maksimal 1 kali per menit";
    case "no_recipients":
      return "Tidak ada alumni yang cocok dengan target";
    case "empty_prodi_target":
      return "Pilih minimal satu prodi";
    case "feature_unavailable":
      return "Fitur broadcast belum tersedia. Jalankan migrasi database notifikasi terlebih dahulu.";
    default:
      return "Gagal menjalankan auto reminder";
  }
}
