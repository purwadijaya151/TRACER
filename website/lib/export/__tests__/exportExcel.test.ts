import { describe, expect, it } from "vitest";
import { buildWorkbook } from "@/lib/export/exportExcel";
import type { TracerStudy } from "@/types";

describe("buildWorkbook", () => {
  it("creates the required Excel sheets", () => {
    const workbook = buildWorkbook([
      {
        id: "ts-1",
        alumni_id: "alumni-1",
        status_kerja: "Bekerja",
        is_submitted: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
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
    ] as TracerStudy[]);

    expect(workbook.SheetNames).toEqual([
      "Data Utama",
      "Statistik Prodi",
      "Status Pekerjaan",
      "Kompetensi"
    ]);
    expect(workbook.Sheets["Data Utama"].A1.s).toMatchObject({
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1A2B5F" } }
    });
  });

  it("creates alumni-specific sheets", () => {
    const workbook = buildWorkbook({
      type: "alumni",
      rows: [
        {
          id: "alumni-1",
          nim: "2026001",
          nama_lengkap: "Alumni Test",
          prodi: "Teknik Informatika",
          tahun_masuk: 2022,
          tahun_lulus: 2026,
          is_admin: false,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          tracer_study: []
        }
      ]
    });

    expect(workbook.SheetNames).toEqual(["Data Alumni", "Statistik Prodi", "Status Pengisian"]);
  });
});
