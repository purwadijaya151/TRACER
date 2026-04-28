"use client";

import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { getTracerRecord } from "@/lib/utils";
import type { Alumni } from "@/types";

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium leading-5 text-slate-600">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-900">{value || "-"}</p>
    </div>
  );
}

export function AlumniDetailModal({
  alumni,
  open,
  onClose
}: {
  alumni: Alumni | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!alumni) return null;
  const tracer = getTracerRecord(alumni);

  return (
    <Modal open={open} onClose={onClose} title="Detail Alumni" size="lg">
      <div className="grid gap-4 sm:grid-cols-2">
        <DetailRow label="NPM" value={alumni.nim} />
        <DetailRow label="Nama" value={alumni.nama_lengkap} />
        <DetailRow label="Prodi" value={<Badge variant="info">{alumni.prodi}</Badge>} />
        <DetailRow label="Tahun Masuk" value={alumni.tahun_masuk} />
        <DetailRow label="Tahun Lulus" value={alumni.tahun_lulus} />
        <DetailRow label="IPK" value={alumni.ipk ?? "-"} />
        <DetailRow label="Email" value={alumni.email} />
        <DetailRow label="No HP" value={alumni.no_hp} />
        <DetailRow label="Tempat/Tanggal Lahir" value={`${alumni.tempat_lahir ?? "-"} / ${alumni.tanggal_lahir ?? "-"}`} />
        <DetailRow label="Status Tracer" value={<Badge variant={tracer?.is_submitted ? "success" : "warning"}>{tracer?.is_submitted ? "Sudah Mengisi" : "Belum Mengisi"}</Badge>} />
        <div className="sm:col-span-2">
          <DetailRow label="Alamat" value={alumni.alamat} />
        </div>
      </div>
    </Modal>
  );
}
