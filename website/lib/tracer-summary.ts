export type TracerSummaryRow = {
  kesesuaian_bidang: number | null;
  rentang_gaji: string | null;
};

export type TracerSummary = {
  avg_kesesuaian: number;
  modal_gaji: string;
};

function average(values: Array<number | null | undefined>) {
  const valid = values.filter((value): value is number => typeof value === "number");
  if (valid.length === 0) return 0;
  return Number((valid.reduce((total, value) => total + value, 0) / valid.length).toFixed(2));
}

function mode(values: Array<string | null | undefined>) {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
}
export function buildTracerSummary(rows: TracerSummaryRow[]): TracerSummary {
  return {
    avg_kesesuaian: average(rows.map((row) => row.kesesuaian_bidang)),
    modal_gaji: mode(rows.map((row) => row.rentang_gaji))
  };
}
