"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  ClipboardList,
  Home,
  LogOut,
  Settings,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/alumni", label: "Data Alumni", icon: Users },
  { href: "/dashboard/tracer-study", label: "Tracer Study", icon: ClipboardList },
  { href: "/dashboard/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/dashboard/laporan", label: "Laporan", icon: BarChart3 },
  { href: "/dashboard/pengaturan", label: "Pengaturan", icon: Settings }
];

export function Sidebar({
  adminName,
  adminPhoto,
  onNavigate
}: {
  adminName?: string | null;
  adminPhoto?: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await createSupabaseBrowserClient().auth.signOut();
    toast.success("Berhasil keluar");
    router.replace("/login");
  };

  return (
    <aside className="flex h-full flex-col bg-navy text-white">
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
          <span className="font-heading text-sm font-bold">FT</span>
        </div>
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold leading-tight">TracerStudy</p>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">FT UNIHAZ</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 text-sm font-semibold transition",
                active
                  ? "border-gold bg-white/10 text-gold"
                  : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <Avatar name={adminName} src={adminPhoto} size={36} className="bg-white/15 text-white" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{adminName ?? "Admin FT UNIHAZ"}</p>
            <p className="text-xs text-white/60">Administrator</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-slate-200 hover:bg-white/10 hover:text-white" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </aside>
  );
}
