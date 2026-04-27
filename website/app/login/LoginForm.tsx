"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { loginAdmin } from "@/lib/actions/auth.actions";
import { INDONESIAN_ERRORS } from "@/lib/constants";
import { loginSchema } from "@/lib/validation";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { npp: "", password: "" }
  });

  useEffect(() => {
    const error = params.get("error");
    if (error === "admin") setServerError(INDONESIAN_ERRORS.admin);
    if (error === "session") setServerError(INDONESIAN_ERRORS.session);
  }, [params]);

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    setServerError(null);
    const result = await loginAdmin(values);

    if (result.error) {
      setServerError(result.error);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-soft">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-navy text-white">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-2xl font-semibold text-navy">TracerStudy FT UNIHAZ</h1>
        <p className="mt-2 text-sm text-slate-500">Panel admin berbasis web</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="NPP Admin"
          type="text"
          autoComplete="username"
          placeholder="198001012024011001"
          error={form.formState.errors.npp?.message}
          {...form.register("npp")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Masukkan password"
          error={form.formState.errors.password?.message}
          {...form.register("password")}
        />
        {serverError ? (
          <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-700">{serverError}</div>
        ) : null}
        <Button type="submit" className="w-full" loading={loading}>
          Masuk
        </Button>
      </form>
    </div>
  );
}
