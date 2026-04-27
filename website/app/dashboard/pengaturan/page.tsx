"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { Avatar } from "@/components/ui/Avatar";
import {
  changePassword,
  getAdminProfile,
  getPengaturan,
  savePengaturan,
  updateAdminProfile
} from "@/lib/actions/pengaturan.actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { passwordSchema, pengaturanSchema, profileSchema } from "@/lib/validation";

type ProfileForm = z.infer<typeof profileSchema>;
type SettingsForm = z.infer<typeof pengaturanSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function PengaturanPage() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nama_lengkap: "", email: "", no_hp: "", foto_url: "" }
  });
  const settingsForm = useForm<SettingsForm>({
    resolver: zodResolver(pengaturanSchema),
    defaultValues: {
      tracer_study_open: true,
      periode_tahun_mulai: new Date().getFullYear() - 5,
      periode_tahun_akhir: new Date().getFullYear(),
      pesan_pengingat: "",
      auto_reminder: false
    }
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { oldPassword: "", newPassword: "", confirmPassword: "" }
  });

  useEffect(() => {
    const load = async () => {
      const [profile, settings] = await Promise.all([getAdminProfile(), getPengaturan()]);
      if (profile.data) {
        profileForm.reset({
          nama_lengkap: profile.data.nama_lengkap,
          email: profile.data.email ?? "",
          no_hp: profile.data.no_hp ?? "",
          foto_url: profile.data.foto_url ?? ""
        });
        setAvatarUrl(profile.data.foto_url ?? null);
      }
      if (settings.data) settingsForm.reset(settings.data);
      if (profile.error) toast.error(profile.error);
      if (settings.error) toast.error(settings.error);
    };
    void load();
  }, [profileForm, settingsForm]);

  const uploadAvatar = async (file: File) => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sesi habis, silakan login kembali");
      return;
    }
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("admin-avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Gagal upload avatar");
      return;
    }
    const { data } = supabase.storage.from("admin-avatars").getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    profileForm.setValue("foto_url", data.publicUrl);
  };

  const saveProfile = async (values: ProfileForm) => {
    setProfileLoading(true);
    const result = await updateAdminProfile(values);
    setProfileLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Profil admin disimpan");
  };

  const saveSettings = async (values: SettingsForm) => {
    setSettingsLoading(true);
    const result = await savePengaturan(values);
    setSettingsLoading(false);
    if (result.error) toast.error(result.error);
    else toast.success("Pengaturan sistem disimpan");
  };

  const submitPassword = async (values: PasswordForm) => {
    const result = await changePassword(values);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Password diperbarui");
      passwordForm.reset({ oldPassword: "", newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader title="Profil Admin" description="Data akun admin yang aktif pada panel web." />
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar name={profileForm.watch("nama_lengkap")} src={avatarUrl} size={64} />
            <label className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-navy px-4 py-2 text-sm font-semibold text-navy hover:bg-navy-50">
              <Upload className="h-4 w-4" />
              Upload Avatar
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadAvatar(file);
                }}
              />
            </label>
          </div>

          <form className="space-y-4" onSubmit={profileForm.handleSubmit(saveProfile)}>
            <Input label="Nama" error={profileForm.formState.errors.nama_lengkap?.message} {...profileForm.register("nama_lengkap")} />
            <Input label="Email" type="email" error={profileForm.formState.errors.email?.message} {...profileForm.register("email")} />
            <Input label="No HP" error={profileForm.formState.errors.no_hp?.message} {...profileForm.register("no_hp")} />
            <input type="hidden" {...profileForm.register("foto_url")} />
            <Button type="submit" loading={profileLoading}>Simpan Profil</Button>
          </form>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="font-heading text-base font-semibold text-slate-950">Ganti Password</h3>
            <form className="mt-4 space-y-4" onSubmit={passwordForm.handleSubmit(submitPassword)}>
              <Input label="Password Lama" type="password" error={passwordForm.formState.errors.oldPassword?.message} {...passwordForm.register("oldPassword")} />
              <Input label="Password Baru" type="password" error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register("newPassword")} />
              <Input label="Konfirmasi Password" type="password" error={passwordForm.formState.errors.confirmPassword?.message} {...passwordForm.register("confirmPassword")} />
              <Button type="submit" variant="secondary">Ganti Password</Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Pengaturan Sistem" description="Kontrol periode dan pesan pengingat tracer study." />
        <CardContent>
          <form className="space-y-4" onSubmit={settingsForm.handleSubmit(saveSettings)}>
            <Toggle
              label="Buka Pengisian Tracer Study"
              description="Jika ditutup, alumni tidak dapat mengirim data baru."
              checked={settingsForm.watch("tracer_study_open")}
              onChange={(checked) => settingsForm.setValue("tracer_study_open", checked)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Periode Tahun Mulai" type="number" error={settingsForm.formState.errors.periode_tahun_mulai?.message} {...settingsForm.register("periode_tahun_mulai")} />
              <Input label="Periode Tahun Akhir" type="number" error={settingsForm.formState.errors.periode_tahun_akhir?.message} {...settingsForm.register("periode_tahun_akhir")} />
            </div>
            <Textarea label="Pesan Pengingat" error={settingsForm.formState.errors.pesan_pengingat?.message} {...settingsForm.register("pesan_pengingat")} />
            <Toggle
              label="Auto Reminder"
              description="Aktifkan penjadwalan pengingat otomatis jika backend cron tersedia."
              checked={settingsForm.watch("auto_reminder")}
              onChange={(checked) => settingsForm.setValue("auto_reminder", checked)}
            />
            <Button type="submit" loading={settingsLoading}>Simpan Pengaturan</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
