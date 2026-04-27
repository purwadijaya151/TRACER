import { Suspense } from "react";
import { LoginForm } from "@/app/login/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy-50 p-6">
      <Suspense fallback={<div className="h-96 w-full max-w-md rounded-lg bg-white shadow-soft" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
