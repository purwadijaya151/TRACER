import { beforeEach, describe, expect, it, vi } from "vitest";

function createSummaryBuilder() {
  let rangeFrom = 0;
  const firstBatch = Array.from({ length: 1000 }, () => ({
    kesesuaian_bidang: 0,
    rentang_gaji: "Rendah",
    alumni: null
  }));
  const secondBatch = Array.from({ length: 1000 }, () => ({
    kesesuaian_bidang: 4,
    rentang_gaji: "Tinggi",
    alumni: null
  }));

  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    range: vi.fn((from: number) => {
      rangeFrom = from;
      return query;
    }),
    in: vi.fn(() => query),
    gte: vi.fn(() => query),
    lte: vi.fn(() => query),
    lt: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) => {
      const data = rangeFrom === 0 ? firstBatch : rangeFrom === 1000 ? secondBatch : [];
      return Promise.resolve(resolve({ data, error: null }));
    }
  };

  return query;
}

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
  actionError: (message?: string) => ({ data: null, error: message ?? "error" }),
  getRange: (page: number, pageSize: number) => ({ from: (page - 1) * pageSize, to: page * pageSize - 1 })
}));

import { getTracerStudyExport, getTracerSummary } from "@/lib/actions/tracer-study.actions";

describe("getTracerSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.from.mockImplementation(() => createSummaryBuilder());
  });

  it("calculates summary from every paginated batch, not just the first 1000 rows", async () => {
    const result = await getTracerSummary();

    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      avg_kesesuaian: 2,
      modal_gaji: "Rendah"
    });
  });

  it("exports every tracer batch without the old 5000-row cap", async () => {
    const result = await getTracerStudyExport({});

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2000);
  });
});
