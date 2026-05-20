import { NextResponse } from "next/server";
import { PRODI_OPTIONS } from "@/lib/constants";
import { buildNimLookupCandidates, isValidNim, nimToInstitutionEmail, normalizeNim } from "@/lib/alumni-nim";
import { consumeServerRateLimit, getClientIp } from "@/lib/server-rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

type RegisterAlumniRequest = {
  nim?: string;
  password?: string;
  nama_lengkap?: string;
  prodi?: string;
  tahun_masuk?: number;
  tahun_lulus?: number;
  email?: string;
};

const SUCCESS_MESSAGE = "Akun berhasil dibuat. Silakan masuk.";
const RATE_LIMIT_MESSAGE = "Terlalu banyak percobaan pendaftaran. Coba lagi beberapa menit lagi.";
const REGISTER_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;
const REGISTER_RATE_LIMIT_MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  let payload: RegisterAlumniRequest;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Format request tidak valid" }, { status: 400 });
  }

  const validation = validatePayload(payload);
  if (validation) {
    return NextResponse.json({ message: validation }, { status: 400 });
  }

  const nim = normalizeNim(payload.nim!);
  const admin = createAdminClient();
  const rateLimit = await consumeServerRateLimit({
    admin,
    scope: "register-alumni",
    rateKeys: [
      `ip:${getClientIp(request.headers)}`,
      `nim:${nim.toLowerCase()}`,
      `email:${payload.email!.trim().toLowerCase()}`
    ],
    windowSeconds: REGISTER_RATE_LIMIT_WINDOW_SECONDS,
    maxAttempts: REGISTER_RATE_LIMIT_MAX_ATTEMPTS
  });

  if (rateLimit.limited) {
    return NextResponse.json(
      { message: RATE_LIMIT_MESSAGE },
      {
        status: 429,
        headers: rateLimit.retryAfterSeconds
          ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
          : undefined
      }
    );
  }

  const { data: existingAlumni, error: existingAlumniError } = await admin
    .from("alumni")
    .select("id")
    .in("nim", buildNimLookupCandidates(nim));

  if (existingAlumniError) {
    console.error("register-alumni existing alumni lookup failed", existingAlumniError);
    return NextResponse.json({ message: "Pendaftaran belum dapat diproses. Coba lagi." }, { status: 500 });
  }

  if ((existingAlumni ?? []).length > 0) {
    return NextResponse.json({ message: "NPM sudah terdaftar" }, { status: 409 });
  }

  const authEmail = nimToInstitutionEmail(nim);
  const { data: authUser, error: authUserError } = await admin.auth.admin.createUser({
    email: authEmail,
    password: payload.password!,
    email_confirm: true,
    user_metadata: {
      nim,
      nama_lengkap: payload.nama_lengkap,
      prodi: payload.prodi,
      tahun_masuk: payload.tahun_masuk,
      tahun_lulus: payload.tahun_lulus,
      email: payload.email,
      email_verified: true
    }
  });

  if (authUserError || !authUser.user) {
    return NextResponse.json(
      { message: mapCreateUserError(authUserError?.message) },
      { status: authUserError?.status ?? 400 }
    );
  }

  const { error: profileError } = await admin
    .from("alumni")
    .upsert(
      {
        id: authUser.user.id,
        nim,
        nama_lengkap: payload.nama_lengkap,
        prodi: payload.prodi,
        tahun_masuk: payload.tahun_masuk,
        tahun_lulus: payload.tahun_lulus,
        email: payload.email,
        is_admin: false
      },
      { onConflict: "id" }
    );

  if (profileError) {
    const { error: rollbackError } = await admin.auth.admin.deleteUser(authUser.user.id);
    if (rollbackError) {
      console.error("register-alumni auth rollback failed", rollbackError, {
        userId: authUser.user.id
      });
    }
    console.error("register-alumni profile upsert failed", profileError);
    return NextResponse.json({ message: "Gagal menyimpan data alumni" }, { status: 500 });
  }

  return NextResponse.json({ message: SUCCESS_MESSAGE });
}

function validatePayload(payload: RegisterAlumniRequest) {
  if (!payload.nim || !isValidNim(payload.nim)) return "NPM tidak valid";
  if (!payload.nama_lengkap || payload.nama_lengkap.trim().length < 3) return "Nama lengkap wajib diisi";
  if (!payload.prodi || !PRODI_OPTIONS.includes(payload.prodi as (typeof PRODI_OPTIONS)[number])) {
    return "Program studi tidak valid";
  }
  if (!Number.isInteger(payload.tahun_masuk) || payload.tahun_masuk! < 1990 || payload.tahun_masuk! > 2100) {
    return "Tahun masuk tidak valid";
  }
  if (!Number.isInteger(payload.tahun_lulus) || payload.tahun_lulus! < 1990 || payload.tahun_lulus! > 2100) {
    return "Tahun lulus tidak valid";
  }
  if ((payload.tahun_masuk ?? 0) > (payload.tahun_lulus ?? 0)) {
    return "Tahun masuk tidak boleh lebih besar dari tahun lulus";
  }
  if (!payload.email || !isValidEmail(payload.email)) return "Email tidak valid";
  if (!payload.password || payload.password.length < 6) return "Password minimal 6 karakter";
  return null;
}

function isValidEmail(email: string) {
  return /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(email.trim());
}

function mapCreateUserError(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("already") || normalized.includes("registered") || normalized.includes("exists")) {
    return "NPM sudah terdaftar";
  }
  if (normalized.includes("password")) {
    return "Password tidak valid";
  }
  return "Pendaftaran belum dapat diproses. Coba lagi.";
}
