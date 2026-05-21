import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  runAutoReminder: vi.fn(),
  requireAdmin: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: mocks.createAdminClient
}));

vi.mock("@/lib/notifications/admin-notification-service", () => ({
  runAutoReminder: mocks.runAutoReminder
}));

vi.mock("@/lib/actions/_utils", () => ({
  requireAdmin: mocks.requireAdmin
}));

import { GET, POST } from "@/app/api/admin/notifications/auto-reminder/route";

describe("/api/admin/notifications/auto-reminder", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: "secret-123" };
    mocks.createAdminClient.mockReturnValue({ kind: "admin-client" });
    mocks.requireAdmin.mockResolvedValue({
      ok: true,
      user: { id: "admin-1" },
      adminClient: { kind: "admin-client" }
    });
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("rejects cron calls without the configured bearer secret", async () => {
    const response = await GET(
      new Request("https://example.test/api/admin/notifications/auto-reminder", {
        method: "GET"
      })
    );

    expect(response.status).toBe(401);
  });

  it("runs the reminder job for authenticated cron calls", async () => {
    mocks.runAutoReminder.mockResolvedValueOnce({ sent: 9, skipped: false });

    const response = await GET(
      new Request("https://example.test/api/admin/notifications/auto-reminder", {
        method: "GET",
        headers: { authorization: "Bearer secret-123" }
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ sent: 9, skipped: false });
    expect(mocks.runAutoReminder).toHaveBeenCalledWith({ kind: "admin-client" }, { createdBy: null });
  });

  it("allows manual admin-triggered reminder execution", async () => {
    mocks.runAutoReminder.mockResolvedValueOnce({ sent: 3, skipped: false });

    const response = await POST(
      new Request("https://example.test/api/admin/notifications/auto-reminder", {
        method: "POST"
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ sent: 3, skipped: false });
    expect(mocks.runAutoReminder).toHaveBeenCalledWith({ kind: "admin-client" }, { createdBy: "admin-1" });
  });
});
