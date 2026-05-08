import { createHash } from "crypto";
import type { createAdminClient } from "@/lib/supabase/server";

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;
type HeaderSource = Pick<Headers, "get">;

export type ServerRateLimitResult = {
  limited: boolean;
  retryAfterSeconds?: number;
};

type ConsumeServerRateLimitParams = {
  admin: SupabaseAdminClient;
  scope: string;
  rateKeys: string[];
  windowSeconds: number;
  maxAttempts: number;
};

const RATE_LIMIT_PREFIX = "server-rate-limit-v1";

export async function consumeServerRateLimit({
  admin,
  scope,
  rateKeys,
  windowSeconds,
  maxAttempts
}: ConsumeServerRateLimitParams): Promise<ServerRateLimitResult> {
  const hashedKeys = rateKeys
    .filter((value) => value.trim().length > 0)
    .map((value) => hashRateLimitKey(scope, value));

  if (hashedKeys.length === 0) {
    return { limited: false };
  }

  const { data, error } = await admin
    .rpc("consume_password_reset_rate_limit", {
      p_rate_keys: hashedKeys,
      p_window_seconds: windowSeconds,
      p_max_attempts: maxAttempts
    })
    .single();

  if (error) {
    throw error;
  }

  const result = data as { limited?: boolean; retry_after_seconds?: number | null } | null;
  if (result?.limited) {
    return {
      limited: true,
      retryAfterSeconds: result.retry_after_seconds ?? windowSeconds
    };
  }

  return { limited: false };
}

export function getClientIp(headers: HeaderSource) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    headers.get("x-real-ip")?.trim() ||
    headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function hashRateLimitKey(scope: string, value: string) {
  return createHash("sha256")
    .update(`${RATE_LIMIT_PREFIX}:${scope}:${value}`)
    .digest("hex");
}
