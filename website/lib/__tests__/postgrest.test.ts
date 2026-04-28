import { describe, expect, it } from "vitest";
import { buildIlikeOrFilter, quotePostgrestValue } from "@/lib/postgrest";

describe("postgrest filter helpers", () => {
  it("quotes values that can break raw or() grammar", () => {
    expect(quotePostgrestValue('%Teknik, "Sipil" (A)%')).toBe('"%Teknik, \\"Sipil\\" (A)%"');
  });

  it("builds an ilike or filter with a single escaped search pattern", () => {
    expect(buildIlikeOrFilter(["nim", "nama_lengkap"], 'A, "B"')).toBe(
      'nim.ilike."%A, \\"B\\"%",nama_lengkap.ilike."%A, \\"B\\"%"'
    );
  });
});
