import * as XLSX from "xlsx-js-style";
import { getTracerRecord, responseStatus } from "@/lib/utils";
import type { Alumni, ReportData, TracerStudy } from "@/types";

export function mapTracerRowsForExcel(rows: TracerStudy[]) {
  return rows.map((row, index) => ({
    No: index + 1,
    NPM: row.alumni?.nim ?? "-",
    Nama: row.alumni?.nama_lengkap ?? "-",
    Prodi: row.alumni?.prodi ?? "-",
    "Tahun Lulus": row.alumni?.tahun_lulus ?? "-",
    IPK: row.alumni?.ipk ?? "-",
    "Status Kerja": row.status_kerja,
    Perusahaan: row.nama_perusahaan ?? "-",
    "Bidang Pekerjaan": row.bidang_pekerjaan ?? "-",
    Jabatan: row.jabatan ?? "-",
    "Rentang Gaji": row.rentang_gaji ?? "-",
    "Waktu Tunggu": row.waktu_tunggu ?? "-",
    "Kesesuaian Bidang": row.kesesuaian_bidang ?? "-",
    "Hard Skill": row.nilai_hard_skill ?? "-",
    "Soft Skill": row.nilai_soft_skill ?? "-",
    "Bahasa Asing": row.nilai_bahasa_asing ?? "-",
    IT: row.nilai_it ?? "-",
    Kepemimpinan: row.nilai_kepemimpinan ?? "-"
  }));
}

export function mapAlumniRowsForExcel(rows: Alumni[]) {
  return rows.map((row, index) => ({
    No: index + 1,
    NPM: row.nim,
    Nama: row.nama_lengkap,
    Prodi: row.prodi,
    "Tahun Masuk": row.tahun_masuk,
    "Tahun Lulus": row.tahun_lulus,
    IPK: row.ipk ?? "-",
    Email: row.email ?? "-",
    "No HP": row.no_hp ?? "-",
    Status: responseStatus(row)
  }));
}

function autoFit(ws: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });
  const widths = data.reduce<number[]>((acc, row) => {
    row.forEach((cell, index) => {
      acc[index] = Math.max(acc[index] ?? 10, String(cell ?? "").length + 2);
    });
    return acc;
  }, []);
  ws["!cols"] = widths.map((wch) => ({ wch: Math.min(Math.max(wch, 10), 36) }));
}

function styleSheet(ws: XLSX.WorkSheet) {
  if (!ws["!ref"]) return;
  const range = XLSX.utils.decode_range(ws["!ref"]);
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const address = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = ws[address];
      if (!cell) continue;
      cell.s = row === 0
        ? {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1A2B5F" } },
            alignment: { vertical: "center" }
          }
        : {
            fill: { fgColor: { rgb: row % 2 === 0 ? "F8F9FC" : "FFFFFF" } },
            alignment: { vertical: "center" }
          };
    }
  }
}

function appendSheet(workbook: XLSX.WorkBook, rows: unknown[], name: string) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  autoFit(sheet);
  styleSheet(sheet);
  XLSX.utils.book_append_sheet(workbook, sheet, name);
}

function normalizeReportData(input: TracerStudy[] | ReportData): ReportData {
  return Array.isArray(input) ? { type: "tracer", rows: input } : input;
}

export function buildWorkbook(input: TracerStudy[] | ReportData) {
  const data = normalizeReportData(input);
  const workbook = XLSX.utils.book_new();

  if (data.type === "alumni") {
    appendSheet(workbook, mapAlumniRowsForExcel(data.rows), "Data Alumni");
    appendSheet(
      workbook,
      Object.entries(
        data.rows.reduce<Record<string, number>>((acc, row) => {
          acc[row.prodi] = (acc[row.prodi] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([Prodi, Total]) => ({ Prodi, Total })),
      "Statistik Prodi"
    );
    appendSheet(
      workbook,
      Object.entries(
        data.rows.reduce<Record<string, number>>((acc, row) => {
          const key = responseStatus(row);
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([Status, Total]) => ({ Status, Total })),
      "Status Pengisian"
    );
    return workbook;
  }

  const rows = data.rows;
  const mainRows = data.type === "pekerjaan"
    ? rows.map((row, index) => ({
        No: index + 1,
        NPM: row.alumni?.nim ?? "-",
        Nama: row.alumni?.nama_lengkap ?? "-",
        Prodi: row.alumni?.prodi ?? "-",
        "Status Kerja": row.status_kerja,
        Perusahaan: row.nama_perusahaan ?? "-",
        "Bidang Pekerjaan": row.bidang_pekerjaan ?? "-",
        Jabatan: row.jabatan ?? "-",
        "Rentang Gaji": row.rentang_gaji ?? "-",
        "Waktu Tunggu": row.waktu_tunggu ?? "-"
      }))
    : data.type === "kompetensi"
      ? rows.map((row, index) => ({
          No: index + 1,
          Nama: row.alumni?.nama_lengkap ?? "-",
          Prodi: row.alumni?.prodi ?? "-",
          "Kesesuaian Bidang": row.kesesuaian_bidang ?? "-",
          "Hard Skill": row.nilai_hard_skill ?? "-",
          "Soft Skill": row.nilai_soft_skill ?? "-",
          "Bahasa Asing": row.nilai_bahasa_asing ?? "-",
          IT: row.nilai_it ?? "-",
          Kepemimpinan: row.nilai_kepemimpinan ?? "-"
        }))
      : mapTracerRowsForExcel(rows);

  appendSheet(workbook, mainRows, "Data Utama");

  appendSheet(
    workbook,
    Object.entries(
      rows.reduce<Record<string, number>>((acc, row) => {
        const key = row.alumni?.prodi ?? "Tidak diketahui";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([Prodi, Total]) => ({ Prodi, Total })),
    "Statistik Prodi"
  );

  appendSheet(
    workbook,
    Object.entries(
      rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.status_kerja] = (acc[row.status_kerja] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([Status, Total]) => ({ Status, Total })),
    "Status Pekerjaan"
  );

  appendSheet(
    workbook,
    rows.map((row) => ({
      Nama: row.alumni?.nama_lengkap ?? "-",
      "Hard Skill": row.nilai_hard_skill ?? "-",
      "Soft Skill": row.nilai_soft_skill ?? "-",
      "Bahasa Asing": row.nilai_bahasa_asing ?? "-",
      IT: row.nilai_it ?? "-",
      Kepemimpinan: row.nilai_kepemimpinan ?? "-"
    })),
    "Kompetensi"
  );

  return workbook;
}

export function exportExcel(input: TracerStudy[] | ReportData, title = "laporan-tracer-study") {
  XLSX.writeFile(buildWorkbook(input), `${title}.xlsx`);
}
