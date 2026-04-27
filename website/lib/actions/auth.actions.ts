"use server";

import { INDONESIAN_ERRORS } from "@/lib/constants";
import { actionData, actionError } from "@/lib/actions/_utils";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";

type AdminLoginProfile = {
  id: string;
  email: string | null;
  is_admin: boolean;
  npp?: string | null;
};

export async function loginAdmin(input: unknown) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return actionError<{ ok: true }>(INDONESIAN_ERRORS.credentials);

  let adminClient: ReturnType<typeof createAdminClient>;
  try {
    adminClient = createAdminClient();
  } catch {
    return actionError<{ ok: true }>("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi untuk login admin");
  }

  const { npp, password } = parsed.data;
  const nppLookup = await adminClient
    .from("alumni")
    .select("id,email,is_admin,npp")
    .eq("npp", npp)
    .eq("is_admin", true)
    .maybeSingle();
  let profile = nppLookup.data as AdminLoginProfile | null;
  let profileError = nppLookup.error;

  if (profileError) {
    if (profileError.code === "42703") {
      profile = await findAdminProfileByAuthNpp(adminClient, npp);
      profileError = null;
    } else {
      return actionError<{ ok: true }>(INDONESIAN_ERRORS.credentials);
    }
  }

  if (!profile && !profileError) {
    profile = await findAdminProfileByAuthNpp(adminClient, npp);
  }

  if (profileError) {
    return actionError<{ ok: true }>(INDONESIAN_ERRORS.credentials);
  }

  if (!profile) return actionError<{ ok: true }>(INDONESIAN_ERRORS.credentials);

  const signInEmail = await getAuthEmail(adminClient, profile.id) ?? profile.email;
  if (!signInEmail) return actionError<{ ok: true }>(INDONESIAN_ERRORS.credentials);

  const userClient = await createClient();
  const {
    data: signInData,
    error: signInError
  } = await userClient.auth.signInWithPassword({
    email: signInEmail,
    password
  });

  if (signInError || !signInData.user || signInData.user.id !== profile.id) {
    await userClient.auth.signOut();
    return actionError<{ ok: true }>(INDONESIAN_ERRORS.credentials);
  }

  return actionData({ ok: true as const });
}

async function getAuthEmail(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data, error } = await adminClient.auth.admin.getUserById(userId);
  if (error) return null;
  return data.user?.email ?? null;
}

async function findAdminProfileByAuthNpp(
  adminClient: ReturnType<typeof createAdminClient>,
  npp: string
): Promise<AdminLoginProfile | null> {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) return null;

    const authUser = data.users.find((candidate) => {
      return candidate.app_metadata?.npp === npp || candidate.user_metadata?.npp === npp;
    });

    if (authUser) {
      const { data: profile, error: profileError } = await adminClient
        .from("alumni")
        .select("id,email,is_admin")
        .eq("id", authUser.id)
        .eq("is_admin", true)
        .maybeSingle();

      if (profileError || !profile?.is_admin) return null;

      return {
        id: profile.id,
        email: profile.email ?? authUser.email ?? null,
        is_admin: profile.is_admin
      };
    }

    if (data.users.length < perPage) return null;
    page += 1;
  }
}
