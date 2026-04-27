import type { NotifTarget, Prodi, RentangGaji, StatusKerja, WaktuTunggu } from "@/types";

export const PRODI_OPTIONS: Prodi[] = [
  "Teknik Mesin",
  "Teknik Informatika",
  "Teknik Sipil"
];

export const STATUS_KERJA_OPTIONS: StatusKerja[] = [
  "Bekerja",
  "Wirausaha",
  "Melanjutkan Studi",
  "Belum Bekerja"
];

export const RENTANG_GAJI_OPTIONS: RentangGaji[] = [
  "Di bawah Rp 2.000.000",
  "Rp 2.000.000 - Rp 5.000.000",
  "Rp 5.000.000 - Rp 10.000.000",
  "Di atas Rp 10.000.000"
];

export const WAKTU_TUNGGU_OPTIONS: WaktuTunggu[] = [
  "Kurang dari 3 bulan",
  "3 - 6 bulan",
  "Lebih dari 6 bulan"
];

export const NOTIF_TARGET_LABELS: Record<NotifTarget, string> = {
  all: "Semua Alumni",
  prodi: "Per Prodi",
  tahun: "Per Tahun Lulus",
  belum_mengisi: "Belum Mengisi Saja"
};

export const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/alumni": "Data Alumni",
  "/dashboard/tracer-study": "Tracer Study",
  "/dashboard/notifikasi": "Notifikasi",
  "/dashboard/laporan": "Laporan",
  "/dashboard/pengaturan": "Pengaturan"
};

export const INDONESIAN_ERRORS = {
  load: "Gagal memuat data, silakan refresh halaman",
  save: "Gagal menyimpan data, coba lagi",
  session: "Sesi habis, silakan login kembali",
  admin: "Anda tidak memiliki akses admin",
  credentials: "NPP atau password salah"
} as const;
