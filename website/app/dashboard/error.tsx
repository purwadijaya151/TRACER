"use client";

import { Button } from "@/components/ui/Button";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-soft">
        <h2 className="font-heading text-xl font-semibold text-navy">Gagal memuat data</h2>
        <p className="mt-2 text-sm text-slate-600">Silakan refresh halaman atau coba lagi.</p>
        <Button className="mt-6" onClick={reset}>Coba Lagi</Button>
      </div>
    </div>
  );
}
