"use client";

import { Button } from "@/components/ui/Button";

export default function ErrorPage({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-50 p-6">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-soft">
        <h1 className="font-heading text-2xl font-semibold text-navy">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Gagal memuat halaman. Silakan coba lagi.
        </p>
        <Button className="mt-6" onClick={reset}>
          Muat Ulang
        </Button>
      </div>
    </main>
  );
}
