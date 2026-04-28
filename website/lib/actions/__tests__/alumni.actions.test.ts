import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const single = vi.fn(async () => ({ data: { id: "user-1", nim: "2026001" }, error: null }));
  const inFilter = vi.fn(async () => ({ data: [] as Array<{ id: string; is_admin: boolean }>, error: null }));
  const select = vi.fn(() => ({ single, in: inFilter }));
  const upsert = vi.fn(() => ({ select }));
  const getUserById = vi.fn(async () => ({ data: { user: { email: "old@test.local" } }, error: null }));
  const updateUserById = vi.fn(async () => ({ error: null as null | { message: string } }));
  const from = vi.fn<(...args: unknown[]) => unknown>(() => ({ upsert }));
  const createUser = vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null }));
  const deleteUser = vi.fn(async () => ({ error: null }));
  return { single, inFilter, select, upsert, from, createUser, deleteUser, getUserById, updateUserById };
});

vi.mock("@/lib/actions/_utils", () => ({
  requireAdmin: vi.fn(async () => ({
    ok: true,
    user: { id: "admin-1" },
    adminClient: {
      auth: {
        admin: {
          createUser: mocks.createUser,
          deleteUser: mocks.deleteUser,
          getUserById: mocks.getUserById,
          updateUserById: mocks.updateUserById
        }
      },
      from: mocks.from
    }
  })),
  actionData: (data: unknown) => ({ data, error: null }),
  actionError: (message?: string) => ({ data: null, error: message ?? "error" }),
  sanitizeText: (value?: string | null) => value?.trim() || undefined
}));

import { createAlumni, deleteAlumni, getAlumniExport, updateAlumni } from "@/lib/actions/alumni.actions";

function createPagedBuilder<T>(batches: T[][]) {
  let rangeFrom = 0;

  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    or: vi.fn(() => query),
    range: vi.fn((from: number) => {
      rangeFrom = from;
      return query;
    }),
    then: (resolve: (value: unknown) => unknown) => {
      const batchIndex = Math.floor(rangeFrom / 1000);
      return Promise.resolve(resolve({ data: batches[batchIndex] ?? [], error: null }));
    }
  };

  return query;
}

describe("createAlumni", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ upsert: mocks.upsert, select: mocks.select });
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

  it("stops alumni profile updates when Supabase Auth rejects the new email", async () => {
    mocks.getUserById.mockResolvedValueOnce({ data: { user: { email: "old@test.local" } }, error: null });
    mocks.updateUserById.mockResolvedValueOnce({ error: { message: "duplicate email" } });

    const result = await updateAlumni("user-1", {
      nim: "2026001",
      nama_lengkap: "Alumni Test",
      prodi: "Teknik Informatika",
      tahun_masuk: 2022,
      tahun_lulus: 2026,
      email: "new@test.local"
    });

    expect(result.error).toBe("Email Auth alumni gagal diperbarui");
    expect(mocks.updateUserById).toHaveBeenCalledWith("user-1", {
      email: "new@test.local",
      email_confirm: true
    });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("exports every alumni batch without the old 5000-row cap", async () => {
    const firstBatch = Array.from({ length: 1000 }, (_, index) => ({
      id: `alumni-${index}`,
      nim: `2026${index}`,
      nama_lengkap: `Alumni ${index}`,
      tracer_submitted: false
    }));
    const secondBatch = Array.from({ length: 200 }, (_, index) => ({
      id: `alumni-${index + 1000}`,
      nim: `2026${index + 1000}`,
      nama_lengkap: `Alumni ${index + 1000}`,
      tracer_submitted: true
    }));
    const exportQuery = createPagedBuilder([firstBatch, secondBatch]);
    mocks.from.mockReturnValue(exportQuery);

    const result = await getAlumniExport();

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1200);
    expect(exportQuery.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(exportQuery.range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });
});
