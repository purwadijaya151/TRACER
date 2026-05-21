import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRecipientCount: vi.fn()
}));

vi.mock("@/lib/actions/notifikasi.actions", () => ({
  getRecipientCount: mocks.getRecipientCount
}));

import { POST } from "@/app/api/admin/notifications/recipients/route";

describe("POST /api/admin/notifications/recipients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the preview recipient count", async () => {
    mocks.getRecipientCount.mockResolvedValueOnce({ data: 42, error: null });

    const response = await POST(
      new Request("https://example.test/api/admin/notifications/recipients", {
        method: "POST",
        body: JSON.stringify({ target: "all" })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ count: 42 });
  });
});
