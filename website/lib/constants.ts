import type { NotifTarget, Prodi, QuestionType, RentangGaji, StatusKerja, WaktuTunggu } from "@/types";

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

export const NPP_DIGIT_LENGTH = 18;
export const NPP_EXAMPLE = "198001012024011001";
export const NPP_REGEX = /^\d{18}$/;
export const INSTITUTION_EMAIL_DOMAIN = "ft.unihaz.ac.id";
export const NPM_REGEX = /^[0-9.]{5,20}$/;
export const QUESTIONNAIRE_DEFAULT_VERSION = "launch-v1";
export const QUESTION_TYPE_OPTIONS: QuestionType[] = [
  "text",
  "textarea",
  "number",
  "date",
  "single_choice",
  "multi_choice",
  "scale",
  "matrix_pair"
];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: "Teks Pendek",
  textarea: "Teks Panjang",
  number: "Angka",
  date: "Tanggal",
  single_choice: "Pilihan Tunggal",
  multi_choice: "Pilihan Ganda",
  scale: "Skala",
  matrix_pair: "Matriks Pasangan"
};

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
  "/dashboard/pertanyaan": "Pertanyaan",
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
