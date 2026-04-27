import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { INDONESIAN_ERRORS } from "@/lib/constants";
import type { ActionResult } from "@/types";

export async function requireAdmin(): Promise<
  | { ok: true; user: User; adminClient: SupabaseClient }
  | { ok: false; error: string }
> {
  const userClient = await createClient();
  const {
    data: { user },
    error: userError
  } = await userClient.auth.getUser();

  if (userError || !user) return { ok: false, error: INDONESIAN_ERRORS.session };

  const { data: profile, error: profileError } = await userClient
    .from("alumni")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) return { ok: false, error: INDONESIAN_ERRORS.admin };

  try {
    return { ok: true, user, adminClient: createAdminClient() };
  } catch {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi untuk server actions"
    };
  }
}

export function actionError<T>(message: string = INDONESIAN_ERRORS.load): ActionResult<T> {
  return { data: null, error: message };
}

export function actionData<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function getRange(page: number, pageSize: number) {
  const from = Math.max(0, (page - 1) * pageSize);
  return { from, to: from + pageSize - 1 };
}

export function sanitizeText(value?: string | null) {
  if (!value) return undefined;
  return value.trim() || undefined;
}

export function isMissingRelationError(error?: { code?: string; message?: string } | null) {
  return (
    error?.code === "PGRST205" ||
    error?.message?.includes("Could not find the table") ||
    error?.message?.includes("Could not find the view")
  );
}

export function isMissingFunctionError(error?: { code?: string; message?: string } | null) {
  return error?.code === "PGRST202" || error?.message?.includes("Could not find the function");
}
