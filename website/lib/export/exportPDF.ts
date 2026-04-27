import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, getTracerRecord, responseStatus } from "@/lib/utils";
import type { Alumni, ReportData, TracerStudy } from "@/types";

export function mapTracerRowsForPdf(rows: TracerStudy[]) {
  return rows.map((row, index) => {
    const alumni = row.alumni;
    return [
      index + 1,
      alumni?.nim ?? "-",
      alumni?.nama_lengkap ?? "-",
      alumni?.prodi ?? "-",
      alumni?.tahun_lulus ?? "-",
      row.status_kerja,
      row.nama_perusahaan ?? "-",
      row.jabatan ?? "-",
      row.rentang_gaji ?? "-",
      formatDate(row.submitted_at)
    ];
  });
}

export function mapAlumniRowsForPdf(rows: Alumni[]) {
  return rows.map((row, index) => [
    index + 1,
    row.nim,
    row.nama_lengkap,
    row.prodi,
    row.tahun_masuk,
    row.tahun_lulus,
    row.ipk ?? "-",
    row.email ?? "-",
    responseStatus(row)
  ]);
}

function normalizeReportData(input: TracerStudy[] | ReportData): ReportData {
  return Array.isArray(input) ? { type: "tracer", rows: input } : input;
}

function getColumns(data: ReportData) {
  if (data.type === "alumni") {
    return {
      head: [["No", "NPM", "Nama", "Prodi", "Masuk", "Lulus", "IPK", "Email", "Status"]],
      body: mapAlumniRowsForPdf(data.rows)
    };
  }

  if (data.type === "pekerjaan") {
    return {
      head: [["No", "NPM", "Nama", "Prodi", "Status", "Perusahaan", "Bidang", "Jabatan", "Gaji", "Waktu Tunggu"]],
      body: data.rows.map((row, index) => [
        index + 1,
        row.alumni?.nim ?? "-",
        row.alumni?.nama_lengkap ?? "-",
        row.alumni?.prodi ?? "-",
        row.status_kerja,
        row.nama_perusahaan ?? "-",
        row.bidang_pekerjaan ?? "-",
        row.jabatan ?? "-",
        row.rentang_gaji ?? "-",
        row.waktu_tunggu ?? "-"
      ])
    };
  }

  if (data.type === "kompetensi") {
    return {
      head: [["No", "Nama", "Prodi", "Kesesuaian", "Hard Skill", "Soft Skill", "Bahasa", "IT", "Kepemimpinan"]],
      body: data.rows.map((row, index) => [
        index + 1,
        row.alumni?.nama_lengkap ?? "-",
        row.alumni?.prodi ?? "-",
        row.kesesuaian_bidang ?? "-",
        row.nilai_hard_skill ?? "-",
        row.nilai_soft_skill ?? "-",
        row.nilai_bahasa_asing ?? "-",
        row.nilai_it ?? "-",
        row.nilai_kepemimpinan ?? "-"
      ])
    };
  }

  return {
    head: [[
      "No",
      "NPM",
      "Nama",
      "Prodi",
      "Lulus",
      "Status",
      "Perusahaan",
      "Jabatan",
      "Gaji",
      "Submit"
    ]],
    body: mapTracerRowsForPdf(data.rows)
  };
}

export function exportPDF(input: TracerStudy[] | ReportData, title = "Laporan Tracer Study", filters: unknown = {}) {
  const data = normalizeReportData(input);
  const doc = new jsPDF({ orientation: "landscape" });
  const generated = formatDate(new Date().toISOString(), "dd MMM yyyy HH:mm");
  const table = getColumns(data);

  doc.setFillColor("#1A2B5F");
  doc.rect(0, 0, 297, 24, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(9);
  doc.text("TracerStudy FT UNIHAZ", 250, 15, { align: "right" });

  doc.setTextColor("#151c27");
  doc.setFontSize(9);
  doc.text(`Dibuat: ${generated}`, 14, 33);
  doc.text(`Filter: ${JSON.stringify(filters)}`, 14, 39);

  autoTable(doc, {
    startY: 46,
    head: table.head,
    body: table.body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: "#1A2B5F", textColor: "#FFFFFF" },
    alternateRowStyles: { fillColor: "#F8F9FC" },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor("#757680");
      doc.text(`Halaman ${doc.getCurrentPageInfo().pageNumber} dari ${pageCount}`, 282, 200, {
        align: "right"
      });
    }
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}
