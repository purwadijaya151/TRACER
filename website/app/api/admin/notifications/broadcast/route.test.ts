import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  broadcastNotifikasi: vi.fn()
}));

vi.mock("@/lib/actions/notifikasi.actions", () => ({
  broadcastNotifikasi: mocks.broadcastNotifikasi
}));

import { POST } from "@/app/api/admin/notifications/broadcast/route";

describe("POST /api/admin/notifications/broadcast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns sent count when broadcast succeeds", async () => {
    mocks.broadcastNotifikasi.mockResolvedValueOnce({ data: { sent: 17 }, error: null });

    const response = await POST(
      new Request("https://example.test/api/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: "Pengingat",
          body: "Mohon isi tracer study",
          target: "belum_mengisi"
        })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ sent: 17 });
  });

  it("maps broadcast rate limits to HTTP 429", async () => {
    mocks.broadcastNotifikasi.mockResolvedValueOnce({
      data: null,
      error: "Broadcast dibatasi maksimal 1 kali per menit"
    });

    const response = await POST(
      new Request("https://example.test/api/admin/notifications/broadcast", {
        method: "POST",
        body: JSON.stringify({
          title: "Pengingat",
          body: "Mohon isi tracer study",
          target: "belum_mengisi"
        })
      })
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      message: "Broadcast dibatasi maksimal 1 kali per menit"
    });
  });
});
