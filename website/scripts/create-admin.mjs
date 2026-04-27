import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(scriptDir, "..");

loadEnvFile(path.join(appDir, ".env.local"));

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

const admin = {
  npp: requiredEnv("ADMIN_NPP"),
  email: requiredEnv("ADMIN_EMAIL"),
  password: requiredEnv("ADMIN_PASSWORD"),
  namaLengkap: requiredEnv("ADMIN_NAME"),
  staffCode: requiredEnv("ADMIN_STAFF_CODE"),
  prodi: envOrDefault("ADMIN_PRODI", "Teknik Informatika"),
  tahunMasuk: numberEnvOrDefault("ADMIN_TAHUN_MASUK", 2024),
  tahunLulus: numberEnvOrDefault("ADMIN_TAHUN_LULUS", 2024)
};

if (admin.password.length < 8) {
  throw new Error("ADMIN_PASSWORD minimal 8 karakter");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const hasNppColumn = await detectNppColumn();
const existingProfile = await findProfileByAdminIdentifier();
let authUser;

if (existingProfile) {
  const { data, error } = await supabase.auth.admin.updateUserById(existingProfile.id, {
    email: admin.email,
    password: admin.password,
    email_confirm: true,
    app_metadata: appMetadata(),
    user_metadata: userMetadata()
  });

  if (error || !data.user) {
    throw new Error(`Gagal memperbarui Auth user admin: ${error?.message ?? "unknown error"}`);
  }

  authUser = data.user;
} else {
  const existingAuthUser = await findAuthUserByEmail(admin.email);

  if (existingAuthUser) {
    const { data, error } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
      email: admin.email,
      password: admin.password,
      email_confirm: true,
      app_metadata: appMetadata(),
      user_metadata: userMetadata()
    });

    if (error || !data.user) {
      throw new Error(`Gagal memperbarui Auth user admin: ${error?.message ?? "unknown error"}`);
    }

    authUser = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true,
      app_metadata: appMetadata(),
      user_metadata: userMetadata()
    });

    if (error || !data.user) {
      throw new Error(`Gagal membuat Auth user admin: ${error?.message ?? "unknown error"}`);
    }

    authUser = data.user;
  }
}

const { error: profileError } = await supabase.from("alumni").upsert(
  compactPayload({
    id: authUser.id,
    nim: admin.staffCode,
    npp: hasNppColumn ? admin.npp : undefined,
    nama_lengkap: admin.namaLengkap,
    prodi: admin.prodi,
    tahun_masuk: admin.tahunMasuk,
    tahun_lulus: admin.tahunLulus,
    email: admin.email,
    is_admin: true
  }),
  { onConflict: "id" }
);

if (profileError) {
  throw new Error(`Gagal menyimpan profil admin: ${profileError.message}`);
}

console.log("Kredensial admin siap.");
console.log(`NPP        : ${admin.npp}`);
console.log("Password   : disimpan dari ADMIN_PASSWORD dan tidak ditampilkan");
console.log(`Email Auth : ${admin.email}`);
if (!hasNppColumn) {
  console.log("Catatan    : Kolom alumni.npp belum ada, NPP admin disimpan di metadata Auth.");
}
console.log("Gunakan NPP + password untuk login panel admin web.");

function appMetadata() {
  return {
    role: "admin",
    npp: admin.npp
  };
}

function userMetadata() {
  return {
    staff_code: admin.staffCode,
    npp: admin.npp,
    nama_lengkap: admin.namaLengkap,
    prodi: admin.prodi,
    tahun_masuk: admin.tahunMasuk,
    tahun_lulus: admin.tahunLulus,
    email: admin.email
  };
}

async function detectNppColumn() {
  const { error } = await supabase.from("alumni").select("npp").limit(1);
  if (!error) return true;
  if (error.code === "42703") return false;
  throw new Error(`Gagal memeriksa kolom NPP: ${error.message}`);
}

async function findProfileByAdminIdentifier() {
  if (!hasNppColumn) {
    const authUser = await findAuthUserByNpp(admin.npp);
    if (!authUser) return null;

    const { data, error } = await supabase
      .from("alumni")
      .select("id,email,nim,is_admin")
      .eq("id", authUser.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Gagal mencari profil admin: ${error.message}`);
    }

    return data;
  }

  const query = supabase.from("alumni").select("id,email,npp,is_admin").eq("npp", admin.npp);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Gagal mencari profil admin: ${error.message}`);
  }

  return data;
}

async function findAuthUserByNpp(npp) {
  return findAuthUser((candidate) => candidate.app_metadata?.npp === npp || candidate.user_metadata?.npp === npp);
}

async function findAuthUserByEmail(email) {
  return findAuthUser((candidate) => candidate.email?.toLowerCase() === email.toLowerCase());
}

async function findAuthUser(predicate) {
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Gagal membaca Auth users: ${error.message}`);

    const user = data.users.find(predicate);
    if (user) return user;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    process.env[key] = stripQuotes(rawValue.trim());
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value || isPlaceholderValue(value)) {
    throw new Error(`${name} belum dikonfigurasi`);
  }
  return value;
}

function isPlaceholderValue(value) {
  const normalized = value.toLowerCase();
  return normalized.includes("replace-with") || normalized.includes("your-") || normalized.includes("change-this");
}

function envOrDefault(name, fallback) {
  return process.env[name]?.trim() || fallback;
}

function numberEnvOrDefault(name, fallback) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`${name} harus angka bulat`);
  return value;
}

function compactPayload(payload) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}
