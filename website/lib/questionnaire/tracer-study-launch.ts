export type AnswerPrimitive = string | number | boolean | null | undefined;
export type AnswerMap = Record<string, AnswerPrimitive>;

export type ChoiceOption = {
  value: string;
  label: string;
};

export type BaseQuestion = {
  id: string;
  code?: string;
  label: string;
  required?: boolean;
  requiredWhen?: {
    field: string;
    values: string[];
  };
};

export type TextQuestion = BaseQuestion & {
  type: "text" | "number" | "date";
  suffix?: string;
};

export type ChoiceQuestion = BaseQuestion & {
  type: "single_choice";
  options: ChoiceOption[];
  otherField?: string;
};

export type MultiChoiceQuestion = BaseQuestion & {
  type: "multi_choice";
  options: Array<ChoiceOption & { field: string }>;
  otherField?: string;
};

export type ScaleQuestion = BaseQuestion & {
  type: "scale";
  scale: ChoiceOption[];
};

export type MatrixPairQuestion = BaseQuestion & {
  type: "matrix_pair";
  leftLabel: string;
  rightLabel: string;
  scale: ChoiceOption[];
  rows: Array<{
    label: string;
    leftField: string;
    rightField: string;
  }>;
};

export type QuestionnaireQuestion =
  | TextQuestion
  | ChoiceQuestion
  | MultiChoiceQuestion
  | ScaleQuestion
  | MatrixPairQuestion;

export type QuestionnaireSection = {
  id: string;
  title: string;
  description?: string;
  questions: QuestionnaireQuestion[];
};

export const statusOptions: ChoiceOption[] = [
  { value: "1", label: "Bekerja (full time / part time)" },
  { value: "2", label: "Belum memungkinkan bekerja" },
  { value: "3", label: "Wiraswasta" },
  { value: "4", label: "Melanjutkan Pendidikan" },
  { value: "5", label: "Tidak kerja tetapi sedang mencari kerja" }
];

const relationScale: ChoiceOption[] = [
  { value: "1", label: "Sangat Erat" },
  { value: "2", label: "Erat" },
  { value: "3", label: "Cukup Erat" },
  { value: "4", label: "Kurang Erat" },
  { value: "5", label: "Tidak Sama Sekali" }
];

const educationFitOptions: ChoiceOption[] = [
  { value: "1", label: "Setingkat Lebih Tinggi" },
  { value: "2", label: "Tingkat yang Sama" },
  { value: "3", label: "Setingkat Lebih Rendah" },
  { value: "4", label: "Tidak Perlu Pendidikan Tinggi" }
];

const competencyScale: ChoiceOption[] = [
  { value: "1", label: "Sangat Rendah" },
  { value: "2", label: "Rendah" },
  { value: "3", label: "Cukup" },
  { value: "4", label: "Tinggi" },
  { value: "5", label: "Sangat Tinggi" }
];

const learningScale: ChoiceOption[] = [
  { value: "1", label: "Sangat Besar" },
  { value: "2", label: "Besar" },
  { value: "3", label: "Cukup Besar" },
  { value: "4", label: "Kurang Besar" },
  { value: "5", label: "Tidak Sama Sekali" }
];

export const tracerStudyQuestionnaire: {
  version: string;
  title: string;
  sections: QuestionnaireSection[];
} = {
  version: "launch-v1",
  title: "Kuesioner Tracer Study Launch Pertama",
  sections: [
    {
      id: "status",
      title: "Status Alumni",
      questions: [
        {
          id: "f8",
          code: "f8",
          type: "single_choice",
          label: "Jelaskan status Anda saat ini",
          required: true,
          options: statusOptions
        }
      ]
    },
    {
      id: "work",
      title: "Pekerjaan dan Wirausaha",
      questions: [
        {
          id: "f502",
          code: "f502",
          type: "number",
          label: "Dalam berapa bulan Anda mendapatkan pekerjaan pertama atau mulai wirausaha?",
          suffix: "bulan",
          requiredWhen: { field: "f8", values: ["1", "3"] }
        },
        {
          id: "f505",
          code: "f505",
          type: "number",
          label: "Berapa rata-rata pendapatan Anda per bulan (take home pay)?",
          requiredWhen: { field: "f8", values: ["1"] }
        },
        {
          id: "f5a1",
          code: "f5a1",
          type: "text",
          label: "Provinsi lokasi tempat Anda bekerja",
          requiredWhen: { field: "f8", values: ["1"] }
        },
        {
          id: "f5a2",
          code: "f5a2",
          type: "text",
          label: "Kota/Kabupaten lokasi tempat Anda bekerja",
          requiredWhen: { field: "f8", values: ["1"] }
        },
        {
          id: "f1101",
          code: "f1101",
          type: "single_choice",
          label: "Apa jenis perusahaan/instansi/institusi tempat Anda bekerja sekarang?",
          requiredWhen: { field: "f8", values: ["1"] },
          otherField: "f1102",
          options: [
            { value: "1", label: "Instansi pemerintah" },
            { value: "2", label: "Organisasi non-profit/Lembaga Swadaya Masyarakat" },
            { value: "3", label: "Perusahaan swasta" },
            { value: "4", label: "Wiraswasta/perusahaan sendiri" },
            { value: "6", label: "BUMN/BUMD" },
            { value: "7", label: "Institusi/Organisasi Multilateral" },
            { value: "5", label: "Lainnya" }
          ]
        },
        {
          id: "f1102",
          code: "f1102",
          type: "text",
          label: "Jenis perusahaan lainnya",
          requiredWhen: { field: "f1101", values: ["5"] }
        },
        {
          id: "f5b",
          code: "f5b",
          type: "text",
          label: "Apa nama perusahaan/kantor tempat Anda bekerja?",
          requiredWhen: { field: "f8", values: ["1"] }
        },
        {
          id: "f5c",
          code: "f5c",
          type: "text",
          label: "Bila berwiraswasta, apa posisi/jabatan Anda saat ini?",
          requiredWhen: { field: "f8", values: ["3"] }
        },
        {
          id: "f5d",
          code: "f5d",
          type: "text",
          label: "Apa tingkat tempat kerja Anda?",
          requiredWhen: { field: "f8", values: ["1", "3"] }
        }
      ]
    },
    {
      id: "education",
      title: "Studi Lanjut dan Pembiayaan",
      questions: [
        {
          id: "f18a",
          code: "f18a",
          type: "text",
          label: "Sumber biaya studi lanjut",
          requiredWhen: { field: "f8", values: ["4"] }
        },
        {
          id: "f18b",
          code: "f18b",
          type: "text",
          label: "Perguruan tinggi studi lanjut",
          requiredWhen: { field: "f8", values: ["4"] }
        },
        {
          id: "f18c",
          code: "f18c",
          type: "text",
          label: "Program studi lanjut",
          requiredWhen: { field: "f8", values: ["4"] }
        },
        {
          id: "f18d",
          code: "f18d",
          type: "date",
          label: "Tanggal masuk studi lanjut",
          requiredWhen: { field: "f8", values: ["4"] }
        },
        {
          id: "f1201",
          code: "f1201",
          type: "single_choice",
          label: "Sebutkan sumber dana dalam pembiayaan kuliah (bukan ketika studi lanjut)",
          required: true,
          options: [
            { value: "1", label: "Biaya Sendiri/Keluarga" },
            { value: "2", label: "Beasiswa ADIK" },
            { value: "3", label: "Beasiswa BIDIKMISI" },
            { value: "4", label: "Beasiswa PPA" },
            { value: "5", label: "Beasiswa AFIRMASI" },
            { value: "6", label: "Beasiswa Perusahaan/Swasta" },
            { value: "7", label: "Lainnya" }
          ]
        },
        {
          id: "f14",
          code: "f14",
          type: "single_choice",
          label: "Seberapa erat hubungan bidang studi dengan pekerjaan Anda?",
          requiredWhen: { field: "f8", values: ["1"] },
          options: relationScale
        },
        {
          id: "f15",
          code: "f15",
          type: "single_choice",
          label: "Tingkat pendidikan apa yang paling tepat/sesuai untuk pekerjaan Anda saat ini?",
          requiredWhen: { field: "f8", values: ["1"] },
          options: educationFitOptions
        }
      ]
    },
    {
      id: "competency",
      title: "Kompetensi dan Metode Pembelajaran",
      questions: [
        {
          id: "competency_matrix",
          type: "matrix_pair",
          label: "Pada saat lulus, tingkat kompetensi yang Anda kuasai (A), dan saat ini tingkat kompetensi yang diperlukan dalam pekerjaan (B)",
          required: true,
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
        },
        ...[
          ["f21", "Perkuliahan"],
          ["f22", "Demonstrasi"],
          ["f23", "Partisipasi dalam proyek riset"],
          ["f24", "Magang"],
          ["f25", "Praktikum"],
          ["f26", "Kerja Lapangan"],
          ["f27", "Diskusi"]
        ].map(([id, label]) => ({
          id,
          code: id,
          type: "scale" as const,
          label: `Penekanan metode pembelajaran: ${label}`,
          required: true,
          scale: learningScale
        }))
      ]
    },
    {
      id: "job_search",
      title: "Pencarian Kerja",
      questions: [
        {
          id: "f301",
          code: "f301",
          type: "single_choice",
          label: "Kapan Anda mulai mencari pekerjaan? Mohon pekerjaan sambilan tidak dimasukkan",
          required: true,
          options: [
            { value: "1", label: "Kira-kira beberapa bulan sebelum lulus" },
            { value: "2", label: "Kira-kira beberapa bulan sesudah lulus" },
            { value: "3", label: "Saya tidak mencari kerja" }
          ]
        },
        {
          id: "f302",
          code: "f302",
          type: "number",
          label: "Jumlah bulan sebelum lulus",
          suffix: "bulan",
          requiredWhen: { field: "f301", values: ["1"] }
        },
        {
          id: "f303",
          code: "f303",
          type: "number",
          label: "Jumlah bulan sesudah lulus",
          suffix: "bulan",
          requiredWhen: { field: "f301", values: ["2"] }
        },
        {
          id: "job_search_methods",
          type: "multi_choice",
          label: "Bagaimana Anda mencari pekerjaan tersebut? Jawaban bisa lebih dari satu",
          options: [
            { field: "f401", value: "1", label: "Melalui iklan di koran/majalah, brosur" },
            { field: "f402", value: "1", label: "Melamar ke perusahaan tanpa mengetahui lowongan yang ada" },
            { field: "f403", value: "1", label: "Pergi ke bursa/pameran kerja" },
            { field: "f404", value: "1", label: "Mencari lewat internet/iklan online/milis" },
            { field: "f405", value: "1", label: "Dihubungi oleh perusahaan" },
            { field: "f406", value: "1", label: "Menghubungi Kemenakertrans" },
            { field: "f407", value: "1", label: "Menghubungi agen tenaga kerja komersial/swasta" },
            { field: "f408", value: "1", label: "Memperoleh informasi dari pusat/kantor pengembangan karir fakultas/universitas" },
            { field: "f409", value: "1", label: "Menghubungi kantor kemahasiswaan/hubungan alumni" },
            { field: "f410", value: "1", label: "Membangun jejaring/network sejak masih kuliah" },
            { field: "f411", value: "1", label: "Melalui relasi (dosen, orang tua, saudara, teman, dll.)" },
            { field: "f412", value: "1", label: "Membangun bisnis sendiri" },
            { field: "f413", value: "1", label: "Melalui penempatan kerja atau magang" },
            { field: "f414", value: "1", label: "Bekerja di tempat yang sama dengan tempat kerja semasa kuliah" },
            { field: "f415", value: "1", label: "Lainnya" }
          ]
        },
        {
          id: "f6",
          code: "f6",
          type: "number",
          label: "Berapa perusahaan/instansi/institusi yang sudah Anda lamar sebelum memperoleh pekerjaan pertama?",
          suffix: "perusahaan/instansi/institusi"
        },
        {
          id: "f7",
          code: "f7",
          type: "number",
          label: "Berapa banyak perusahaan/instansi/institusi yang merespons lamaran Anda?",
          suffix: "perusahaan/instansi/institusi"
        },
        {
          id: "f7a",
          code: "f7a",
          type: "number",
          label: "Berapa banyak perusahaan/instansi/institusi yang mengundang Anda untuk wawancara?",
          suffix: "perusahaan/instansi/institusi"
        },
        {
          id: "f1001",
          code: "f1001",
          type: "single_choice",
          label: "Apakah Anda aktif mencari pekerjaan dalam 4 minggu terakhir?",
          options: [
            { value: "1", label: "Tidak" },
            { value: "2", label: "Tidak, tapi saya sedang menunggu hasil lamaran kerja" },
            { value: "3", label: "Ya, saya akan mulai bekerja dalam 2 minggu ke depan" },
            { value: "4", label: "Ya, tapi saya belum pasti akan bekerja dalam 2 minggu ke depan" },
            { value: "5", label: "Lainnya" }
          ],
          otherField: "f1002"
        },
        {
          id: "f1002",
          code: "f1002",
          type: "text",
          label: "Aktivitas pencarian kerja lainnya",
          requiredWhen: { field: "f1001", values: ["5"] }
        }
      ]
    },
    {
      id: "fit_reason",
      title: "Kesesuaian Pekerjaan",
      questions: [
        {
          id: "education_mismatch_reasons",
          type: "multi_choice",
          label: "Jika pekerjaan Anda saat ini tidak sesuai dengan pendidikan Anda, mengapa Anda mengambilnya? Jawaban bisa lebih dari satu",
          otherField: "f1614",
          options: [
            { field: "f1601", value: "1", label: "Pertanyaan tidak sesuai; pekerjaan saya sekarang sudah sesuai dengan pendidikan saya" },
            { field: "f1602", value: "1", label: "Saya belum mendapatkan pekerjaan yang lebih sesuai" },
            { field: "f1603", value: "1", label: "Di pekerjaan ini saya memperoleh prospek karir yang baik" },
            { field: "f1604", value: "1", label: "Saya lebih suka bekerja di area pekerjaan yang tidak ada hubungannya dengan pendidikan saya" },
            { field: "f1605", value: "1", label: "Saya dipromosikan ke posisi yang kurang berhubungan dengan pendidikan saya dibanding posisi sebelumnya" },
            { field: "f1606", value: "1", label: "Saya dapat memperoleh pendapatan yang lebih tinggi di pekerjaan ini" },
            { field: "f1607", value: "1", label: "Pekerjaan saya saat ini lebih aman/terjamin/secure" },
            { field: "f1608", value: "1", label: "Pekerjaan saya saat ini lebih menarik" },
            { field: "f1609", value: "1", label: "Pekerjaan saya saat ini lebih memungkinkan saya mengambil pekerjaan tambahan/jadwal yang fleksibel, dll." },
            { field: "f1610", value: "1", label: "Pekerjaan saya saat ini lokasinya lebih dekat dari rumah saya" },
            { field: "f1611", value: "1", label: "Pekerjaan saya saat ini dapat lebih menjamin kebutuhan keluarga saya" },
            { field: "f1612", value: "1", label: "Pada awal meniti karir ini, saya harus menerima pekerjaan yang tidak berhubungan dengan pendidikan saya" },
            { field: "f1613", value: "1", label: "Lainnya" }
          ]
        },
        {
          id: "f1614",
          code: "f1614",
          type: "text",
          label: "Alasan lainnya",
          requiredWhen: { field: "f1613", values: ["1"] }
        }
      ]
    }
  ]
};

export const questionnaireSections = tracerStudyQuestionnaire.sections;

export function answerValue(answers: AnswerMap | null | undefined, field: string) {
  const value = answers?.[field];
  return value === undefined || value === null || value === "" ? null : String(value);
}

export function optionLabel(options: readonly ChoiceOption[], value: AnswerPrimitive) {
  const stringValue = value === undefined || value === null ? "" : String(value);
  return options.find((option) => option.value === stringValue)?.label ?? stringValue;
}

export function shouldShowQuestion(question: QuestionnaireQuestion, answers: AnswerMap | null | undefined) {
  if (!("requiredWhen" in question) || !question.requiredWhen) return true;
  return question.requiredWhen.values.includes(answerValue(answers, question.requiredWhen.field) ?? "");
}

export function isQuestionRequired(question: QuestionnaireQuestion, answers: AnswerMap | null | undefined) {
  if (question.required) return true;
  if (!question.requiredWhen) return false;
  return question.requiredWhen.values.includes(answerValue(answers, question.requiredWhen.field) ?? "");
}
