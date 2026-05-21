import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn()
}));

vi.mock("@/lib/actions/_utils", () => ({
  requireAdmin: vi.fn(async () => ({
    ok: true,
    user: { id: "admin-1" },
    adminClient: {
      rpc: mocks.rpc,
      from: mocks.from
    }
  })),
  actionData: (data: unknown) => ({ data, error: null }),
  actionError: (message?: string) => ({ data: null, error: message ?? "error" }),
  getRange: (page: number, pageSize: number) => ({ from: (page - 1) * pageSize, to: page * pageSize - 1 }),
  isMissingFunctionError: (error: { code?: string } | null) => error?.code === "PGRST202",
  isMissingRelationError: () => false
}));

import { broadcastNotifikasi, getRecipientCount } from "@/lib/actions/notifikasi.actions";

function countBuilder(count: number) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve({ count, error: null }))
  };
  return query;
}

function pageBuilder<T>(rows: T[]) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn((from: number, to: number) => {
      const slice = rows.slice(from, to + 1);
      return Promise.resolve({ data: slice, error: null });
    })
  };
  return query;
}

function insertBuilder() {
  const query = {
    order: vi.fn(() => query),
    range: vi.fn(async () => ({ data: [], error: null })),
    insert: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(async () => ({ data: { id: "broadcast-1" }, error: null })),
    delete: vi.fn(() => query),
    eq: vi.fn(async () => ({ error: null }))
  };
  return query;
}

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

  it("fallback recipient count uses exact counts without loading a capped submitted ID page", async () => {
    const totalAlumni = countBuilder(12_000);
    const submittedAlumni = countBuilder(7_000);
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } });
    mocks.from.mockImplementation((table: string) => table === "alumni" ? totalAlumni : submittedAlumni);

    const result = await getRecipientCount({
      title: "Pengingat",
      body: "Mohon isi tracer study",
      target: "belum_mengisi"
    });

    expect(result.data).toBe(5_000);
    expect(submittedAlumni.select).toHaveBeenCalledWith(
      "alumni_id, alumni!inner(is_admin)",
      { count: "exact", head: true }
    );
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

  it("falls back to base tables when the broadcast RPC is missing", async () => {
    const alumniRows = pageBuilder([{ id: "alumni-1" }, { id: "alumni-2" }]);
    const tracerRows = pageBuilder([{ alumni_id: "alumni-2" }]);
    const broadcastRows = insertBuilder();
    const notificationRows = {
      insert: vi.fn(async () => ({ error: null })),
      delete: vi.fn(() => notificationRows),
      eq: vi.fn(async () => ({ error: null }))
    };

    mocks.rpc.mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } });
    mocks.from.mockImplementation((table: string) => {
      if (table === "alumni") return alumniRows;
      if (table === "tracer_study") return tracerRows;
      if (table === "notification_broadcasts") return broadcastRows;
      if (table === "notifications") return notificationRows;
      throw new Error(`unexpected table ${table}`);
    });

    const result = await broadcastNotifikasi({
      title: "Pengingat",
      body: "Mohon isi tracer study",
      target: "belum_mengisi"
    });

    expect(result.data).toEqual({ sent: 1 });
    expect(notificationRows.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        alumni_id: "alumni-1",
        title: "Pengingat",
        broadcast_id: "broadcast-1"
      })
    ]);
  });
});
