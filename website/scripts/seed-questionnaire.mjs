import { createClient } from "@supabase/supabase-js";
import { envOrDefault, getAppDir, loadEnvFiles, requiredEnv } from "./lib/env.mjs";

const appDir = getAppDir(import.meta.url);
const env = loadEnvFiles(appDir);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL", env);
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY", env);
const VERSION = envOrDefault("QUESTIONNAIRE_VERSION", "launch-v1", env);
const SOURCE_DESCRIPTION = "Seed dari KUESIONER.docx untuk launch pertama.";

const statusOptions = choices([
  ["1", "Bekerja (full time / part time)"],
  ["2", "Belum memungkinkan bekerja"],
  ["3", "Wiraswasta"],
  ["4", "Melanjutkan Pendidikan"],
  ["5", "Tidak kerja tetapi sedang mencari kerja"]
]);

const relationScale = choices([
  ["1", "Sangat Erat"],
  ["2", "Erat"],
  ["3", "Cukup Erat"],
  ["4", "Kurang Erat"],
  ["5", "Tidak Sama Sekali"]
]);

const educationFitOptions = choices([
  ["1", "Setingkat Lebih Tinggi"],
  ["2", "Tingkat yang Sama"],
  ["3", "Setingkat Lebih Rendah"],
  ["4", "Tidak Perlu Pendidikan Tinggi"]
]);

const competencyScale = choices([
  ["1", "Sangat Rendah"],
  ["2", "Rendah"],
  ["3", "Cukup"],
  ["4", "Tinggi"],
  ["5", "Sangat Tinggi"]
]);

const learningScale = choices([
  ["1", "Sangat Besar"],
  ["2", "Besar"],
  ["3", "Cukup Besar"],
  ["4", "Kurang Besar"],
  ["5", "Tidak Sama Sekali"]
]);

const rows = [
  ...section("status", "Status Alumni", 1, [
    question("f8", "Jelaskan status Anda saat ini", "single_choice", {
      is_required: true,
      options: statusOptions
    })
  ]),
  ...section("work", "Pekerjaan dan Wirausaha", 2, [
    question("f502", "Dalam berapa bulan Anda mendapatkan pekerjaan pertama atau mulai wirausaha?", "number", {
      metadata: { suffix: "bulan" },
      required_when: requiredWhen("f8", ["1", "3"])
    }),
    question("f505", "Berapa rata-rata pendapatan Anda per bulan (take home pay)?", "number", {
      metadata: { suffix: "Rupiah" },
      required_when: requiredWhen("f8", ["1"])
    }),
    question("f5a1", "Provinsi lokasi tempat Anda bekerja", "text", {
      required_when: requiredWhen("f8", ["1"])
    }),
    question("f5a2", "Kota/Kabupaten lokasi tempat Anda bekerja", "text", {
      required_when: requiredWhen("f8", ["1"])
    }),
    question("f1101", "Apa jenis perusahaan/instansi/institusi tempat Anda bekerja sekarang?", "single_choice", {
      options: choices([
        ["1", "Instansi pemerintah"],
        ["2", "Organisasi non-profit/Lembaga Swadaya Masyarakat"],
        ["3", "Perusahaan swasta"],
        ["4", "Wiraswasta/perusahaan sendiri"],
        ["6", "BUMN/BUMD"],
        ["7", "Institusi/Organisasi Multilateral"],
        ["5", "Lainnya"]
      ]),
      required_when: requiredWhen("f8", ["1"])
    }),
    question("f1102", "Jenis perusahaan lainnya", "text", {
      required_when: requiredWhen("f1101", ["5"])
    }),
    question("f5b", "Apa nama perusahaan/kantor tempat Anda bekerja?", "text", {
      required_when: requiredWhen("f8", ["1"])
    }),
    question("f5c", "Bila berwiraswasta, apa posisi/jabatan Anda saat ini?", "text", {
      required_when: requiredWhen("f8", ["3"])
    }),
    question("f5d", "Apa tingkat tempat kerja Anda?", "text", {
      required_when: requiredWhen("f8", ["1", "3"])
    })
  ]),
  ...section("education", "Studi Lanjut dan Pembiayaan", 3, [
    question("f18a", "Sumber biaya studi lanjut", "text", {
      required_when: requiredWhen("f8", ["4"])
    }),
    question("f18b", "Perguruan tinggi studi lanjut", "text", {
      required_when: requiredWhen("f8", ["4"])
    }),
    question("f18c", "Program studi lanjut", "text", {
      required_when: requiredWhen("f8", ["4"])
    }),
    question("f18d", "Tanggal masuk studi lanjut", "date", {
      required_when: requiredWhen("f8", ["4"])
    }),
    question("f1201", "Sebutkan sumber dana dalam pembiayaan kuliah (bukan ketika studi lanjut)", "single_choice", {
      is_required: true,
      options: choices([
        ["1", "Biaya Sendiri/Keluarga"],
        ["2", "Beasiswa ADIK"],
        ["3", "Beasiswa BIDIKMISI"],
        ["4", "Beasiswa PPA"],
        ["5", "Beasiswa AFIRMASI"],
        ["6", "Beasiswa Perusahaan/Swasta"],
        ["7", "Lainnya"]
      ])
    }),
    question("f14", "Seberapa erat hubungan bidang studi dengan pekerjaan Anda?", "single_choice", {
      options: relationScale,
      required_when: requiredWhen("f8", ["1"])
    }),
    question("f15", "Tingkat pendidikan apa yang paling tepat/sesuai untuk pekerjaan Anda saat ini?", "single_choice", {
      options: educationFitOptions,
      required_when: requiredWhen("f8", ["1"])
    })
  ]),
  ...section("competency", "Kompetensi dan Metode Pembelajaran", 4, [
    question("competency_matrix", "Tingkat kompetensi yang dikuasai saat lulus (A) dan diperlukan dalam pekerjaan (B)", "matrix_pair", {
      is_required: true,
      metadata: {
        leftLabel: "A. Dikuasai saat lulus",
        rightLabel: "B. Diperlukan dalam pekerjaan"
      },
      options: {
        leftLabel: "A. Dikuasai saat lulus",
        rightLabel: "B. Diperlukan dalam pekerjaan",
        scale: competencyScale,
        rows: [
          { label: "Etika", leftField: "f1761", rightField: "f1762" },
          { label: "Keahlian berdasarkan bidang ilmu", leftField: "f1763", rightField: "f1764" },
          { label: "Bahasa Inggris", leftField: "f1765", rightField: "f1766" },
          { label: "Penggunaan Teknologi Informasi", leftField: "f1767", rightField: "f1768" },
          { label: "Komunikasi", leftField: "f1769", rightField: "f1770" },
          { label: "Kerja sama tim", leftField: "f1771", rightField: "f1772" },
          { label: "Pengembangan", leftField: "f1773", rightField: "f1774" }
        ]
      }
    }),
    question("f21", "Penekanan metode pembelajaran: Perkuliahan", "scale", {
      is_required: true,
      options: learningScale
    }),
    question("f22", "Penekanan metode pembelajaran: Demonstrasi", "scale", {
      is_required: true,
      options: learningScale
    }),
    question("f23", "Penekanan metode pembelajaran: Partisipasi dalam proyek riset", "scale", {
      is_required: true,
      options: learningScale
    }),
    question("f24", "Penekanan metode pembelajaran: Magang", "scale", {
      is_required: true,
      options: learningScale
    }),
    question("f25", "Penekanan metode pembelajaran: Praktikum", "scale", {
      is_required: true,
      options: learningScale
    }),
    question("f26", "Penekanan metode pembelajaran: Kerja Lapangan", "scale", {
      is_required: true,
      options: learningScale
    }),
    question("f27", "Penekanan metode pembelajaran: Diskusi", "scale", {
      is_required: true,
      options: learningScale
    })
  ]),
  ...section("job_search", "Pencarian Kerja", 5, [
    question("f301", "Kapan Anda mulai mencari pekerjaan? Mohon pekerjaan sambilan tidak dimasukkan", "single_choice", {
      is_required: true,
      options: choices([
        ["1", "Kira-kira beberapa bulan sebelum lulus"],
        ["2", "Kira-kira beberapa bulan sesudah lulus"],
        ["3", "Saya tidak mencari kerja"]
      ])
    }),
    question("f302", "Jumlah bulan sebelum lulus", "number", {
      metadata: { suffix: "bulan" },
      required_when: requiredWhen("f301", ["1"])
    }),
    question("f303", "Jumlah bulan sesudah lulus", "number", {
      metadata: { suffix: "bulan" },
      required_when: requiredWhen("f301", ["2"])
    }),
    question("job_search_methods", "Bagaimana Anda mencari pekerjaan tersebut? Jawaban bisa lebih dari satu", "multi_choice", {
      options: multiChoices([
        ["f401", "Melalui iklan di koran/majalah, brosur"],
        ["f402", "Melamar ke perusahaan tanpa mengetahui lowongan yang ada"],
        ["f403", "Pergi ke bursa/pameran kerja"],
        ["f404", "Mencari lewat internet/iklan online/milis"],
        ["f405", "Dihubungi oleh perusahaan"],
        ["f406", "Menghubungi Kemenakertrans"],
        ["f407", "Menghubungi agen tenaga kerja komersial/swasta"],
        ["f408", "Memperoleh informasi dari pusat/kantor pengembangan karir fakultas/universitas"],
        ["f409", "Menghubungi kantor kemahasiswaan/hubungan alumni"],
        ["f410", "Membangun jejaring/network sejak masih kuliah"],
        ["f411", "Melalui relasi (misalnya dosen, orang tua, saudara, teman, dll.)"],
        ["f412", "Membangun bisnis sendiri"],
        ["f413", "Melalui penempatan kerja atau magang"],
        ["f414", "Bekerja di tempat yang sama dengan tempat kerja semasa kuliah"],
        ["f415", "Lainnya"]
      ])
    }),
    question("f6", "Berapa perusahaan/instansi/institusi yang sudah Anda lamar (lewat surat atau e-mail) sebelum Anda memperoleh pekerjaan pertama?", "number", {
      metadata: { suffix: "perusahaan/instansi/institusi" }
    }),
    question("f7", "Berapa banyak perusahaan/instansi/institusi yang merespons lamaran Anda?", "number", {
      metadata: { suffix: "perusahaan/instansi/institusi" }
    }),
    question("f7a", "Berapa banyak perusahaan/instansi/institusi yang mengundang Anda untuk wawancara?", "number", {
      metadata: { suffix: "perusahaan/instansi/institusi" }
    }),
    question("f1001", "Apakah Anda aktif mencari pekerjaan dalam 4 minggu terakhir? Pilihlah satu jawaban", "single_choice", {
      options: choices([
        ["1", "Tidak"],
        ["2", "Tidak, tapi saya sedang menunggu hasil lamaran kerja"],
        ["3", "Ya, saya akan mulai bekerja dalam 2 minggu ke depan"],
        ["4", "Ya, tapi saya belum pasti akan bekerja dalam 2 minggu ke depan"],
        ["5", "Lainnya"]
      ])
    }),
    question("f1002", "Aktivitas pencarian kerja lainnya", "text", {
      required_when: requiredWhen("f1001", ["5"])
    })
  ]),
  ...section("fit_reason", "Kesesuaian Pekerjaan", 6, [
    question("education_mismatch_reasons", "Jika pekerjaan Anda saat ini tidak sesuai dengan pendidikan Anda, mengapa Anda mengambilnya? Jawaban bisa lebih dari satu", "multi_choice", {
      options: multiChoices([
        ["f1601", "Pertanyaan tidak sesuai; pekerjaan saya sekarang sudah sesuai dengan pendidikan saya"],
        ["f1602", "Saya belum mendapatkan pekerjaan yang lebih sesuai"],
        ["f1603", "Di pekerjaan ini saya memperoleh prospek karir yang baik"],
        ["f1604", "Saya lebih suka bekerja di area pekerjaan yang tidak ada hubungannya dengan pendidikan saya"],
        ["f1605", "Saya dipromosikan ke posisi yang kurang berhubungan dengan pendidikan saya dibanding posisi sebelumnya"],
        ["f1606", "Saya dapat memperoleh pendapatan yang lebih tinggi di pekerjaan ini"],
        ["f1607", "Pekerjaan saya saat ini lebih aman/terjamin/secure"],
        ["f1608", "Pekerjaan saya saat ini lebih menarik"],
        ["f1609", "Pekerjaan saya saat ini lebih memungkinkan saya mengambil pekerjaan tambahan/jadwal yang fleksibel, dll."],
        ["f1610", "Pekerjaan saya saat ini lokasinya lebih dekat dari rumah saya"],
        ["f1611", "Pekerjaan saya saat ini dapat lebih menjamin kebutuhan keluarga saya"],
        ["f1612", "Pada awal meniti karir ini, saya harus menerima pekerjaan yang tidak berhubungan dengan pendidikan saya"],
        ["f1613", "Lainnya"]
      ])
    }),
    question("f1614", "Alasan lainnya", "text", {
      required_when: requiredWhen("f1613", ["1"])
    })
  ])
];

validateRows(rows);

if (dryRun) {
  printSummary("Dry run: tidak ada data yang dikirim", rows);
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data: upsertedRows, error: upsertError } = await supabase
  .from("questionnaire_questions")
  .upsert(rows, { onConflict: "questionnaire_version,code" })
  .select("code,section_id,section_order,order_index")
  .order("section_order", { ascending: true })
  .order("order_index", { ascending: true })
  .order("code", { ascending: true });

if (upsertError) {
  throw new Error(`Gagal seed pertanyaan: ${upsertError.message}`);
}

const { data: remoteRows, error: verifyError } = await supabase
  .from("questionnaire_questions")
  .select("code,is_active,section_id,section_order,order_index")
  .eq("questionnaire_version", VERSION)
  .order("section_order", { ascending: true })
  .order("order_index", { ascending: true })
  .order("code", { ascending: true });

if (verifyError) {
  throw new Error(`Seed masuk, tapi verifikasi gagal: ${verifyError.message}`);
}

printSummary("Seed pertanyaan selesai", rows, upsertedRows ?? [], remoteRows ?? []);

function section(sectionId, sectionTitle, sectionOrder, questions) {
  return questions.map((item, index) => ({
    questionnaire_version: VERSION,
    code: item.code,
    section_id: sectionId,
    section_title: sectionTitle,
    section_order: sectionOrder,
    order_index: index + 1,
    question_text: item.question_text,
    description: SOURCE_DESCRIPTION,
    question_type: item.question_type,
    is_required: item.is_required ?? false,
    is_active: item.is_active ?? true,
    options: item.options ?? [],
    required_when: item.required_when ?? null,
    metadata: item.metadata ?? null
  }));
}

function question(code, questionText, questionType, extra = {}) {
  return {
    code,
    question_text: questionText,
    question_type: questionType,
    ...extra
  };
}

function choices(items) {
  return items.map(([value, label]) => ({ value, label }));
}

function multiChoices(items) {
  return items.map(([field, label]) => ({ field, value: "1", label }));
}

function requiredWhen(field, values) {
  return { field, values };
}

function validateRows(questionRows) {
  const duplicateKeys = findDuplicates(questionRows.map((row) => `${row.questionnaire_version}:${row.code}`));
  if (duplicateKeys.length > 0) {
    throw new Error(`Kode pertanyaan duplikat: ${duplicateKeys.join(", ")}`);
  }

  const invalidRows = questionRows.filter((row) => {
    return !row.code || !row.section_id || !row.section_title || !row.question_text || !row.question_type;
  });

  if (invalidRows.length > 0) {
    throw new Error(`Ada ${invalidRows.length} baris pertanyaan tidak lengkap`);
  }
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return Array.from(duplicates);
}

function printSummary(title, seedRows, upsertedRows = [], remoteRows = []) {
  const seedCodes = new Set(seedRows.map((row) => row.code));
  const activeRemoteRows = remoteRows.filter((row) => row.is_active);
  const extraCodes = remoteRows
    .map((row) => row.code)
    .filter((code) => !seedCodes.has(code));

  console.log(title);
  console.log(`Version: ${VERSION}`);
  console.log(`Seed rows: ${seedRows.length}`);
  if (upsertedRows.length > 0) console.log(`Upserted rows: ${upsertedRows.length}`);
  if (remoteRows.length > 0) {
    console.log(`Remote rows for version: ${remoteRows.length}`);
    console.log(`Remote active rows for version: ${activeRemoteRows.length}`);
  }
  if (extraCodes.length > 0) {
    console.log(`Catatan: ada ${extraCodes.length} kode tambahan di remote yang tidak ada di seed ini: ${extraCodes.join(", ")}`);
  }
}
