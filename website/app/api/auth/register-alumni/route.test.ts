import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const inFilter = vi.fn(async () => ({ data: [] as Array<{ id: string }>, error: null }));
  const select = vi.fn(() => ({ in: inFilter }));
  const upsert = vi.fn(async () => ({ error: null as null | { message: string } }));
  const createUser = vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null }));
  const deleteUser = vi.fn(async () => ({ error: null }));
  const consumeServerRateLimit = vi.fn(async (): Promise<{ limited: boolean; retryAfterSeconds?: number }> => ({ limited: false }));
  const from = vi.fn(() => ({ select, upsert }));
  return { inFilter, select, upsert, createUser, deleteUser, from, consumeServerRateLimit };
});

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({
    from: mocks.from,
    auth: {
      admin: {
        createUser: mocks.createUser,
        deleteUser: mocks.deleteUser
      }
    }
  }))
}));

vi.mock("@/lib/server-rate-limit", () => ({
  consumeServerRateLimit: mocks.consumeServerRateLimit,
  getClientIp: vi.fn(() => "203.0.113.10")
}));

import { POST } from "@/app/api/auth/register-alumni/route";

describe("POST /api/auth/register-alumni", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockReturnValue({ select: mocks.select, upsert: mocks.upsert });
  });

  it("returns duplicate message when the NPM already exists", async () => {
    mocks.inFilter.mockResolvedValueOnce({ data: [{ id: "existing-user" }], error: null });

    const response = await POST(
      new Request("https://example.test/api/auth/register-alumni", {
        method: "POST",
        body: JSON.stringify({
          nim: "2019.01.0023",
          password: "secret123",
          nama_lengkap: "Alumni Test",
          prodi: "Teknik Informatika",
          tahun_masuk: 2019,
          tahun_lulus: 2023,
          email: "alumni@example.com"
        })
      })
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ message: "NPM sudah terdaftar" });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });

  it("creates the auth user and upserts the alumni profile", async () => {
    const response = await POST(
      new Request("https://example.test/api/auth/register-alumni", {
        method: "POST",
        body: JSON.stringify({
          nim: "2019.01.0023",
          password: "secret123",
          nama_lengkap: "Alumni Test",
          prodi: "Teknik Informatika",
          tahun_masuk: 2019,
          tahun_lulus: 2023,
          email: "alumni@example.com"
        })
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ message: "Akun berhasil dibuat. Silakan masuk." });
    expect(mocks.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "2019.01.0023@ft.unihaz.ac.id",
        password: "secret123",
        email_confirm: true
      })
    );
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "user-1",
        nim: "2019.01.0023",
        email: "alumni@example.com",
        is_admin: false
      }),
      { onConflict: "id" }
    );
  });

  it("returns 429 when registration attempts exceed the rate limit", async () => {
    mocks.consumeServerRateLimit.mockResolvedValueOnce({ limited: true, retryAfterSeconds: 120 });

    const response = await POST(
      new Request("https://example.test/api/auth/register-alumni", {
        method: "POST",
        body: JSON.stringify({
          nim: "2019.01.0023",
          password: "secret123",
          nama_lengkap: "Alumni Test",
          prodi: "Teknik Informatika",
          tahun_masuk: 2019,
          tahun_lulus: 2023,
          email: "alumni@example.com"
        })
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("120");
    await expect(response.json()).resolves.toEqual({
      message: "Terlalu banyak percobaan pendaftaran. Coba lagi beberapa menit lagi."
    });
    expect(mocks.createUser).not.toHaveBeenCalled();
  });
});
