import { describe, expect, it, vi } from "vitest";
import { consumePasswordResetRateLimit } from "./password-reset-rate-limit";

describe("consumePasswordResetRateLimit", () => {
  it("uses the database RPC to consume attempts atomically", async () => {
    const single = vi.fn(async () => ({
      data: { limited: false, retry_after_seconds: null },
      error: null
    }));
    const rpc = vi.fn(() => ({ single }));
    const request = new Request("https://example.test/api/auth/request-password-reset", {
      headers: { "x-forwarded-for": "203.0.113.10" }
    });

    const result = await consumePasswordResetRateLimit({
      admin: { rpc } as never,
      request,
      nim: "2019.01.0023",
      email: "alumni@example.com"
    });

    expect(result).toEqual({ limited: false });
    expect(rpc).toHaveBeenCalledWith(
      "consume_password_reset_rate_limit",
      expect.objectContaining({
        p_max_attempts: 5,
        p_window_seconds: 900
      })
    );
    expect(single).toHaveBeenCalledOnce();
  });

  it("maps a limited RPC response to retry metadata", async () => {
    const single = vi.fn(async () => ({
      data: { limited: true, retry_after_seconds: 120 },
      error: null
    }));
    const request = new Request("https://example.test/api/auth/request-password-reset");

    const result = await consumePasswordResetRateLimit({
      admin: { rpc: vi.fn(() => ({ single })) } as never,
      request,
      nim: "2019.01.0023",
      email: "alumni@example.com"
    });

    expect(result).toEqual({ limited: true, retryAfterSeconds: 120 });
  });
});
