"use client";

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Edit, Eye, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyTableRow, Table, Td, Th } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { getTracerRecord } from "@/lib/utils";
import type { Alumni } from "@/types";

const columnHelper = createColumnHelper<Alumni>();

export function AlumniTable({
  rows,
  loading,
  selectedIds,
  onSelectedIdsChange,
  onDetail,
  onEdit,
  onDelete,
  rowOffset = 0
}: {
  rows: Alumni[];
  loading: boolean;
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onDetail: (alumni: Alumni) => void;
  onEdit: (alumni: Alumni) => void;
  onDelete: (alumni: Alumni) => void;
  rowOffset?: number;
}) {
  const columns = [
    columnHelper.display({
      id: "select",
      header: () => (
        <input
          type="checkbox"
          aria-label="Pilih semua"
          checked={rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))}
          onChange={(event) =>
            onSelectedIdsChange(event.target.checked ? rows.map((row) => row.id) : [])
          }
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label={`Pilih ${row.original.nama_lengkap}`}
          checked={selectedIds.includes(row.original.id)}
          onChange={(event) => {
            if (event.target.checked) onSelectedIdsChange([...selectedIds, row.original.id]);
            else onSelectedIdsChange(selectedIds.filter((id) => id !== row.original.id));
          }}
          onClick={(event) => event.stopPropagation()}
        />
      )
    }),
    columnHelper.display({
      id: "no",
      header: "No",
      cell: ({ row }) => rowOffset + row.index + 1
    }),
    columnHelper.display({
      id: "avatar",
      header: "Avatar",
      cell: ({ row }) => <Avatar name={row.original.nama_lengkap} src={row.original.foto_url} />
    }),
    columnHelper.accessor("nim", { header: "NPM" }),
    columnHelper.accessor("nama_lengkap", {
      header: "Nama",
      cell: ({ getValue }) => <span className="font-semibold text-slate-900">{getValue()}</span>
    }),
    columnHelper.accessor("prodi", {
      header: "Prodi",
      cell: ({ getValue }) => <Badge variant="info">{getValue()}</Badge>
    }),
    columnHelper.accessor("tahun_lulus", { header: "Lulus" }),
    columnHelper.display({
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const submitted = getTracerRecord(row.original)?.is_submitted;
        return (
          <Badge variant={submitted ? "success" : "warning"}>
            {submitted ? "Sudah Mengisi" : "Belum Mengisi"}
          </Badge>
        );
      }
    }),
    columnHelper.display({
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => onDetail(row.original)} aria-label="Detail">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)} aria-label="Edit">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(row.original)} aria-label="Hapus">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )
    })
  ];

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <Table className="min-w-[960px]">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <Th key={header.id} className={alumniColumnClass(header.column.id)}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </Th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {loading ? <TableSkeleton rows={5} columns={9} /> : null}
        {!loading && rows.length === 0 ? (
          <EmptyTableRow colSpan={9} title="Belum ada data alumni" description="Gunakan tombol tambah untuk membuat data alumni baru." />
        ) : null}
        {!loading &&
          table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={`${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} cursor-pointer hover:bg-navy-50`}
              onClick={() => onDetail(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <Td key={cell.id} className={alumniColumnClass(cell.column.id)}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>
              ))}
            </tr>
          ))}
      </tbody>
    </Table>
  );
}

function alumniColumnClass(columnId: string) {
  const classes: Record<string, string> = {
    select: "w-12",
    no: "w-14 whitespace-nowrap",
    avatar: "w-20",
    nim: "w-32 whitespace-nowrap",
    nama_lengkap: "min-w-[160px]",
    prodi: "w-44",
    tahun_lulus: "w-20 whitespace-nowrap",
    status: "w-36",
    actions: "w-28 whitespace-nowrap"
  };

  return classes[columnId];
}
