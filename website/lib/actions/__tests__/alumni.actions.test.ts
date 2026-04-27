import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const single = vi.fn(async () => ({ data: { id: "user-1", nim: "2026001" }, error: null }));
  const inFilter = vi.fn(async () => ({ data: [] as Array<{ id: string; is_admin: boolean }>, error: null }));
  const select = vi.fn(() => ({ single, in: inFilter }));
  const upsert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ upsert }));
  const createUser = vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null }));
  const deleteUser = vi.fn(async () => ({ error: null }));
  return { single, inFilter, select, upsert, from, createUser, deleteUser };
});

vi.mock("@/lib/actions/_utils", () => ({
  requireAdmin: vi.fn(async () => ({
    ok: true,
    user: { id: "admin-1" },
    adminClient: {
      auth: { admin: { createUser: mocks.createUser, deleteUser: mocks.deleteUser } },
      from: vi.fn(() => ({ upsert: mocks.upsert, select: mocks.select }))
    }
  })),
  actionData: (data: unknown) => ({ data, error: null }),
  actionError: (message?: string) => ({ data: null, error: message ?? "error" }),
  sanitizeText: (value?: string | null) => value?.trim() || undefined
}));

import { createAlumni, deleteAlumni } from "@/lib/actions/alumni.actions";

describe("createAlumni", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an auth user then upserts the alumni row", async () => {
    const result = await createAlumni({
      nim: "2026001",
      nama_lengkap: "Alumni Test",
      prodi: "Teknik Informatika",
      tahun_masuk: 2022,
      tahun_lulus: 2026,
      email: "alumni@test.local",
      password: "secret123"
    });

    expect(result.error).toBeNull();
    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "alumni@test.local", password: "secret123" })
    );
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-1", nim: "2026001", is_admin: false }),
      { onConflict: "id" }
    );
  });

  it("does not delete admin accounts from alumni management", async () => {
    mocks.inFilter.mockResolvedValueOnce({ data: [{ id: "other-admin", is_admin: true }], error: null });

    const result = await deleteAlumni("other-admin");

    expect(result.error).toBe("Akun admin tidak boleh dihapus");
    expect(mocks.deleteUser).not.toHaveBeenCalled();
  });
});
