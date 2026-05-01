"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";

type RecoveryState = "checking" | "ready" | "invalid";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");

  useEffect(() => {
    const code = searchParams.get("code");
    let active = true;

    if (!code) {
      setRecoveryState("invalid");
      setError("Link reset password tidak valid atau sudah kedaluwarsa");
      return;
    }

    createSupabaseBrowserClient().auth.exchangeCodeForSession(code).then((result: { error: unknown }) => {
      if (!active) {
        return;
      }

      if (result.error) {
        setRecoveryState("invalid");
        setError("Link reset password tidak valid atau sudah kedaluwarsa");
        return;
      }

      setRecoveryState("ready");
      setError(null);
    });

    return () => {
      active = false;
    };
  }, [searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (recoveryState !== "ready") {
      setError("Link reset password tidak valid atau sudah kedaluwarsa");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("Link reset password tidak valid atau sudah kedaluwarsa");
      return;
    }

    toast.success("Password berhasil diperbarui");
    setSuccess(true);
  }

  return (
    <section className="w-full max-w-md rounded-xl bg-white p-8 shadow-soft">
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-navy-light">Tracer Study UNIHAZ</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Reset Password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Masukkan password baru untuk akun aplikasi Android Anda.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          label="Password Baru"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />
        <Input
          label="Konfirmasi Password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
        />

        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {success ? (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
            Password berhasil diperbarui. Silakan kembali ke aplikasi Android untuk login.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || recoveryState !== "ready"}
          className="focus-ring h-11 w-full rounded-md bg-navy px-4 text-sm font-semibold text-white transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : recoveryState === "checking" ? "Memeriksa Link..." : "Simpan Password Baru"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">Setelah berhasil, buka kembali aplikasi Android Tracer Study UNIHAZ.</p>
    </section>
  );
}
