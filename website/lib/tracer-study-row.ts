import type { Alumni, TracerStudy } from "@/types";

type JoinedAlumni = Pick<Alumni, "nim" | "nama_lengkap" | "prodi" | "tahun_lulus" | "ipk" | "email" | "no_hp"> & {
  is_admin?: boolean;
};

export type TracerStudyRowWithJoinedAlumni = Omit<TracerStudy, "alumni"> & {
  alumni?: JoinedAlumni | JoinedAlumni[] | null;
};

function normalizeJoinedAlumni(alumni: TracerStudyRowWithJoinedAlumni["alumni"]): TracerStudy["alumni"] {
  const value = Array.isArray(alumni) ? (alumni[0] ?? null) : (alumni ?? null);
  if (!value) return null;

  const { nim, nama_lengkap, prodi, tahun_lulus, ipk, email, no_hp } = value;
  return { nim, nama_lengkap, prodi, tahun_lulus, ipk, email, no_hp };
}

export function normalizeTracerStudyRow(row: TracerStudyRowWithJoinedAlumni): TracerStudy {
  return {
    ...row,
    alumni: normalizeJoinedAlumni(row.alumni)
  };
}

export function normalizeTracerStudyRows(rows: TracerStudyRowWithJoinedAlumni[]) {
  return rows.map(normalizeTracerStudyRow);
}
