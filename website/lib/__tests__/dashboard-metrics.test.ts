import { describe, expect, it } from "vitest";
import { buildResponseByProdi, buildStatusKerjaDistribution } from "@/lib/dashboard-metrics";

describe("dashboard metric helpers", () => {
  it("groups alumni totals and submissions per prodi", () => {
    const result = buildResponseByProdi(
      [
        { prodi: "Teknik Informatika" },
        { prodi: "Teknik Informatika" },
        { prodi: "Teknik Sipil" }
      ],
      [
        { status_kerja: "Bekerja", alumni: { prodi: "Teknik Informatika" } },
        { status_kerja: "Wirausaha", alumni: [{ prodi: "Teknik Sipil" }] }
      ]
    );

    expect(result).toEqual([
      { prodi: "Teknik Mesin", total: 0, mengisi: 0 },
      { prodi: "Teknik Informatika", total: 2, mengisi: 1 },
      { prodi: "Teknik Sipil", total: 1, mengisi: 1 }
    ]);
  });

  it("groups submission totals by work status", () => {
    const result = buildStatusKerjaDistribution([
      { status_kerja: "Bekerja", alumni: { prodi: "Teknik Informatika" } },
      { status_kerja: "Bekerja", alumni: { prodi: "Teknik Sipil" } },
      { status_kerja: "Belum Bekerja", alumni: { prodi: "Teknik Mesin" } }
    ]);

    expect(result).toEqual([
      { status: "Bekerja", count: 2 },
      { status: "Wirausaha", count: 0 },
      { status: "Melanjutkan Studi", count: 0 },
      { status: "Belum Bekerja", count: 1 }
    ]);
  });
});
