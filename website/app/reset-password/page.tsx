import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordForm } from "@/app/reset-password/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password Tracer Study UNIHAZ",
  description: "Halaman reset password untuk pengguna aplikasi Android Tracer Study UNIHAZ"
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-50 p-6">
      <Suspense fallback={<div className="h-80 w-full max-w-md rounded-lg bg-white shadow-soft" />}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
