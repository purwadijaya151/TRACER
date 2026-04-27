"use server";

import { alumniSchema, alumniUpdateSchema } from "@/lib/validation";
import {
  actionData,
  actionError,
  getRange,
  isMissingRelationError,
  requireAdmin,
  sanitizeText
} from "@/lib/actions/_utils";
import type { Alumni, AlumniFilters, PaginatedResult, TracerStudy } from "@/types";

type AdminContext = Extract<Awaited<ReturnType<typeof requireAdmin>>, { ok: true }>;

function normalizeAlumniPayload(payload: Record<string, unknown>) {
  return {
    nim: String(payload.nim),
    nama_lengkap: String(payload.nama_lengkap),
    prodi: String(payload.prodi),
    tahun_masuk: Number(payload.tahun_masuk),
    tahun_lulus: Number(payload.tahun_lulus),
    ipk: payload.ipk === undefined || payload.ipk === null || payload.ipk === "" ? null : Number(payload.ipk),
    tempat_lahir: sanitizeText(payload.tempat_lahir as string | undefined) ?? null,
    tanggal_lahir: sanitizeText(payload.tanggal_lahir as string | undefined) ?? null,
    no_hp: sanitizeText(payload.no_hp as string | undefined) ?? null,
    email: sanitizeText(payload.email as string | undefined) ?? null,
    alamat: sanitizeText(payload.alamat as string | undefined) ?? null,
    foto_url: sanitizeText(payload.foto_url as string | undefined) ?? null
  };
}

async function assertNonAdminTarget(auth: Awaited<ReturnType<typeof requireAdmin>>, ids: string[], action = "diubah") {
  if (!auth.ok) return auth;
  if (ids.includes(auth.user.id)) return { ok: false as const, error: `Akun admin aktif tidak boleh ${action}` };

  const { data, error } = await auth.adminClient
    .from("alumni")
    .select("id,is_admin")
    .in("id", ids);

  if (error) return { ok: false as const, error: "Gagal memvalidasi data alumni" };
  if ((data ?? []).some((row) => row.is_admin)) {
    return { ok: false as const, error: `Akun admin tidak boleh ${action}` };
  }

  return { ok: true as const };
}

export async function getAlumni(filters: AlumniFilters = {}, page = 1, pageSize = 10) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<PaginatedResult<Alumni>>(auth.error);

  const { from, to } = getRange(page, pageSize);
  let query = auth.adminClient
    .from("admin_alumni_with_status")
    .select("*", { count: "exact" })
    .eq("is_admin", false)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.search) {
    const search = `%${filters.search}%`;
    query = query.or(`nim.ilike.${search},nama_lengkap.ilike.${search},email.ilike.${search}`);
  }
  if (filters.prodi && filters.prodi !== "all") query = query.eq("prodi", filters.prodi);
  if (filters.tahun_lulus && filters.tahun_lulus !== "all") query = query.eq("tahun_lulus", filters.tahun_lulus);
  if (filters.status === "sudah") query = query.eq("tracer_submitted", true);
  if (filters.status === "belum") query = query.eq("tracer_submitted", false);

  const { data, error, count } = await query;
  if (error) {
    if (isMissingRelationError(error)) return getAlumniFromBaseTable(auth, filters, page, pageSize);
    return actionError<PaginatedResult<Alumni>>();
  }

  const rows = ((data ?? []) as Array<Alumni & { tracer_submitted?: boolean }>).map((row) => {
    const { tracer_submitted: tracerSubmitted, ...alumni } = row;
    return {
      ...alumni,
      tracer_study: tracerSubmitted ? ([{ is_submitted: true } as TracerStudy]) : []
    } as Alumni;
  });

  return actionData({
    rows,
    total: count ?? 0,
    page,
    pageSize
  });
}

export async function getAlumniExport(filters: AlumniFilters = {}) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<Alumni[]>(auth.error);

  let query = auth.adminClient
    .from("admin_alumni_with_status")
    .select("*")
    .eq("is_admin", false)
    .order("tahun_lulus", { ascending: false })
    .order("nama_lengkap", { ascending: true })
    .limit(5000);

  if (filters.search) {
    const search = `%${filters.search}%`;
    query = query.or(`nim.ilike.${search},nama_lengkap.ilike.${search},email.ilike.${search}`);
  }
  if (filters.prodi && filters.prodi !== "all") query = query.eq("prodi", filters.prodi);
  if (filters.tahun_lulus && filters.tahun_lulus !== "all") query = query.eq("tahun_lulus", filters.tahun_lulus);
  if (filters.status === "sudah") query = query.eq("tracer_submitted", true);
  if (filters.status === "belum") query = query.eq("tracer_submitted", false);

  const { data, error } = await query;
  if (error) {
    if (isMissingRelationError(error)) return getAlumniExportFromBaseTable(auth, filters);
    return actionError<Alumni[]>("Gagal mengambil data alumni");
  }

  const rows = ((data ?? []) as Array<Alumni & { tracer_submitted?: boolean }>).map((row) => {
    const { tracer_submitted: tracerSubmitted, ...alumni } = row;
    return {
      ...alumni,
      tracer_study: tracerSubmitted ? ([{ is_submitted: true } as TracerStudy]) : []
    } as Alumni;
  });

  return actionData(rows);
}

async function getAlumniFromBaseTable(
  auth: AdminContext,
  filters: AlumniFilters,
  page: number,
  pageSize: number
) {
  const allRows = await getFilteredAlumniRows(auth, filters);
  if (!allRows.ok) return actionError<PaginatedResult<Alumni>>(allRows.error);

  const { from, to } = getRange(page, pageSize);
  return actionData({
    rows: allRows.rows.slice(from, to + 1),
    total: allRows.rows.length,
    page,
    pageSize
  });
}

async function getAlumniExportFromBaseTable(auth: AdminContext, filters: AlumniFilters) {
  const allRows = await getFilteredAlumniRows(auth, filters);
  if (!allRows.ok) return actionError<Alumni[]>(allRows.error);
  return actionData(allRows.rows);
}

async function getFilteredAlumniRows(auth: AdminContext, filters: AlumniFilters) {
  let query = auth.adminClient
    .from("alumni")
    .select("*")
    .eq("is_admin", false)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (filters.search) {
    const search = `%${filters.search}%`;
    query = query.or(`nim.ilike.${search},nama_lengkap.ilike.${search},email.ilike.${search}`);
  }
  if (filters.prodi && filters.prodi !== "all") query = query.eq("prodi", filters.prodi);
  if (filters.tahun_lulus && filters.tahun_lulus !== "all") query = query.eq("tahun_lulus", filters.tahun_lulus);

  const { data, error } = await query;
  if (error) return { ok: false as const, error: "Gagal mengambil data alumni" };

  const submittedIds = await getSubmittedAlumniIds(auth, (data ?? []).map((row) => row.id as string));
  const submittedSet = new Set(submittedIds);
  const rows = ((data ?? []) as Alumni[])
    .filter((row) => {
      if (filters.status === "sudah") return submittedSet.has(row.id);
      if (filters.status === "belum") return !submittedSet.has(row.id);
      return true;
    })
    .map((row) => ({
      ...row,
      tracer_study: submittedSet.has(row.id) ? ([{ is_submitted: true } as TracerStudy]) : []
    }));

  return { ok: true as const, rows };
}

async function getSubmittedAlumniIds(auth: AdminContext, alumniIds: string[]) {
  if (alumniIds.length === 0) return [];

  const { data, error } = await auth.adminClient
    .from("tracer_study")
    .select("alumni_id")
    .in("alumni_id", alumniIds)
    .eq("is_submitted", true)
    .limit(5000);

  if (error) return [];
  return (data ?? []).map((row) => row.alumni_id as string).filter(Boolean);
}

export async function createAlumni(input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<Alumni>(auth.error);

  const parsed = alumniSchema.safeParse(input);
  if (!parsed.success) return actionError<Alumni>("Data alumni tidak valid");

  const payload = normalizeAlumniPayload(parsed.data);
  if (!payload.email) return actionError<Alumni>("Email wajib diisi untuk membuat akun alumni");

  const password = parsed.data.password || `${payload.nim}@Tracer2026`;
  const { data: userData, error: userError } = await auth.adminClient.auth.admin.createUser({
    email: payload.email,
    password,
    email_confirm: true,
    user_metadata: {
      nim: payload.nim,
      nama_lengkap: payload.nama_lengkap,
      prodi: payload.prodi,
      tahun_masuk: payload.tahun_masuk,
      tahun_lulus: payload.tahun_lulus,
      email: payload.email
    }
  });

  if (userError || !userData.user) return actionError<Alumni>("Gagal membuat akun Auth alumni");

  const { data, error } = await auth.adminClient
    .from("alumni")
    .upsert({ id: userData.user.id, ...payload, is_admin: false }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    await auth.adminClient.auth.admin.deleteUser(userData.user.id);
    return actionError<Alumni>("Gagal menyimpan data alumni");
  }

  return actionData(data as Alumni);
}

export async function updateAlumni(id: string, input: unknown) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<Alumni>(auth.error);

  const parsed = alumniUpdateSchema.safeParse(input);
  if (!parsed.success) return actionError<Alumni>("Data alumni tidak valid");

  const guard = await assertNonAdminTarget(auth, [id]);
  if (!guard.ok) return actionError<Alumni>(guard.error);

  const payload = normalizeAlumniPayload(parsed.data);
  const { data, error } = await auth.adminClient
    .from("alumni")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) return actionError<Alumni>("Gagal memperbarui data alumni");

  if (payload.email) {
    await auth.adminClient.auth.admin.updateUserById(id, { email: payload.email });
  }

  return actionData(data as Alumni);
}

export async function deleteAlumni(id: string) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<{ deleted: number }>(auth.error);

  const guard = await assertNonAdminTarget(auth, [id], "dihapus");
  if (!guard.ok) return actionError<{ deleted: number }>(guard.error);

  const { error } = await auth.adminClient.auth.admin.deleteUser(id);
  if (error) return actionError<{ deleted: number }>("Gagal menghapus alumni");

  return actionData({ deleted: 1 });
}

export async function bulkDeleteAlumni(ids: string[]) {
  const auth = await requireAdmin();
  if (!auth.ok) return actionError<{ deleted: number }>(auth.error);
  if (ids.length === 0) return actionData({ deleted: 0 });

  const guard = await assertNonAdminTarget(auth, ids, "dihapus");
  if (!guard.ok) return actionError<{ deleted: number }>(guard.error);

  let deleted = 0;
  for (const id of ids) {
    const { error } = await auth.adminClient.auth.admin.deleteUser(id);
    if (!error) deleted += 1;
  }

  return actionData({ deleted });
}
