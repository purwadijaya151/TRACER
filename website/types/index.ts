export type Prodi = "Teknik Mesin" | "Teknik Informatika" | "Teknik Sipil";

export type StatusKerja =
  | "Bekerja"
  | "Wirausaha"
  | "Melanjutkan Studi"
  | "Belum Bekerja";

export type RentangGaji =
  | "Di bawah Rp 2.000.000"
  | "Rp 2.000.000 - Rp 5.000.000"
  | "Rp 5.000.000 - Rp 10.000.000"
  | "Di atas Rp 10.000.000";

export type WaktuTunggu =
  | "Kurang dari 3 bulan"
  | "3 - 6 bulan"
  | "Lebih dari 6 bulan";

export type NotifTarget = "all" | "prodi" | "tahun" | "belum_mengisi";

export interface Alumni {
  id: string;
  nim: string;
  npp?: string | null;
  nama_lengkap: string;
  prodi: Prodi;
  tahun_masuk: number;
  tahun_lulus: number;
  ipk?: number | null;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  no_hp?: string | null;
  email?: string | null;
  alamat?: string | null;
  foto_url?: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  tracer_study?: TracerStudy | TracerStudy[] | null;
}

export interface TracerStudy {
  id: string;
  alumni_id: string;
  status_kerja: StatusKerja;
  nama_perusahaan?: string | null;
  bidang_pekerjaan?: string | null;
  jabatan?: string | null;
  rentang_gaji?: RentangGaji | null;
  provinsi_kerja?: string | null;
  waktu_tunggu?: WaktuTunggu | null;
  kesesuaian_bidang?: number | null;
  nilai_hard_skill?: number | null;
  nilai_soft_skill?: number | null;
  nilai_bahasa_asing?: number | null;
  nilai_it?: number | null;
  nilai_kepemimpinan?: number | null;
  saran_kurikulum?: string | null;
  kesan_kuliah?: string | null;
  is_submitted: boolean;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
  alumni?: Pick<Alumni, "nim" | "nama_lengkap" | "prodi" | "tahun_lulus" | "ipk" | "email" | "no_hp"> | null;
}

export interface Notification {
  id: string;
  alumni_id: string;
  title: string;
  body: string;
  is_read: boolean;
  type: string;
  target_type?: NotifTarget | null;
  target_label?: string | null;
  broadcast_id?: string | null;
  created_at: string;
  alumni?: Pick<Alumni, "nama_lengkap" | "prodi"> | null;
}

export interface NotificationBroadcast {
  id: string;
  title: string;
  body: string;
  target_type: NotifTarget;
  target_label: string;
  total_recipients: number;
  read_count: number;
  created_by?: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_alumni: number;
  sudah_mengisi: number;
  belum_mengisi: number;
  notif_terkirim: number;
  response_by_prodi: { prodi: Prodi; total: number; mengisi: number }[];
  status_kerja_distribution: { status: StatusKerja; count: number }[];
  recent_submissions: TracerStudy[];
}

export interface PengaturanSistem {
  id?: string;
  tracer_study_open: boolean;
  periode_tahun_mulai: number;
  periode_tahun_akhir: number;
  pesan_pengingat: string;
  auto_reminder: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ActionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

export type ReportType = "alumni" | "tracer" | "pekerjaan" | "kompetensi";

export type ReportData =
  | { type: "alumni"; rows: Alumni[] }
  | { type: "tracer"; rows: TracerStudy[] }
  | { type: "pekerjaan"; rows: TracerStudy[] }
  | { type: "kompetensi"; rows: TracerStudy[] };

export interface AlumniFilters {
  search?: string;
  prodi?: Prodi | "all";
  tahun_lulus?: number | "all";
  status?: "all" | "sudah" | "belum";
}

export interface TracerStudyFilters {
  prodi?: Prodi | "all";
  tahun_lulus?: number | "all";
  status_kerja?: StatusKerja | "all";
  tahun_pengisian?: number | "all";
}

export interface NotificationFilters {
  search?: string;
  read?: "all" | "read" | "unread";
}
