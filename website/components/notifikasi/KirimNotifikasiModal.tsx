"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, GraduationCap, Send, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import { broadcastNotifikasi, getRecipientCount } from "@/lib/actions/notifikasi.actions";
import { PRODI_OPTIONS } from "@/lib/constants";
import { notificationSchema } from "@/lib/validation";
import { cn } from "@/lib/utils";

type FormValues = z.infer<typeof notificationSchema>;

const targetCards = [
  { value: "all", label: "Semua Alumni", icon: Users },
  { value: "prodi", label: "Per Prodi", icon: GraduationCap },
  { value: "tahun", label: "Per Tahun Lulus", icon: GraduationCap },
  { value: "belum_mengisi", label: "Belum Mengisi Saja", icon: Bell }
] as const;

export function KirimNotifikasiModal({
  open,
  onClose,
  onSent
}: {
  open: boolean;
  onClose: () => void;
  onSent: () => void;
}) {
  const [recipientCount, setRecipientCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: { title: "", body: "", target: "all", prodi: [] }
  });

  const watched = form.watch();
  const payload = useMemo(
    () => ({
      title: watched.title || "Preview judul",
      body: watched.body || "Preview isi pesan pengingat untuk alumni.",
      target: watched.target,
      prodi: watched.prodi,
      tahunMulai: watched.tahunMulai,
      tahunAkhir: watched.tahunAkhir
    }),
    [watched.body, watched.prodi, watched.target, watched.tahunAkhir, watched.tahunMulai, watched.title]
  );

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(async () => {
      setLoadingCount(true);
      const result = await getRecipientCount(payload);
      setLoadingCount(false);
      if (!result.error) setRecipientCount(result.data ?? 0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [open, payload]);

  const submit = async (values: FormValues) => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setSending(true);
    const result = await broadcastNotifikasi(values);
    setSending(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${result.data?.sent ?? 0} notifikasi dikirim`);
    setConfirming(false);
    form.reset({ title: "", body: "", target: "all", prodi: [] });
    onSent();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kirim Notifikasi"
      size="xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">{loadingCount ? "Menghitung..." : `${recipientCount} penerima`}</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Batal</Button>
            <Button loading={sending} onClick={form.handleSubmit(submit)}>
              <Send className="h-4 w-4" />
              {confirming ? "Konfirmasi Kirim" : "Lanjutkan"}
            </Button>
          </div>
        </div>
      }
    >
      <form className="grid gap-6 lg:grid-cols-[1fr_280px]" onSubmit={form.handleSubmit(submit)}>
        <div className="space-y-4">
          <Input label="Judul" error={form.formState.errors.title?.message} {...form.register("title")} />
          <Textarea label="Pesan" error={form.formState.errors.body?.message} {...form.register("body")} />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Target</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {targetCards.map((item) => {
                const Icon = item.icon;
                const active = watched.target === item.value;
                return (
                  <button
                    type="button"
                    key={item.value}
                    className={cn(
                      "focus-ring rounded-lg border p-4 text-left transition",
                      active ? "border-navy bg-navy-50 text-navy" : "border-slate-200 hover:bg-slate-50"
                    )}
                    onClick={() => {
                      form.setValue("target", item.value);
                      setConfirming(false);
                    }}
                  >
                    <Icon className="mb-3 h-5 w-5" />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {watched.target === "prodi" ? (
            <div className="grid gap-2 rounded-lg border border-slate-100 p-4">
              {PRODI_OPTIONS.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={watched.prodi?.includes(item) ?? false}
                    onChange={(event) => {
                      const current = watched.prodi ?? [];
                      form.setValue(
                        "prodi",
                        event.target.checked ? [...current, item] : current.filter((value) => value !== item)
                      );
                    }}
                  />
                  {item}
                </label>
              ))}
            </div>
          ) : null}

          {watched.target === "tahun" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Tahun Mulai" type="number" {...form.register("tahunMulai")} />
              <Input label="Tahun Akhir" type="number" {...form.register("tahunAkhir")} />
            </div>
          ) : null}

          {confirming ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Pastikan isi pesan dan target sudah benar sebelum mengirim broadcast.
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border-8 border-slate-900 bg-slate-950 p-3 text-white shadow-soft">
          <div className="rounded-[20px] bg-white p-4 text-slate-900">
            <p className="text-xs font-semibold text-slate-500">TracerStudy FT UNIHAZ</p>
            <div className="mt-4 rounded-lg bg-navy-50 p-4">
              <p className="font-semibold text-navy">{payload.title}</p>
              <p className="mt-2 text-sm text-slate-600">{payload.body}</p>
            </div>
            <p className="mt-4 text-xs text-slate-500">{recipientCount} penerima</p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
