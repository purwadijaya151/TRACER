"use client";

import Link from "next/link";
import { Menu as HeadlessMenu, MenuButton, MenuItem, MenuItems, Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Menu, Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { getNotificationStats } from "@/lib/actions/notifikasi.actions";
import { PAGE_TITLES } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function Header({
  adminName,
  adminPhoto,
  onMenuClick
}: {
  adminName?: string | null;
  adminPhoto?: string | null;
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const [query, setQuery] = useState("");
  const [stats, setStats] = useState<{ total: number; read: number; unread: number } | null>(null);

  useEffect(() => {
    void getNotificationStats().then((result) => {
      if (!result.error) setStats(result.data);
    });
  }, []);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/dashboard/alumni?search=${encodeURIComponent(trimmed)}` : "/dashboard/alumni");
  };

  const logout = async () => {
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 shadow-sm lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="focus-ring rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Buka sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-heading text-[22px] font-semibold leading-7 text-slate-950">{title}</h1>
          <p className="hidden text-sm leading-5 text-slate-600 sm:block">Panel Admin TracerStudy FT UNIHAZ</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <form className="relative hidden w-full max-w-xs md:block" onSubmit={submitSearch}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Cari data..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="focus-ring h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm"
          />
        </form>
        <Popover className="relative">
          <PopoverButton
            className="focus-ring relative rounded-md p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Notifikasi"
          >
            <Bell className="h-5 w-5" />
            {stats?.unread ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" /> : null}
          </PopoverButton>
          <PopoverPanel className="absolute right-0 z-40 mt-2 w-72 rounded-lg border border-slate-100 bg-white p-4 shadow-overlay">
            <p className="font-heading text-base font-semibold leading-6 text-slate-900">Ringkasan Notifikasi</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm leading-5 text-slate-700">
              <div className="rounded-md bg-navy-50 p-2"><p className="font-semibold text-navy">{stats?.total ?? 0}</p><p>Total</p></div>
              <div className="rounded-md bg-emerald-50 p-2"><p className="font-semibold text-emerald-700">{stats?.read ?? 0}</p><p>Dibaca</p></div>
              <div className="rounded-md bg-amber-50 p-2"><p className="font-semibold text-amber-700">{stats?.unread ?? 0}</p><p>Belum</p></div>
            </div>
            <Button asChild variant="secondary" className="mt-4 w-full">
              <Link href="/dashboard/notifikasi">Buka Notifikasi</Link>
            </Button>
          </PopoverPanel>
        </Popover>
        <HeadlessMenu as="div" className="relative border-l border-slate-100 pl-3">
          <MenuButton className="focus-ring flex items-center gap-2 rounded-md p-1 hover:bg-slate-100">
            <Avatar name={adminName} src={adminPhoto} size={34} />
            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-32 truncate text-sm font-semibold text-slate-900">{adminName ?? "Admin"}</p>
              <p className="text-sm leading-5 text-slate-600">Admin</p>
            </div>
          </MenuButton>
          <MenuItems className="absolute right-0 z-40 mt-2 w-48 rounded-lg border border-slate-100 bg-white p-1 shadow-overlay">
            <MenuItem>
              {({ focus }) => (
                <Link className={`block rounded-md px-3 py-2 text-sm ${focus ? "bg-navy-50 text-navy" : "text-slate-700"}`} href="/dashboard/pengaturan">
                  Pengaturan
                </Link>
              )}
            </MenuItem>
            <MenuItem>
              {({ focus }) => (
                <button
                  type="button"
                  onClick={logout}
                  className={`block w-full rounded-md px-3 py-2 text-left text-sm ${focus ? "bg-red-50 text-red-700" : "text-slate-700"}`}
                >
                  Keluar
                </button>
              )}
            </MenuItem>
          </MenuItems>
        </HeadlessMenu>
      </div>
    </header>
  );
}
