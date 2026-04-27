import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn()
}));

vi.mock("@/lib/actions/_utils", () => ({
  requireAdmin: vi.fn(async () => ({
    ok: true,
    user: { id: "admin-1" },
    adminClient: {
      rpc: mocks.rpc,
      from: vi.fn()
    }
  })),
  actionData: (data: unknown) => ({ data, error: null }),
  actionError: (message?: string) => ({ data: null, error: message ?? "error" }),
  getRange: (page: number, pageSize: number) => ({ from: (page - 1) * pageSize, to: page * pageSize - 1 })
}));

import { broadcastNotifikasi, getRecipientCount } from "@/lib/actions/notifikasi.actions";

describe("notifikasi actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts recipients through the database RPC", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: 12, error: null });

    const result = await getRecipientCount({
      title: "Pengingat",
      body: "Mohon isi tracer study",
      target: "belum_mengisi"
    });

    expect(result.data).toBe(12);
    expect(mocks.rpc).toHaveBeenCalledWith("admin_count_notification_recipients", {
      p_target_type: "belum_mengisi",
      p_prodi: null,
      p_tahun_mulai: null,
      p_tahun_akhir: null
    });
  });

  it("broadcasts notifications through one atomic RPC", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: [{ broadcast_id: "broadcast-1", sent: 250 }], error: null });

    const result = await broadcastNotifikasi({
      title: "Pengingat",
      body: "Mohon isi tracer study",
      target: "all"
    });

    expect(result.data).toEqual({ sent: 250 });
    expect(mocks.rpc).toHaveBeenCalledWith("admin_broadcast_notifications", expect.objectContaining({
      p_title: "Pengingat",
      p_body: "Mohon isi tracer study",
      p_target_type: "all",
      p_created_by: "admin-1"
    }));
  });

  it("maps RPC rate limit errors to Indonesian copy", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: "rate_limit" } });

    const result = await broadcastNotifikasi({
      title: "Pengingat",
      body: "Mohon isi tracer study",
      target: "all"
    });

    expect(result.error).toBe("Broadcast dibatasi maksimal 1 kali per menit");
  });

  it("rejects year target broadcasts without a complete year range", async () => {
    const result = await broadcastNotifikasi({
      title: "Pengingat",
      body: "Mohon isi tracer study",
      target: "tahun"
    });

    expect(result.error).toBe("Rentang tahun lulus wajib diisi");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
