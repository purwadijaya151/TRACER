import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-50 p-6">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-soft">
        <p className="font-heading text-5xl font-semibold text-navy">404</p>
        <h1 className="mt-4 font-heading text-2xl font-semibold">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Halaman yang Anda cari tidak tersedia di panel admin.
        </p>
        <Button asChild className="mt-6">
          <Link href="/dashboard">Kembali ke Dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
