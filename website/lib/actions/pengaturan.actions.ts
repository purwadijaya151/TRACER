"use server";

import { createClient } from "@/lib/supabase/server";
import { actionData, actionError, isMissingRelationError, requireAdmin } from "@/lib/actions/_utils";
import { passwordSchema, pengaturanSchema, profileSchema } from "@/lib/validation";
import type { Alumni, PengaturanSistem } from "@/types";

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

const defaultSettings: PengaturanSistem = {
  id: SETTINGS_ID,
  tracer_study_open: true,
  periode_tahun_mulai: new Date().getFullYear() - 5,
  periode_tahun_akhir: new Date().getFullYear(),
  pesan_pengingat: "Mohon lengkapi data tracer study Anda melalui aplikasi TracerStudy FT UNIHAZ.",
  auto_reminder: false
};

export async function getPengaturan() {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<PengaturanSistem>(auth.error);

  const { data, error } = await auth.adminClient
    .from("pengaturan_sistem")
    .select("*")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) return actionData(defaultSettings);
    return actionError<PengaturanSistem>();
  }
  return actionData((data as PengaturanSistem | null) ?? defaultSettings);
}

export async function savePengaturan(input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<PengaturanSistem>(auth.error);

  const parsed = pengaturanSchema.safeParse(input);
  if (!parsed.success) return actionError<PengaturanSistem>("Pengaturan tidak valid");

  const { data, error } = await auth.adminClient
    .from("pengaturan_sistem")
    .upsert({ id: SETTINGS_ID, ...parsed.data }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    if (isMissingRelationError(error)) {
      return actionError<PengaturanSistem>("Tabel pengaturan sistem belum tersedia. Jalankan migrasi database terlebih dahulu.");
    }
    return actionError<PengaturanSistem>("Gagal menyimpan pengaturan");
  }
  return actionData(data as PengaturanSistem);
}

export async function getAdminProfile() {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<Alumni>(auth.error);

  const { data, error } = await auth.adminClient
    .from("alumni")
    .select("*")
    .eq("id", auth.user.id)
    .single();

  if (error) return actionError<Alumni>();
  return actionData(data as Alumni);
}

export async function updateAdminProfile(input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<Alumni>(auth.error);

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return actionError<Alumni>("Profil admin tidak valid");

  let previousAuthEmail: string | null = null;
  let authEmailChanged = false;

  if (auth.user.email !== parsed.data.email) {
    const { data: authUser, error: authUserError } = await auth.adminClient.auth.admin.getUserById(auth.user.id);
    if (authUserError || !authUser.user) return actionError<Alumni>("Gagal memvalidasi akun Auth admin");

    previousAuthEmail = authUser.user.email ?? auth.user.email ?? null;
    const { error: authUpdateError } = await auth.adminClient.auth.admin.updateUserById(auth.user.id, {
      email: parsed.data.email,
      email_confirm: true
    });
    if (authUpdateError) return actionError<Alumni>("Email Auth admin gagal diperbarui");
    authEmailChanged = true;
  }

  const { data, error } = await auth.adminClient
    .from("alumni")
    .update({
      nama_lengkap: parsed.data.nama_lengkap,
      email: parsed.data.email,
      no_hp: parsed.data.no_hp || null,
      foto_url: parsed.data.foto_url || null
    })
    .eq("id", auth.user.id)
    .select()
    .single();

  if (error) {
    if (authEmailChanged && previousAuthEmail) {
      await auth.adminClient.auth.admin.updateUserById(auth.user.id, {
        email: previousAuthEmail,
        email_confirm: true
      });
    }
    return actionError<Alumni>("Gagal memperbarui profil");
  }

  return actionData(data as Alumni);
}

export async function changePassword(input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<{ changed: boolean }>(auth.error);

  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return actionError<{ changed: boolean }>("Data password tidak valid");
  if (!auth.user.email) return actionError<{ changed: boolean }>("Email admin tidak ditemukan");

  const userClient = await createClient();
  const { error: verifyError } = await userClient.auth.signInWithPassword({
    email: auth.user.email,
    password: parsed.data.oldPassword
  });

  if (verifyError) return actionError<{ changed: boolean }>("Password lama tidak sesuai");

  const { error } = await userClient.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return actionError<{ changed: boolean }>("Gagal mengganti password");

  return actionData({ changed: true });
}
