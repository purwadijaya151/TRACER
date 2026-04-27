import { describe, expect, it } from "vitest";
import { mapTracerRowsForPdf } from "@/lib/export/exportPDF";
import type { TracerStudy } from "@/types";

describe("mapTracerRowsForPdf", () => {
  it("maps tracer rows to printable PDF columns", () => {
    const rows = [
      {
        id: "ts-1",
        alumni_id: "alumni-1",
        status_kerja: "Bekerja",
        nama_perusahaan: "PT Teknologi",
        jabatan: "Engineer",
        rentang_gaji: "Rp 5.000.000 - Rp 10.000.000",
        is_submitted: true,
        submitted_at: "2026-01-01T00:00:00.000Z",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        alumni: {
          nim: "2026001",
          nama_lengkap: "Admin Test",
          prodi: "Teknik Informatika",
          tahun_lulus: 2026,
          ipk: 3.7,
          email: "admin@test.local",
          no_hp: "0812"
        }
      }
    ] as TracerStudy[];

    expect(mapTracerRowsForPdf(rows)[0].slice(0, 9)).toEqual([
      1,
      "2026001",
      "Admin Test",
      "Teknik Informatika",
      2026,
      "Bekerja",
      "PT Teknologi",
      "Engineer",
      "Rp 5.000.000 - Rp 10.000.000"
    ]);
  });
});
