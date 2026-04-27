"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyTableRow, Table, Td, Th } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatDateTime } from "@/lib/utils";
import type { NotificationBroadcast } from "@/types";

export function NotifikasiTable({
  rows,
  loading,
  onDelete
}: {
  rows: NotificationBroadcast[];
  loading: boolean;
  onDelete: (row: NotificationBroadcast) => void;
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Judul</Th>
          <Th>Pesan</Th>
          <Th>Target</Th>
          <Th>Waktu</Th>
          <Th>Dibaca</Th>
          <Th>Aksi</Th>
        </tr>
      </thead>
      <tbody>
        {loading ? <TableSkeleton rows={5} columns={6} /> : null}
        {!loading && rows.length === 0 ? (
          <EmptyTableRow colSpan={6} title="Belum ada broadcast" description="Broadcast yang dikirim akan tercatat di sini." />
        ) : null}
        {!loading && rows.map((row, index) => (
          <tr key={row.id} className={index % 2 === 0 ? "bg-white hover:bg-navy-50" : "bg-[#F8F9FC] hover:bg-navy-50"}>
            <Td className="font-semibold text-slate-900">{row.title}</Td>
            <Td><span className="line-clamp-2 max-w-sm">{row.body}</span></Td>
            <Td><Badge variant="info">{row.target_label}</Badge></Td>
            <Td>{formatDateTime(row.created_at)}</Td>
            <Td>{row.read_count}/{row.total_recipients}</Td>
            <Td>
              <Button variant="ghost" size="sm" onClick={() => onDelete(row)} aria-label="Hapus notifikasi">
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
