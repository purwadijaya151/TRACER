import { z } from "zod";
import {
  NPP_DIGIT_LENGTH,
  NPP_REGEX,
  QUESTIONNAIRE_DEFAULT_VERSION,
  QUESTION_TYPE_OPTIONS,
  PRODI_OPTIONS,
  RENTANG_GAJI_OPTIONS,
  STATUS_KERJA_OPTIONS,
  WAKTU_TUNGGU_OPTIONS
} from "@/lib/constants";

export const loginSchema = z.object({
  npp: z
    .string()
    .trim()
    .regex(NPP_REGEX, `NPP harus ${NPP_DIGIT_LENGTH} digit angka`),
  password: z.string().min(6, "Password minimal 6 karakter")
});

export const alumniSchema = z.object({
  nim: z.string().min(3, "NPM wajib diisi").max(20),
  nama_lengkap: z.string().min(3, "Nama wajib diisi").max(100),
  prodi: z.enum(PRODI_OPTIONS as [string, ...string[]]),
  tahun_masuk: z.coerce.number().int().min(1980).max(2100),
  tahun_lulus: z.coerce.number().int().min(1980).max(2100),
  ipk: z.coerce.number().min(0).max(4).optional().nullable(),
  tempat_lahir: z.string().max(100).optional().nullable(),
  tanggal_lahir: z.string().optional().nullable(),
  no_hp: z.string().max(20).optional().nullable(),
  email: z.string().trim().email("Email tidak valid"),
  alamat: z.string().optional().nullable(),
  foto_url: z.string().url().optional().nullable().or(z.literal("")),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal(""))
});

export const alumniUpdateSchema = alumniSchema.omit({ password: true });

export const notificationSchema = z
  .object({
    title: z.string().min(3, "Judul wajib diisi").max(200),
    body: z.string().min(5, "Pesan wajib diisi"),
    target: z.enum(["all", "prodi", "tahun", "belum_mengisi"]),
    prodi: z.array(z.enum(PRODI_OPTIONS as [string, ...string[]])).optional(),
    tahunMulai: z.coerce.number().int().min(1980).max(2100).optional(),
    tahunAkhir: z.coerce.number().int().min(1980).max(2100).optional()
  })
  .superRefine((data, ctx) => {
    if (data.target === "prodi" && !data.prodi?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pilih minimal satu prodi",
        path: ["prodi"]
      });
    }

    if (data.target === "tahun") {
      if (!data.tahunMulai || !data.tahunAkhir) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rentang tahun lulus wajib diisi",
          path: ["tahunMulai"]
        });
        return;
      }

      if (data.tahunMulai > data.tahunAkhir) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tahun mulai tidak boleh lebih besar dari tahun akhir",
          path: ["tahunAkhir"]
        });
      }
    }
  });

export const tracerStudyFilterSchema = z.object({
  prodi: z.enum(["all", ...PRODI_OPTIONS] as [string, ...string[]]).optional(),
  tahun_lulus: z.union([z.literal("all"), z.coerce.number().int()]).optional(),
  status_kerja: z.enum(["all", ...STATUS_KERJA_OPTIONS] as [string, ...string[]]).optional(),
  tahun_pengisian: z.union([z.literal("all"), z.coerce.number().int()]).optional()
});

export const reportFilterSchema = z.object({
  prodi: z.array(z.enum(PRODI_OPTIONS as [string, ...string[]])).optional(),
  tahunMulai: z.coerce.number().int().optional(),
  tahunAkhir: z.coerce.number().int().optional(),
  tahunPengisian: z.coerce.number().int().optional(),
  status_kerja: z.enum(["all", ...STATUS_KERJA_OPTIONS] as [string, ...string[]]).optional()
}).refine((data) => !data.tahunMulai || !data.tahunAkhir || data.tahunMulai <= data.tahunAkhir, {
  message: "Tahun mulai tidak boleh lebih besar dari tahun akhir",
  path: ["tahunAkhir"]
});

export const pengaturanSchema = z.object({
  tracer_study_open: z.boolean(),
  periode_tahun_mulai: z.coerce.number().int().min(1980).max(2100),
  periode_tahun_akhir: z.coerce.number().int().min(1980).max(2100),
  pesan_pengingat: z.string().min(5),
  auto_reminder: z.boolean()
});

export const profileSchema = z.object({
  nama_lengkap: z.string().min(3).max(100),
  email: z.string().email(),
  no_hp: z.string().max(20).optional().nullable(),
  foto_url: z.string().url().optional().nullable().or(z.literal(""))
});

export const passwordSchema = z
  .object({
    oldPassword: z.string().min(6),
    newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
    confirmPassword: z.string().min(8)
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"]
  });

export const tracerStudySchema = z.object({
  status_kerja: z.enum(STATUS_KERJA_OPTIONS as [string, ...string[]]),
  rentang_gaji: z.enum(RENTANG_GAJI_OPTIONS as [string, ...string[]]).optional().nullable(),
  waktu_tunggu: z.enum(WAKTU_TUNGGU_OPTIONS as [string, ...string[]]).optional().nullable()
});

export const questionnaireQuestionSchema = z.object({
  questionnaire_version: z.string().trim().min(2).max(40).default(QUESTIONNAIRE_DEFAULT_VERSION),
  code: z
    .string()
    .trim()
    .min(1, "Kode pertanyaan wajib diisi")
    .max(60)
    .regex(/^[A-Za-z0-9_.-]+$/, "Kode hanya boleh huruf, angka, titik, garis bawah, atau minus"),
  section_id: z
    .string()
    .trim()
    .min(1, "Kode section wajib diisi")
    .max(60)
    .regex(/^[A-Za-z0-9_.-]+$/, "Kode section hanya boleh huruf, angka, titik, garis bawah, atau minus"),
  section_title: z.string().trim().min(3, "Nama section wajib diisi").max(120),
  section_order: z.coerce.number().int().min(1).max(999),
  order_index: z.coerce.number().int().min(1).max(9999),
  question_text: z.string().trim().min(5, "Pertanyaan wajib diisi").max(600),
  description: z.string().max(500).optional().nullable(),
  question_type: z.enum(QUESTION_TYPE_OPTIONS as [string, ...string[]]),
  is_required: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true),
  options_text: z.string().max(5000).optional().nullable(),
  matrix_rows_text: z.string().max(5000).optional().nullable(),
  required_when_field: z.string().max(60).optional().nullable(),
  required_when_values: z.string().max(500).optional().nullable(),
  suffix: z.string().max(40).optional().nullable(),
  matrix_left_label: z.string().max(80).optional().nullable(),
  matrix_right_label: z.string().max(80).optional().nullable()
});
