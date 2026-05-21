import type { TracerStudy } from "@/types";

type TracerDisplaySource = Pick<
  TracerStudy,
  "answers" | "nama_perusahaan" | "jabatan" | "provinsi_kerja" | "rentang_gaji" | "waktu_tunggu"
>;

function readAnswer(row: Pick<TracerStudy, "answers">, field: string) {
  const value = row.answers?.[field];
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

function formatRupiah(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return value;

  const amount = Number(digits);
  if (!Number.isFinite(amount)) return value;

  return `Rp ${new Intl.NumberFormat("id-ID").format(amount)}`;
}

export function getTracerMonthlyIncomeDisplay(row: Pick<TracerStudy, "answers" | "rentang_gaji">) {
  const monthlyIncome = readAnswer(row, "f505");
  if (monthlyIncome) return formatRupiah(monthlyIncome);
  return row.rentang_gaji ?? null;
}

export function getTracerWaitTimeDisplay(row: Pick<TracerStudy, "answers" | "waktu_tunggu">) {
  const waitTime = readAnswer(row, "f502");
  if (waitTime) return `${waitTime} bulan`;
  return row.waktu_tunggu ?? null;
}

export function getTracerCompanyDisplay(row: Pick<TracerStudy, "answers" | "nama_perusahaan">) {
  return readAnswer(row, "f5b") ?? row.nama_perusahaan ?? null;
}

export function getTracerPositionDisplay(row: Pick<TracerStudy, "answers" | "jabatan">) {
  return readAnswer(row, "f5c") ?? row.jabatan ?? null;
}

export function getTracerProvinceDisplay(row: Pick<TracerStudy, "answers" | "provinsi_kerja">) {
  return readAnswer(row, "f5a1") ?? row.provinsi_kerja ?? null;
}

export function getTracerCityDisplay(row: Pick<TracerStudy, "answers">) {
  return readAnswer(row, "f5a2");
}

export function getTracerWorkplaceLevelDisplay(row: Pick<TracerStudy, "answers">) {
  return readAnswer(row, "f5d");
}

export function getTracerDisplaySnapshot(row: TracerDisplaySource) {
  return {
    company: getTracerCompanyDisplay(row),
    position: getTracerPositionDisplay(row),
    province: getTracerProvinceDisplay(row),
    monthlyIncome: getTracerMonthlyIncomeDisplay(row),
    waitTime: getTracerWaitTimeDisplay(row)
  };
}
