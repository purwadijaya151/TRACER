"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[tracer-admin]", {
      scope: "dashboard.error",
      message: error.message,
      digest: error.digest
    });
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-soft">
        <h2 className="font-heading text-xl font-semibold leading-7 text-navy">Gagal memuat data</h2>
        <p className="mt-2 text-[15px] leading-6 text-slate-600">Silakan refresh halaman atau coba lagi.</p>
        <Button className="mt-6" onClick={reset}>Coba Lagi</Button>
      </div>
    </div>
  );
}
