import { describe, expect, it } from "vitest";
import {
  getTracerCityDisplay,
  getTracerCompanyDisplay,
  getTracerMonthlyIncomeDisplay,
  getTracerProvinceDisplay,
  getTracerWaitTimeDisplay,
  getTracerWorkplaceLevelDisplay
} from "@/lib/tracer-study-display";
import type { TracerStudy } from "@/types";

function makeTracerStudy(overrides: Partial<TracerStudy> = {}): TracerStudy {
  return {
    id: "tracer-1",
    alumni_id: "alumni-1",
    questionnaire_version: "launch-v1",
    answers: {},
    status_kerja: "Bekerja",
    is_submitted: true,
    created_at: "2026-05-21T00:00:00.000Z",
    updated_at: "2026-05-21T00:00:00.000Z",
    ...overrides
  };
}

describe("tracer-study-display", () => {
  it("given launch answers when legacy gaji kosong then monthly income uses f505", () => {
    const row = makeTracerStudy({
      rentang_gaji: null,
      answers: { f505: "5000000" }
    });

    expect(getTracerMonthlyIncomeDisplay(row)).toBe("Rp 5.000.000");
  });

  it("given launch answers when legacy waktu tunggu kosong then wait time uses f502", () => {
    const row = makeTracerStudy({
      waktu_tunggu: null,
      answers: { f502: "4" }
    });

    expect(getTracerWaitTimeDisplay(row)).toBe("4 bulan");
  });

  it("given launch answers when company and province exist then display uses answer fields", () => {
    const row = makeTracerStudy({
      nama_perusahaan: null,
      provinsi_kerja: null,
      answers: {
        f5b: "PT Maju Jaya",
        f5a1: "Bengkulu"
      }
    });

    expect(getTracerCompanyDisplay(row)).toBe("PT Maju Jaya");
    expect(getTracerProvinceDisplay(row)).toBe("Bengkulu");
  });

  it("given launch answers when location and workplace level exist then display uses answer fields", () => {
    const row = makeTracerStudy({
      answers: {
        f5a2: "Kota Bengkulu",
        f5d: "Nasional"
      }
    });

    expect(getTracerCityDisplay(row)).toBe("Kota Bengkulu");
    expect(getTracerWorkplaceLevelDisplay(row)).toBe("Nasional");
  });
});
