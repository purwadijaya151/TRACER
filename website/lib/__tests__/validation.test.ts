import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/validation";

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
