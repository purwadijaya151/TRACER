"use client";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { Modal } from "@/components/ui/Modal";
import { StarRating } from "@/components/ui/StarRating";
import { cn } from "@/lib/utils";
import type { TracerStudy } from "@/types";

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value || "-"}</p>
    </div>
  );
}

const tabs = ["Data Pribadi", "Data Pekerjaan", "Kompetensi", "Saran"];

export function TracerStudyDetailModal({
  row,
  open,
  onClose
}: {
  row: TracerStudy | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!row) return null;

  return (
    <Modal open={open} onClose={onClose} title="Detail Tracer Study" size="xl">
      <TabGroup>
        <TabList className="mb-5 flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          {tabs.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                cn(
                  "focus-ring rounded-md px-3 py-2 text-sm font-semibold",
                  selected ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel className="grid gap-4 sm:grid-cols-2">
            <Field label="NPM" value={row.alumni?.nim} />
            <Field label="Nama" value={row.alumni?.nama_lengkap} />
            <Field label="Prodi" value={row.alumni?.prodi} />
            <Field label="Tahun Lulus" value={row.alumni?.tahun_lulus} />
            <Field label="IPK" value={row.alumni?.ipk} />
            <Field label="Email" value={row.alumni?.email} />
          </TabPanel>
          <TabPanel className="grid gap-4 sm:grid-cols-2">
            <Field label="Status Kerja" value={row.status_kerja} />
            <Field label="Perusahaan" value={row.nama_perusahaan} />
            <Field label="Bidang" value={row.bidang_pekerjaan} />
            <Field label="Jabatan" value={row.jabatan} />
            <Field label="Gaji" value={row.rentang_gaji} />
            <Field label="Provinsi" value={row.provinsi_kerja} />
            <Field label="Waktu Tunggu" value={row.waktu_tunggu} />
          </TabPanel>
          <TabPanel className="grid gap-4 sm:grid-cols-2">
            <Field label="Kesesuaian Bidang" value={<StarRating value={row.kesesuaian_bidang} />} />
            <Field label="Hard Skill" value={<StarRating value={row.nilai_hard_skill} />} />
            <Field label="Soft Skill" value={<StarRating value={row.nilai_soft_skill} />} />
            <Field label="Bahasa Asing" value={<StarRating value={row.nilai_bahasa_asing} />} />
            <Field label="IT" value={<StarRating value={row.nilai_it} />} />
            <Field label="Kepemimpinan" value={<StarRating value={row.nilai_kepemimpinan} />} />
          </TabPanel>
          <TabPanel className="space-y-4">
            <Field label="Saran Kurikulum" value={row.saran_kurikulum} />
            <Field label="Kesan Kuliah" value={row.kesan_kuliah} />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Modal>
  );
}
