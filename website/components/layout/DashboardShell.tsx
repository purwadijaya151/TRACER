"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

export function DashboardShell({
  children,
  adminName,
  adminPhoto
}: {
  children: React.ReactNode;
  adminName?: string | null;
  adminPhoto?: string | null;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy-50">
      <div className="hidden fixed inset-y-0 left-0 z-40 w-[240px] lg:block">
        <Sidebar adminName={adminName} adminPhoto={adminPhoto} />
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/40 transition lg:hidden",
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[60] w-[240px] transform transition lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-md p-2 text-white/80 hover:bg-white/10"
          onClick={() => setSidebarOpen(false)}
          aria-label="Tutup sidebar"
        >
          <X className="h-4 w-4" />
        </button>
        <Sidebar adminName={adminName} adminPhoto={adminPhoto} onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="lg:pl-[240px]">
        <Header adminName={adminName} adminPhoto={adminPhoto} onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-h-[calc(100vh-64px)] p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
