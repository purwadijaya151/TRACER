import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("alumni")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  redirect(profile?.is_admin ? "/dashboard" : "/login?error=admin");
}
