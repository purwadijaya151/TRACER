"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { createAlumni, updateAlumni } from "@/lib/actions/alumni.actions";
import { PRODI_OPTIONS } from "@/lib/constants";
import { alumniSchema } from "@/lib/validation";
import type { Alumni } from "@/types";

type FormValues = z.infer<typeof alumniSchema>;

export function AlumniModal({
  open,
  alumni,
  onClose,
  onSaved
}: {
  open: boolean;
  alumni: Alumni | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(alumniSchema),
    defaultValues: {
      nim: "",
      nama_lengkap: "",
      prodi: "Teknik Informatika",
      tahun_masuk: new Date().getFullYear() - 4,
      tahun_lulus: new Date().getFullYear(),
      password: ""
    }
  });

  useEffect(() => {
    if (!open) return;
    if (alumni) {
      form.reset({
        nim: alumni.nim,
        nama_lengkap: alumni.nama_lengkap,
        prodi: alumni.prodi,
        tahun_masuk: alumni.tahun_masuk,
        tahun_lulus: alumni.tahun_lulus,
        ipk: alumni.ipk ?? undefined,
        tempat_lahir: alumni.tempat_lahir ?? "",
        tanggal_lahir: alumni.tanggal_lahir ?? "",
        no_hp: alumni.no_hp ?? "",
        email: alumni.email ?? "",
        alamat: alumni.alamat ?? "",
        foto_url: alumni.foto_url ?? "",
        password: ""
      });
    } else {
      form.reset({
        nim: "",
        nama_lengkap: "",
        prodi: "Teknik Informatika",
        tahun_masuk: new Date().getFullYear() - 4,
        tahun_lulus: new Date().getFullYear(),
        ipk: undefined,
        tempat_lahir: "",
        tanggal_lahir: "",
        no_hp: "",
        email: "",
        alamat: "",
        foto_url: "",
        password: ""
      });
    }
  }, [alumni, form, open]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const result = alumni ? await updateAlumni(alumni.id, values) : await createAlumni(values);
    setLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(alumni ? "Data alumni diperbarui" : "Data alumni dibuat");
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={alumni ? "Edit Alumni" : "Tambah Alumni"}
      size="xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button loading={loading} onClick={form.handleSubmit(onSubmit)}>Simpan</Button>
        </div>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <Input label="NPM" error={form.formState.errors.nim?.message} {...form.register("nim")} />
        <Input label="Nama Lengkap" error={form.formState.errors.nama_lengkap?.message} {...form.register("nama_lengkap")} />
        <Select label="Prodi" error={form.formState.errors.prodi?.message} {...form.register("prodi")}>
          {PRODI_OPTIONS.map((prodi) => <option key={prodi}>{prodi}</option>)}
        </Select>
        <Input label="Email" type="email" error={form.formState.errors.email?.message} {...form.register("email")} />
        <Input label="Tahun Masuk" type="number" error={form.formState.errors.tahun_masuk?.message} {...form.register("tahun_masuk")} />
        <Input label="Tahun Lulus" type="number" error={form.formState.errors.tahun_lulus?.message} {...form.register("tahun_lulus")} />
        <Input label="IPK" type="number" step="0.01" error={form.formState.errors.ipk?.message} {...form.register("ipk")} />
        {!alumni ? (
          <Input label="Password Awal" type="password" error={form.formState.errors.password?.message} {...form.register("password")} />
        ) : null}
        <Input label="Tempat Lahir" error={form.formState.errors.tempat_lahir?.message} {...form.register("tempat_lahir")} />
        <Input label="Tanggal Lahir" type="date" error={form.formState.errors.tanggal_lahir?.message} {...form.register("tanggal_lahir")} />
        <Input label="No HP" error={form.formState.errors.no_hp?.message} {...form.register("no_hp")} />
        <Input label="URL Foto" error={form.formState.errors.foto_url?.message} {...form.register("foto_url")} />
        <div className="sm:col-span-2">
          <Textarea label="Alamat" error={form.formState.errors.alamat?.message} {...form.register("alamat")} />
        </div>
      </form>
    </Modal>
  );
}
