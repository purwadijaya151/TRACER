import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn();
  const select = vi.fn();
  const from = vi.fn();
  const getUserById = vi.fn();
  const signInWithPassword = vi.fn();
  const signOut = vi.fn();

  const query = { select, eq, maybeSingle };
  select.mockReturnValue(query);
  eq.mockReturnValue(query);
  from.mockReturnValue(query);

  return { maybeSingle, eq, select, from, getUserById, signInWithPassword, signOut };
});

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({
    auth: { admin: { getUserById: mocks.getUserById } },
    from: mocks.from
  })),
  createClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      signOut: mocks.signOut
    }
  }))
}));

vi.mock("@/lib/actions/_utils", () => ({
  actionData: (data: unknown) => ({ data, error: null }),
  actionError: (message?: string) => ({ data: null, error: message ?? "error" })
}));

import { loginAdmin } from "@/lib/actions/auth.actions";

describe("loginAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.select.mockReturnValue({ select: mocks.select, eq: mocks.eq, maybeSingle: mocks.maybeSingle });
    mocks.eq.mockReturnValue({ select: mocks.select, eq: mocks.eq, maybeSingle: mocks.maybeSingle });
  });

  it("signs in with the canonical Supabase Auth email for the admin NPP", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({
      data: { id: "admin-1", email: "stale-profile@test.local", is_admin: true, npp: "198001012024011001" },
      error: null
    });
    mocks.getUserById.mockResolvedValueOnce({
      data: { user: { id: "admin-1", email: "admin@test.local" } },
      error: null
    });
    mocks.signInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "admin-1" } },
      error: null
    });

    const result = await loginAdmin({ npp: "198001012024011001", password: "secret123" });

    expect(result.error).toBeNull();
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@test.local",
      password: "secret123"
    });
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
});
