import { afterEach, describe, expect, it, vi } from "vitest";
import { resolvePasswordResetRedirectTo } from "./reset-password-redirect";

describe("resolvePasswordResetRedirectTo", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = { ...originalEnv };
  });

  it("uses the remote request origin when configured redirect still points to localhost", () => {
    process.env.PASSWORD_RESET_REDIRECT_TO = "http://localhost:3002/reset-password";
    delete process.env.VERCEL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

    const result = resolvePasswordResetRedirectTo(
      new Request("https://tracerstudy-admin.vercel.app/api/auth/request-password-reset")
    );

    expect(result).toBe("https://tracerstudy-admin.vercel.app/reset-password");
  });

  it("uses the remote request origin when configured redirect points to emulator or LAN addresses", () => {
    for (const redirect of [
      "http://10.0.2.2:3002/reset-password",
      "http://192.168.1.20:3002/reset-password",
      "http://172.20.10.4:3002/reset-password",
      "http://host.docker.internal:3002/reset-password"
    ]) {
      process.env.PASSWORD_RESET_REDIRECT_TO = redirect;
      delete process.env.VERCEL;
      delete process.env.VERCEL_URL;
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;

      const result = resolvePasswordResetRedirectTo(
        new Request("https://tracerstudy-admin.vercel.app/api/auth/request-password-reset")
      );

      expect(result).toBe("https://tracerstudy-admin.vercel.app/reset-password");
    }
  });

  it("keeps the configured redirect when it is already a remote URL", () => {
    process.env.PASSWORD_RESET_REDIRECT_TO = "https://tracerstudy-admin.vercel.app/reset-password";

    const result = resolvePasswordResetRedirectTo(
      new Request("https://tracerstudy-admin.vercel.app/api/auth/request-password-reset")
    );

    expect(result).toBe("https://tracerstudy-admin.vercel.app/reset-password");
  });
});
