import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { buildNimLookupCandidates, isValidNim, nimToInstitutionEmail, normalizeNim } from "@/lib/alumni-nim";
import { createAdminClient } from "@/lib/supabase/server";
import { assertEnv } from "@/lib/utils";
import { consumePasswordResetRateLimit } from "./password-reset-rate-limit";
import { resolvePasswordResetRedirectTo } from "./reset-password-redirect";

const SUCCESS_MESSAGE = "Jika NPM dan email cocok, kami akan mencoba mengirim link reset password. Jika email belum masuk dalam beberapa menit, coba lagi atau hubungi admin.";
const RATE_LIMIT_MESSAGE = "Terlalu banyak permintaan reset password. Coba lagi beberapa menit lagi.";
const SERVICE_UNAVAILABLE_MESSAGE = "Layanan reset password sedang tidak tersedia. Coba beberapa saat lagi.";
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

type PasswordResetDeliveryContext = {
  transporter: nodemailer.Transporter;
  redirectTo: string;
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

  const rawNim = payload.nim?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase();

  if (!rawNim || !email || !isValidNim(rawNim) || !isValidEmail(email)) {
    return withMinimumResponseTime(
      NextResponse.json({ message: "NPM atau email tidak valid" }, { status: 400 }),
      startedAt
    );
  }

  try {
    const admin = createAdminClient();
    const nim = normalizeNim(rawNim);
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

    const deliveryContext = await buildPasswordResetDeliveryContext(request);

    try {
      await sendRecoveryEmailIfAccountMatches(admin, deliveryContext, nim, email);
    } catch (error) {
      if (error instanceof PasswordResetDeliveryError) {
        return withMinimumResponseTime(
          NextResponse.json(
            { message: SERVICE_UNAVAILABLE_MESSAGE },
            { status: 503 }
          ),
          startedAt
        );
      }
      console.error("Password reset delivery failed", error);
      return withMinimumResponseTime(
        NextResponse.json(
          { message: SERVICE_UNAVAILABLE_MESSAGE },
          { status: 503 }
        ),
        startedAt
      );
    }

    return withMinimumResponseTime(NextResponse.json({ message: SUCCESS_MESSAGE }), startedAt);
  } catch (error) {
    console.error("Password reset request failed", error);
    return withMinimumResponseTime(
      NextResponse.json(
        { message: SERVICE_UNAVAILABLE_MESSAGE },
        { status: 503 }
      ),
      startedAt
    );
  }
}

async function sendRecoveryEmailIfAccountMatches(
  admin: SupabaseAdminClient,
  deliveryContext: PasswordResetDeliveryContext,
  nim: string,
  email: string
) {
  const { data: alumni, error: alumniError } = await admin
    .from("alumni")
    .select("id,nim,nama_lengkap,email")
    .in("nim", buildNimLookupCandidates(nim));

  if (alumniError) {
    throw alumniError;
  }

  const matchedAlumni = ((alumni as AlumniResetRow[] | null) ?? []).find((row) => isSameEmail(row.email, email));

  if (!matchedAlumni || !isSameEmail(matchedAlumni.email, email)) {
    return;
  }

  const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(matchedAlumni.id);

  if (authUserError) {
    throw authUserError;
  }

  const authEmail = authUser.user?.email ?? nimToInstitutionEmail(matchedAlumni.nim);
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: authEmail,
    options: deliveryContext.redirectTo ? { redirectTo: deliveryContext.redirectTo } : undefined
  });

  if (linkError) {
    throw new PasswordResetDeliveryError(linkError);
  }

  const resetLink = linkData.properties?.action_link;

  if (!resetLink) {
    throw new PasswordResetDeliveryError(new Error("Supabase tidak mengembalikan link reset password"));
  }

  await sendResetPasswordEmail({
    transporter: deliveryContext.transporter,
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

function isValidEmail(email: string) {
  return /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/.test(email.trim());
}

function isSameEmail(storedEmail: string | null | undefined, expectedEmail: string) {
  return storedEmail?.trim().toLowerCase() === expectedEmail.trim().toLowerCase();
}

function assertPasswordResetDeliveryConfigured() {
  assertEnv("SMTP_HOST");
  assertEnv("SMTP_PORT");
  assertEnv("SMTP_USER");
  assertEnv("SMTP_PASS");
  assertEnv("MAIL_FROM");
}

async function buildPasswordResetDeliveryContext(request: Request): Promise<PasswordResetDeliveryContext> {
  assertPasswordResetDeliveryConfigured();

  const redirectTo = resolvePasswordResetRedirectTo(request);
  const transporter = nodemailer.createTransport({
    host: assertEnv("SMTP_HOST"),
    port: Number(assertEnv("SMTP_PORT")),
    secure: Number(assertEnv("SMTP_PORT")) === 465,
    auth: {
      user: assertEnv("SMTP_USER"),
      pass: assertEnv("SMTP_PASS")
    }
  });

  await transporter.verify();

  return { transporter, redirectTo };
}

async function sendResetPasswordEmail({
  transporter,
  to,
  name,
  resetLink
}: {
  transporter: nodemailer.Transporter;
  to: string;
  name?: string | null;
  resetLink: string;
}) {
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

class PasswordResetDeliveryError extends Error {
  constructor(cause: unknown) {
    super("Password reset delivery failed");
    this.name = "PasswordResetDeliveryError";
    this.cause = cause;
  }
}
