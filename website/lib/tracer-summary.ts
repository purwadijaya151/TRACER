export type TracerSummaryRow = {
  kesesuaian_bidang: number | null;
  waktu_tunggu: string | null;
  rentang_gaji: string | null;
  alumni: { ipk: number | null } | Array<{ ipk: number | null }> | null;
};

export type TracerSummary = {
  avg_ipk: number;
  avg_kesesuaian: number;
  avg_waktu_tunggu: string;
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

function rowIpk(row: TracerSummaryRow) {
  const alumni = Array.isArray(row.alumni) ? row.alumni[0] : row.alumni;
  return alumni?.ipk ?? null;
}

export function buildTracerSummary(rows: TracerSummaryRow[]): TracerSummary {
  return {
    avg_ipk: average(rows.map(rowIpk)),
    avg_kesesuaian: average(rows.map((row) => row.kesesuaian_bidang)),
    avg_waktu_tunggu: mode(rows.map((row) => row.waktu_tunggu)),
    modal_gaji: mode(rows.map((row) => row.rentang_gaji))
  };
}
