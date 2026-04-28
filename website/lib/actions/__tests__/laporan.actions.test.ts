import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn()
}));

vi.mock("@/lib/actions/_utils", () => ({
  requireAdmin: vi.fn(async () => ({
    ok: true,
    user: { id: "admin-1" },
    adminClient: { from: mocks.from }
  })),
  actionData: (data: unknown) => ({ data, error: null }),
  actionError: (message?: string) => ({ data: null, error: message ?? "error" })
}));

import { getReportData } from "@/lib/actions/laporan.actions";

function createPagedBuilder<T>(batches: T[][]) {
  let rangeFrom = 0;

  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    in: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    lt: vi.fn(() => query),
    range: vi.fn((from: number) => {
      rangeFrom = from;
      return query;
    }),
    then: (resolve: (value: unknown) => unknown) => {
      const batchIndex = Math.floor(rangeFrom / 1000);
      return Promise.resolve(resolve({ data: batches[batchIndex] ?? [], error: null }));
    }
  };

  return query;
}

describe("getReportData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports every alumni batch instead of stopping at the first 1000 rows", async () => {
    const firstBatch = Array.from({ length: 1000 }, (_, index) => ({
      id: `alumni-${index}`,
      nama_lengkap: `Alumni ${index}`,
      tracer_submitted: index % 2 === 0
    }));
    const secondBatch = Array.from({ length: 250 }, (_, index) => ({
      id: `alumni-${index + 1000}`,
      nama_lengkap: `Alumni ${index + 1000}`,
      tracer_submitted: true
    }));
    const alumniQuery = createPagedBuilder([firstBatch, secondBatch]);
    mocks.from.mockReturnValue(alumniQuery);

    const result = await getReportData("alumni", {});

    expect(result.error).toBeNull();
    expect(result.data?.type).toBe("alumni");
    expect(result.data?.rows).toHaveLength(1250);
    expect(alumniQuery.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(alumniQuery.range).toHaveBeenNthCalledWith(2, 1000, 1999);
    if (result.data?.type === "alumni") {
      expect(result.data.rows[0].tracer_study).toHaveLength(1);
    }
  });

  it("exports every submitted tracer batch instead of stopping at the first 1000 rows", async () => {
    const firstBatch = Array.from({ length: 1000 }, (_, index) => ({
      id: `tracer-${index}`,
      is_submitted: true,
      alumni: { nama_lengkap: `Alumni ${index}` }
    }));
    const secondBatch = Array.from({ length: 150 }, (_, index) => ({
      id: `tracer-${index + 1000}`,
      is_submitted: true,
      alumni: { nama_lengkap: `Alumni ${index + 1000}` }
    }));
    const tracerQuery = createPagedBuilder([firstBatch, secondBatch]);
    mocks.from.mockReturnValue(tracerQuery);

    const result = await getReportData("tracer", {});

    expect(result.error).toBeNull();
    expect(result.data?.type).toBe("tracer");
    expect(result.data?.rows).toHaveLength(1150);
    expect(tracerQuery.range).toHaveBeenNthCalledWith(1, 0, 999);
    expect(tracerQuery.range).toHaveBeenNthCalledWith(2, 1000, 1999);
  });
});
