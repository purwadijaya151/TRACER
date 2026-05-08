import type { createAdminClient } from "@/lib/supabase/server";
import { consumeServerRateLimit, getClientIp } from "@/lib/server-rate-limit";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

type PasswordResetRateLimitParams = {
  admin: SupabaseAdminClient;
  request: Request;
  nim: string;
  email: string;
};

export type PasswordResetRateLimitResult = {
  limited: boolean;
  retryAfterSeconds?: number;
};

export async function consumePasswordResetRateLimit({
  admin,
  request,
  nim,
  email
}: PasswordResetRateLimitParams): Promise<PasswordResetRateLimitResult> {
  return consumeServerRateLimit({
    admin,
    scope: "password-reset",
    rateKeys: [
      `ip:${getClientIp(request.headers)}`,
      `account:${nim.toLowerCase()}:${email.toLowerCase()}`
    ],
    windowSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    maxAttempts: RATE_LIMIT_MAX_ATTEMPTS
  });
}
