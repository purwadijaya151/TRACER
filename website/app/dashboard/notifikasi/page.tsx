"use client";

import { useMemo, useState } from "react";
import { Bell, MailCheck, MailOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { KirimNotifikasiModal } from "@/components/notifikasi/KirimNotifikasiModal";
import { NotifikasiTable } from "@/components/notifikasi/NotifikasiTable";
import { DeleteConfirmModal } from "@/components/alumni/DeleteConfirmModal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { deleteNotifikasi } from "@/lib/actions/notifikasi.actions";
import { useNotifikasi } from "@/lib/hooks/useNotifikasi";
import type { NotificationBroadcast, NotificationFilters } from "@/types";

const pageSize = 10;

export default function NotifikasiPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<NotificationBroadcast | null>(null);
  const filters = useMemo<NotificationFilters>(() => ({ search }), [search]);
  const { data, stats, loading, refresh } = useNotifikasi(filters, page, pageSize);

  const confirmDelete = async () => {
    if (!deleting) return;
    const result = await deleteNotifikasi(deleting.id);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Notifikasi dihapus");
      setDeleting(null);
      await refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Total Terkirim" value={stats?.total ?? 0} description="Semua pesan ke alumni" icon={Bell} />
        <MetricCard title="Dibaca" value={stats?.read ?? 0} description="Alumni sudah membuka" icon={MailOpen} />
        <MetricCard title="Belum Dibaca" value={stats?.unread ?? 0} description="Masih perlu follow-up" icon={MailCheck} />
      </div>

      <Card>
        <CardHeader
          title="Manajemen Notifikasi"
          description="Kirim broadcast dan lihat riwayat pesan."
          action={<Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4" /> Kirim Notifikasi</Button>}
        />
        <CardContent className="space-y-4">
          <Input placeholder="Cari judul, isi, atau target..." value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          <NotifikasiTable rows={data?.rows ?? []} loading={loading} onDelete={setDeleting} />
        </CardContent>
        <Pagination page={page} pageSize={pageSize} total={data?.total ?? 0} onPageChange={setPage} />
      </Card>

      <KirimNotifikasiModal open={modalOpen} onClose={() => setModalOpen(false)} onSent={refresh} />
      <DeleteConfirmModal
        open={Boolean(deleting)}
        title="Hapus Broadcast"
        description={`Broadcast "${deleting?.title ?? ""}" dan notifikasi penerimanya akan dihapus.`}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
