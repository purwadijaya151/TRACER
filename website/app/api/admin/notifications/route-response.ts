import { INDONESIAN_ERRORS } from "@/lib/constants";

export function notificationErrorStatus(message: string) {
  if (message === INDONESIAN_ERRORS.session) return 401;
  if (message === INDONESIAN_ERRORS.admin) return 403;
  if (message.includes("dibatasi")) return 429;
  if (
    message.includes("tidak valid") ||
    message.includes("minimal satu prodi") ||
    message.includes("Rentang tahun") ||
    message.includes("Tidak ada alumni")
  ) {
    return 400;
  }
  if (message.includes("belum tersedia")) return 503;
  return 500;
}
