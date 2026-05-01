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
  const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { data, error } = await admin
    .from("password_reset_attempts")
    .select("rate_key")
    .in("rate_key", rateKeys)
    .gte("created_at", cutoff);

  if (error) {
    throw error;
  }

  const attemptsByKey = new Map<string, number>();

  for (const attempt of data ?? []) {
    const rateKey = attempt.rate_key;
    attemptsByKey.set(rateKey, (attemptsByKey.get(rateKey) ?? 0) + 1);
  }

  const limited = rateKeys.some((rateKey) => (attemptsByKey.get(rateKey) ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS);

  if (limited) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
    };
  }

  const { error: insertError } = await admin
    .from("password_reset_attempts")
    .insert(rateKeys.map((rate_key) => ({ rate_key })));

  if (insertError) {
    throw insertError;
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
