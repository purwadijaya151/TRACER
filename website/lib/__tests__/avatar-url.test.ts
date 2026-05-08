import { describe, expect, it } from "vitest";
import { buildAvatarUrl } from "@/lib/avatar-url";

describe("buildAvatarUrl", () => {
  it("returns null when source is missing", () => {
    expect(buildAvatarUrl(null, "2026-05-08T21:00:00Z")).toBeNull();
  });

  it("returns original source when cache key is missing", () => {
    expect(buildAvatarUrl("https://example.com/avatar.png", null)).toBe("https://example.com/avatar.png");
  });

  it("appends cache version for absolute urls", () => {
    expect(buildAvatarUrl("https://example.com/avatar.png", "stamp-1")).toBe("https://example.com/avatar.png?v=stamp-1");
  });

  it("preserves existing query params", () => {
    expect(buildAvatarUrl("https://example.com/avatar.png?size=64", "stamp-2")).toBe(
      "https://example.com/avatar.png?size=64&v=stamp-2"
    );
  });
});
