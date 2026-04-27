import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("alumni")
    .select("nama_lengkap,foto_url,is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/login?error=admin");

  return (
    <DashboardShell adminName={profile.nama_lengkap} adminPhoto={profile.foto_url}>
      {children}
    </DashboardShell>
  );
}
