import { describe, expect, it } from "vitest";
import { buildTracerSummary } from "@/lib/tracer-summary";

describe("tracer summary helpers", () => {
  it("calculates averages and dominant values from summary rows", () => {
    const result = buildTracerSummary([
      {
        kesesuaian_bidang: 4,
        waktu_tunggu: "Kurang dari 3 bulan",
        rentang_gaji: "Rp 2.000.000 - Rp 5.000.000",
        alumni: { ipk: 3.5 }
      },
      {
        kesesuaian_bidang: 2,
        waktu_tunggu: "Kurang dari 3 bulan",
        rentang_gaji: "Rp 2.000.000 - Rp 5.000.000",
        alumni: [{ ipk: 3.1 }]
      },
      {
        kesesuaian_bidang: null,
        waktu_tunggu: "3 - 6 bulan",
        rentang_gaji: null,
        alumni: null
      }
    ]);

    expect(result).toEqual({
      avg_ipk: 3.3,
      avg_kesesuaian: 3,
      avg_waktu_tunggu: "Kurang dari 3 bulan",
      modal_gaji: "Rp 2.000.000 - Rp 5.000.000"
    });
  });
});
