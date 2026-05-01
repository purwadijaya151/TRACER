import { describe, expect, it } from "vitest";
import { alumniSchema, loginSchema } from "@/lib/validation";

describe("loginSchema", () => {
  it("accepts the original 18 digit NPP format", () => {
    const result = loginSchema.safeParse({
      npp: "198001012024011001",
      password: "secret123"
    });

    expect(result.success).toBe(true);
  });

  it.each(["19800101202401100", "1980010120240110011", "19800101202401100A"])(
    "rejects invalid NPP value %s",
    (npp) => {
      const result = loginSchema.safeParse({
        npp,
        password: "secret123"
      });

      expect(result.success).toBe(false);
    }
  );
});

describe("alumniSchema", () => {
  it("accepts an Android-compatible numeric NPM", () => {
    const result = alumniSchema.safeParse({
      nim: "202600001",
      nama_lengkap: "QA Dummy Alumni",
      prodi: "Teknik Informatika",
      tahun_masuk: 2021,
      tahun_lulus: 2025,
      email: "qa.contact@example.com",
      password: "secret123"
    });

    expect(result.success).toBe(true);
  });

  it("rejects alphanumeric QA codes that cannot be used by Android login", () => {
    const result = alumniSchema.safeParse({
      nim: "QAHV9LC601",
      nama_lengkap: "QA Visual Alumni",
      prodi: "Teknik Informatika",
      tahun_masuk: 2021,
      tahun_lulus: 2025,
      email: "qa.contact@example.com",
      password: "secret123"
    });

    expect(result.success).toBe(false);
  });
});
