import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/server";
import { assertEnv } from "@/lib/utils";
import { consumePasswordResetRateLimit } from "./password-reset-rate-limit";

const INSTITUTION_EMAIL_DOMAIN = "ft.unihaz.ac.id";
const SUCCESS_MESSAGE = "Jika NPM dan email cocok, link reset password akan dikirim ke email pribadi Anda.";
const RATE_LIMIT_MESSAGE = "Terlalu banyak permintaan reset password. Coba lagi beberapa menit lagi.";
const MIN_RESPONSE_MS = 1500;
const MAX_RESPONSE_JITTER_MS = 500;

type ResetPasswordRequest = {
  nim?: string;
  email?: string;
};

type SupabaseAdminClient = ReturnType<typeof createAdminClient>;

type AlumniResetRow = {
  id: string;
  nim: string;
  nama_lengkap?: string | null;
  email?: string | null;
};

export async function POST(request: Request) {
  const startedAt = Date.now();
  let payload: ResetPasswordRequest;

  try {
    payload = await request.json();
  } catch {
    return withMinimumResponseTime(
      NextResponse.json({ message: "Format request tidak valid" }, { status: 400 }),
      startedAt
    );
  }

  const nim = payload.nim?.trim();
  const email = payload.email?.trim().toLowerCase();

  if (!nim || !email || !isValidNim(nim) || !isValidEmail(email)) {
    return withMinimumResponseTime(
      NextResponse.json({ message: "NPM atau email tidak valid" }, { status: 400 }),
      startedAt
    );
  }

  try {
    const admin = createAdminClient();
    const rateLimit = await consumePasswordResetRateLimit({ admin, request, nim, email });

    if (rateLimit.limited) {
      return withMinimumResponseTime(
        NextResponse.json(
          { message: RATE_LIMIT_MESSAGE },
          {
            status: 429,
            headers: rateLimit.retryAfterSeconds
              ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
              : undefined
          }
        ),
        startedAt
      );
    }

    try {
      await sendRecoveryEmailIfAccountMatches(admin, request, nim, email);
    } catch (error) {
      console.error("Password reset delivery failed", error);
    }

    return withMinimumResponseTime(NextResponse.json({ message: SUCCESS_MESSAGE }), startedAt);
  } catch (error) {
    console.error("Password reset request failed", error);
    return withMinimumResponseTime(
      NextResponse.json(
        { message: "Reset password belum dapat diproses. Coba beberapa saat lagi." },
        { status: 500 }
      ),
      startedAt
    );
  }
}

async function sendRecoveryEmailIfAccountMatches(
  admin: SupabaseAdminClient,
  request: Request,
  nim: string,
  email: string
) {
  const { data: alumni, error: alumniError } = await admin
    .from("alumni")
    .select("id,nim,nama_lengkap,email")
    .eq("nim", nim)
    .maybeSingle();

  if (alumniError) {
    throw alumniError;
  }

  const matchedAlumni = alumni as AlumniResetRow | null;

  if (!matchedAlumni || !isSameEmail(matchedAlumni.email, email)) {
    return;
  }

  const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(matchedAlumni.id);

  if (authUserError) {
    throw authUserError;
  }

  const authEmail = authUser.user?.email ?? `${matchedAlumni.nim.toLowerCase()}@${INSTITUTION_EMAIL_DOMAIN}`;
  const redirectTo = getRedirectTo(request);
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: authEmail,
    options: redirectTo ? { redirectTo } : undefined
  });

  if (linkError) {
    throw linkError;
  }

  const resetLink = linkData.properties?.action_link;

  if (!resetLink) {
    throw new Error("Supabase tidak mengembalikan link reset password");
  }

  await sendResetPasswordEmail({
    to: email,
    name: matchedAlumni.nama_lengkap,
    resetLink
  });
}

async function withMinimumResponseTime(response: NextResponse, startedAt: number) {
  const targetDelayMs = MIN_RESPONSE_MS + Math.floor(Math.random() * MAX_RESPONSE_JITTER_MS);
  const remainingDelayMs = targetDelayMs - (Date.now() - startedAt);

  if (remainingDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, remainingDelayMs));
  }

  return response;
}

function getRedirectTo(request: Request) {
  const configuredRedirect = process.env.PASSWORD_RESET_REDIRECT_TO?.trim();
  const derivedRedirect = buildResetPasswordUrl(request);

  if (!configuredRedirect) {
    return derivedRedirect;
  }

  if (isVercelDeployment() && isLocalRedirect(configuredRedirect)) {
    return derivedRedirect;
  }

  return configuredRedirect;
}

function buildResetPasswordUrl(request: Request) {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;

  if (vercelUrl?.trim()) {
    return `https://${vercelUrl.trim().replace(/^https?:\/\//, "").replace(/\/$/, "")}/reset-password`;
  }

  return `${new URL(request.url).origin}/reset-password`;
}

function isVercelDeployment() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_URL);
}

function isLocalRedirect(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/i.test(value);
}

function isValidNim(nim: string) {
  return /^[0-9.]{5,20}$/.test(nim.trim());
}

function isValidEmail(email: string) {
  return /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(email.trim());
}

function isSameEmail(storedEmail: string | null | undefined, expectedEmail: string) {
  return storedEmail?.trim().toLowerCase() === expectedEmail.trim().toLowerCase();
}

async function sendResetPasswordEmail({
  to,
  name,
  resetLink
}: {
  to: string;
  name?: string | null;
  resetLink: string;
}) {
  const transporter = nodemailer.createTransport({
    host: assertEnv("SMTP_HOST"),
    port: Number(assertEnv("SMTP_PORT")),
    secure: Number(assertEnv("SMTP_PORT")) === 465,
    auth: {
      user: assertEnv("SMTP_USER"),
      pass: assertEnv("SMTP_PASS")
    }
  });

  const displayName = name?.trim() || "Alumni";

  await transporter.sendMail({
    from: assertEnv("MAIL_FROM"),
    to,
    subject: "Reset Password Tracer Study UNIHAZ",
    text: [
      `Halo ${displayName},`,
      "",
      "Kami menerima permintaan reset password untuk akun Tracer Study UNIHAZ Anda.",
      "Klik link berikut untuk mengatur password baru:",
      resetLink,
      "",
      "Jika Anda tidak meminta reset password, abaikan email ini."
    ].join("\n"),
    html: `
      <p>Halo ${escapeHtml(displayName)},</p>
      <p>Kami menerima permintaan reset password untuk akun Tracer Study UNIHAZ Anda.</p>
      <p><a href="${escapeHtml(resetLink)}">Klik di sini untuk mengatur password baru</a>.</p>
      <p>Jika tombol/link tidak bisa dibuka, salin alamat berikut:</p>
      <p>${escapeHtml(resetLink)}</p>
      <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
    `
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
