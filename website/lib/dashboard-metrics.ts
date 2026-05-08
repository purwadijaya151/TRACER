import { PRODI_OPTIONS, STATUS_KERJA_OPTIONS } from "@/lib/constants";
import type { Prodi, StatusKerja } from "@/types";

export type DashboardAlumniRow = {
  prodi: Prodi | null;
};

export type DashboardSubmissionAggregateRow = {
  status_kerja: StatusKerja | null;
  alumni: { prodi: Prodi | null } | Array<{ prodi: Prodi | null }> | null;
};

function joinedAlumni<T>(value: T | T[] | null) {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function buildResponseByProdi(
  alumniRows: DashboardAlumniRow[],
  submissionRows: DashboardSubmissionAggregateRow[]
) {
  const totals = new Map<Prodi, number>();
  const submitted = new Map<Prodi, number>();

  for (const prodi of PRODI_OPTIONS) {
    totals.set(prodi, 0);
    submitted.set(prodi, 0);
  }

  for (const row of alumniRows) {
    if (!row.prodi || !totals.has(row.prodi)) continue;
    totals.set(row.prodi, (totals.get(row.prodi) ?? 0) + 1);
  }

  for (const row of submissionRows) {
    const prodi = joinedAlumni(row.alumni)?.prodi;
    if (!prodi || !submitted.has(prodi)) continue;
    submitted.set(prodi, (submitted.get(prodi) ?? 0) + 1);
  }

  return PRODI_OPTIONS.map((prodi) => ({
    prodi,
    total: totals.get(prodi) ?? 0,
    mengisi: submitted.get(prodi) ?? 0
  }));
}

export function buildStatusKerjaDistribution(submissionRows: DashboardSubmissionAggregateRow[]) {
  const counts = new Map<StatusKerja, number>();

  for (const status of STATUS_KERJA_OPTIONS) {
    counts.set(status, 0);
  }

  for (const row of submissionRows) {
    if (!row.status_kerja || !counts.has(row.status_kerja)) continue;
    counts.set(row.status_kerja, (counts.get(row.status_kerja) ?? 0) + 1);
  }

  return STATUS_KERJA_OPTIONS.map((status) => ({
    status,
    count: counts.get(status) ?? 0
  }));
}
