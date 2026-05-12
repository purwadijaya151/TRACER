import { describe, expect, it } from "vitest";
import { buildTracerSummary } from "@/lib/tracer-summary";

describe("tracer summary helpers", () => {
  it("calculates averages and dominant values from summary rows", () => {
    const result = buildTracerSummary([
      {
        kesesuaian_bidang: 4,
        rentang_gaji: "Rp 2.000.000 - Rp 5.000.000"
      },
      {
        kesesuaian_bidang: 2,
        rentang_gaji: "Rp 2.000.000 - Rp 5.000.000"
      },
      {
        kesesuaian_bidang: null,
        rentang_gaji: null
      }
    ]);

    expect(result).toEqual({
      avg_kesesuaian: 3,
      modal_gaji: "Rp 2.000.000 - Rp 5.000.000"
    });
  });
});
