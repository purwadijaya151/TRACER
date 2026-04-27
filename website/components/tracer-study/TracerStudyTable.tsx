"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable
} from "@tanstack/react-table";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { EmptyTableRow, Table, Td, Th } from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/utils";
import type { TracerStudy } from "@/types";

const columnHelper = createColumnHelper<TracerStudy>();

export function TracerStudyTable({
  rows,
  loading,
  onDetail
}: {
  rows: TracerStudy[];
  loading: boolean;
  onDetail: (row: TracerStudy) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = [
    columnHelper.accessor((row) => row.alumni?.nim ?? "-", { id: "nim", header: "NPM" }),
    columnHelper.accessor((row) => row.alumni?.nama_lengkap ?? "-", {
      id: "nama",
      header: "Nama",
      cell: ({ getValue }) => <span className="font-semibold text-slate-900">{getValue()}</span>
    }),
    columnHelper.accessor((row) => row.alumni?.prodi ?? "-", { id: "prodi", header: "Prodi" }),
    columnHelper.accessor((row) => row.alumni?.tahun_lulus ?? 0, { id: "tahun_lulus", header: "Lulus" }),
    columnHelper.accessor("status_kerja", {
      header: "Status Kerja",
      cell: ({ getValue }) => <Badge variant="info">{getValue()}</Badge>
    }),
    columnHelper.accessor("rentang_gaji", { header: "Gaji", cell: ({ getValue }) => getValue() ?? "-" }),
    columnHelper.accessor("kesesuaian_bidang", { header: "Kesesuaian", cell: ({ getValue }) => getValue() ?? "-" }),
    columnHelper.accessor("submitted_at", { header: "Submit", cell: ({ getValue }) => formatDate(getValue()) })
  ];

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <Table>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <Th key={header.id}>
                <button
                  type="button"
                  className="flex items-center gap-1"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc" ? "↑" : header.column.getIsSorted() === "desc" ? "↓" : ""}
                </button>
              </Th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {loading ? <TableSkeleton rows={5} columns={8} /> : null}
        {!loading && rows.length === 0 ? (
          <EmptyTableRow colSpan={8} title="Belum ada respons" description="Data tracer study akan muncul setelah alumni submit." />
        ) : null}
        {!loading &&
          table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={`${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} cursor-pointer hover:bg-navy-50`}
              onClick={() => onDetail(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <Td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Td>
              ))}
            </tr>
          ))}
      </tbody>
    </Table>
  );
}
