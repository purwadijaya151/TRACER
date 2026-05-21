import { broadcastNotifikasi } from "@/lib/actions/notifikasi.actions";
import { notificationErrorStatus } from "../route-response";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const result = await broadcastNotifikasi(payload);

  if (result.error) {
    return Response.json({ message: result.error }, { status: notificationErrorStatus(result.error) });
  }

  return Response.json({ sent: result.data?.sent ?? 0 });
}
