import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserById: vi.fn(async () => ({ data: { user: { email: "admin-old@test.local" } }, error: null })),
  updateUserById: vi.fn(async () => ({ error: null as null | { message: string } })),
  update: vi.fn()
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}));

vi.mock("@/lib/actions/_utils", () => ({
  requireAdmin: vi.fn(async () => ({
    ok: true,
    user: { id: "admin-1", email: "admin-old@test.local" },
    adminClient: {
      auth: {
        admin: {
          getUserById: mocks.getUserById,
          updateUserById: mocks.updateUserById
        }
      },
      from: vi.fn(() => ({ update: mocks.update }))
    }
  })),
  actionData: (data: unknown) => ({ data, error: null }),
  actionError: (message?: string) => ({ data: null, error: message ?? "error" }),
  reportActionError: vi.fn(),
  isMissingRelationError: () => false
}));

import { updateAdminProfile } from "@/lib/actions/pengaturan.actions";

describe("updateAdminProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stops admin profile updates when Supabase Auth rejects the new email", async () => {
    mocks.updateUserById.mockResolvedValueOnce({ error: { message: "duplicate email" } });

    const result = await updateAdminProfile({
      nama_lengkap: "Admin Test",
      email: "admin-new@test.local",
      no_hp: "",
      foto_url: ""
    });

    expect(result.error).toBe("Email Auth admin gagal diperbarui");
    expect(mocks.updateUserById).toHaveBeenCalledWith("admin-1", {
      email: "admin-new@test.local",
      email_confirm: true
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
