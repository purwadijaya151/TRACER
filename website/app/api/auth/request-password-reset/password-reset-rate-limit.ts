import { createHash } from "crypto";
import type { createAdminClient } from "@/lib/supabase/server";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_KEY_PREFIX = "password-reset-v1";

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
  const rateKeys = [
    hashRateLimitKey(`ip:${getClientIp(request)}`),
    hashRateLimitKey(`account:${nim.toLowerCase()}:${email.toLowerCase()}`)
  ];
  const { data, error } = await admin
    .rpc("consume_password_reset_rate_limit", {
      p_rate_keys: rateKeys,
      p_window_seconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      p_max_attempts: RATE_LIMIT_MAX_ATTEMPTS
    })
    .single();

  if (error) {
    throw error;
  }

  const result = data as { limited?: boolean; retry_after_seconds?: number | null } | null;
  const limited = result?.limited === true;

  if (limited) {
    return {
      limited: true,
      retryAfterSeconds: result?.retry_after_seconds ?? Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
    };
  }

  return { limited: false };
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function hashRateLimitKey(value: string) {
  return createHash("sha256").update(`${RATE_LIMIT_KEY_PREFIX}:${value}`).digest("hex");
}
