import { describe, expect, it } from "vitest";
import { buildNimLookupCandidates, isValidNim, nimToInstitutionEmail, normalizeNim } from "@/lib/alumni-nim";

describe("alumni NPM helpers", () => {
  it("normalizes 10 digit NPM to the dotted institutional format", () => {
    expect(normalizeNim("2019010023")).toBe("2019.01.0023");
    expect(nimToInstitutionEmail("2019010023")).toBe("2019.01.0023@ft.unihaz.ac.id");
  });

  it("keeps non 10 digit numeric NPM values stable", () => {
    expect(normalizeNim("202600001")).toBe("202600001");
    expect(nimToInstitutionEmail("202600001")).toBe("202600001@ft.unihaz.ac.id");
  });

  it("builds lookup candidates for dotted and compact input", () => {
    expect(buildNimLookupCandidates("2019010023")).toEqual(["2019.01.0023", "2019010023"]);
    expect(buildNimLookupCandidates("2019.01.0023")).toEqual(["2019.01.0023", "2019010023"]);
  });

  it("rejects values without numeric NPM digits", () => {
    expect(isValidNim(".....")).toBe(false);
    expect(isValidNim("QAHV9LC601")).toBe(false);
  });
});
