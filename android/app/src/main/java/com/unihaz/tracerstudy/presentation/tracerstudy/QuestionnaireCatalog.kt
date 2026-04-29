package com.unihaz.tracerstudy.presentation.tracerstudy

data class ChoiceOption(
    val value: String,
    val label: String
)

data class RequiredWhen(
    val field: String,
    val values: Set<String>
)

enum class TextQuestionType {
    Text,
    Number,
    Date
}

sealed class QuestionnaireQuestion {
    abstract val id: String
    abstract val label: String
    abstract val required: Boolean
    abstract val requiredWhen: RequiredWhen?
}

data class TextQuestion(
    override val id: String,
    override val label: String,
    val inputType: TextQuestionType = TextQuestionType.Text,
    val suffix: String? = null,
    val multiline: Boolean = false,
    override val required: Boolean = false,
    override val requiredWhen: RequiredWhen? = null
) : QuestionnaireQuestion()

data class SingleChoiceQuestion(
    override val id: String,
    override val label: String,
    val options: List<ChoiceOption>,
    val otherField: String? = null,
    override val required: Boolean = false,
    override val requiredWhen: RequiredWhen? = null
) : QuestionnaireQuestion()

data class MultiChoiceOption(
    val field: String,
    val value: String = "1",
    val label: String
)

data class MultiChoiceQuestion(
    override val id: String,
    override val label: String,
    val options: List<MultiChoiceOption>,
    val otherField: String? = null,
    override val required: Boolean = false,
    override val requiredWhen: RequiredWhen? = null
) : QuestionnaireQuestion()

data class ScaleQuestion(
    override val id: String,
    override val label: String,
    val scale: List<ChoiceOption>,
    override val required: Boolean = false,
    override val requiredWhen: RequiredWhen? = null
) : QuestionnaireQuestion()

data class MatrixPairRow(
    val label: String,
    val leftField: String,
    val rightField: String
)

data class MatrixPairQuestion(
    override val id: String,
    override val label: String,
    val leftLabel: String,
    val rightLabel: String,
    val scale: List<ChoiceOption>,
    val rows: List<MatrixPairRow>,
    override val required: Boolean = false,
    override val requiredWhen: RequiredWhen? = null
) : QuestionnaireQuestion()

data class QuestionnaireSection(
    val id: String,
    val title: String,
    val questions: List<QuestionnaireQuestion>
)

object TracerStudyQuestionnaire {
    const val VERSION = "launch-v1"

    val statusOptions = listOf(
        ChoiceOption("1", "Bekerja (full time / part time)"),
        ChoiceOption("2", "Belum memungkinkan bekerja"),
        ChoiceOption("3", "Wiraswasta"),
        ChoiceOption("4", "Melanjutkan Pendidikan"),
        ChoiceOption("5", "Tidak kerja tetapi sedang mencari kerja")
    )

    private val relationScale = listOf(
        ChoiceOption("1", "Sangat Erat"),
        ChoiceOption("2", "Erat"),
        ChoiceOption("3", "Cukup Erat"),
        ChoiceOption("4", "Kurang Erat"),
        ChoiceOption("5", "Tidak Sama Sekali")
    )

    private val educationFitOptions = listOf(
        ChoiceOption("1", "Setingkat Lebih Tinggi"),
        ChoiceOption("2", "Tingkat yang Sama"),
        ChoiceOption("3", "Setingkat Lebih Rendah"),
        ChoiceOption("4", "Tidak Perlu Pendidikan Tinggi")
    )

    private val competencyScale = listOf(
        ChoiceOption("1", "Sangat Rendah"),
        ChoiceOption("2", "Rendah"),
        ChoiceOption("3", "Cukup"),
        ChoiceOption("4", "Tinggi"),
        ChoiceOption("5", "Sangat Tinggi")
    )

    private val learningScale = listOf(
        ChoiceOption("1", "Sangat Besar"),
        ChoiceOption("2", "Besar"),
        ChoiceOption("3", "Cukup Besar"),
        ChoiceOption("4", "Kurang Besar"),
        ChoiceOption("5", "Tidak Sama Sekali")
    )

    val sections = listOf(
        QuestionnaireSection(
            id = "status",
            title = "Status Alumni",
            questions = listOf(
                SingleChoiceQuestion(
                    id = "f8",
                    label = "Jelaskan status Anda saat ini",
                    options = statusOptions,
                    required = true
                )
            )
        ),
        QuestionnaireSection(
            id = "work",
            title = "Pekerjaan dan Wirausaha",
            questions = listOf(
                TextQuestion(
                    id = "f502",
                    label = "Dalam berapa bulan Anda mendapatkan pekerjaan pertama atau mulai wirausaha?",
                    inputType = TextQuestionType.Number,
                    suffix = "bulan",
                    requiredWhen = RequiredWhen("f8", setOf("1", "3"))
                ),
                TextQuestion(
                    id = "f505",
                    label = "Berapa rata-rata pendapatan Anda per bulan (take home pay)?",
                    inputType = TextQuestionType.Number,
                    suffix = "Rupiah",
                    requiredWhen = RequiredWhen("f8", setOf("1"))
                ),
                TextQuestion(
                    id = "f5a1",
                    label = "Provinsi lokasi tempat Anda bekerja",
                    requiredWhen = RequiredWhen("f8", setOf("1"))
                ),
                TextQuestion(
                    id = "f5a2",
                    label = "Kota/Kabupaten lokasi tempat Anda bekerja",
                    requiredWhen = RequiredWhen("f8", setOf("1"))
                ),
                SingleChoiceQuestion(
                    id = "f1101",
                    label = "Apa jenis perusahaan/instansi/institusi tempat Anda bekerja sekarang?",
                    options = listOf(
                        ChoiceOption("1", "Instansi pemerintah"),
                        ChoiceOption("2", "Organisasi non-profit/Lembaga Swadaya Masyarakat"),
                        ChoiceOption("3", "Perusahaan swasta"),
                        ChoiceOption("4", "Wiraswasta/perusahaan sendiri"),
                        ChoiceOption("6", "BUMN/BUMD"),
                        ChoiceOption("7", "Institusi/Organisasi Multilateral"),
                        ChoiceOption("5", "Lainnya")
                    ),
                    otherField = "f1102",
                    requiredWhen = RequiredWhen("f8", setOf("1"))
                ),
                TextQuestion(
                    id = "f1102",
                    label = "Jenis perusahaan lainnya",
                    requiredWhen = RequiredWhen("f1101", setOf("5"))
                ),
                TextQuestion(
                    id = "f5b",
                    label = "Apa nama perusahaan/kantor tempat Anda bekerja?",
                    requiredWhen = RequiredWhen("f8", setOf("1"))
                ),
                TextQuestion(
                    id = "f5c",
                    label = "Bila berwiraswasta, apa posisi/jabatan Anda saat ini?",
                    requiredWhen = RequiredWhen("f8", setOf("3"))
                ),
                TextQuestion(
                    id = "f5d",
                    label = "Apa tingkat tempat kerja Anda?",
                    requiredWhen = RequiredWhen("f8", setOf("1", "3"))
                )
            )
        ),
        QuestionnaireSection(
            id = "education",
            title = "Studi Lanjut dan Pembiayaan",
            questions = listOf(
                TextQuestion(
                    id = "f18a",
                    label = "Sumber biaya studi lanjut",
                    requiredWhen = RequiredWhen("f8", setOf("4"))
                ),
                TextQuestion(
                    id = "f18b",
                    label = "Perguruan tinggi studi lanjut",
                    requiredWhen = RequiredWhen("f8", setOf("4"))
                ),
                TextQuestion(
                    id = "f18c",
                    label = "Program studi lanjut",
                    requiredWhen = RequiredWhen("f8", setOf("4"))
                ),
                TextQuestion(
                    id = "f18d",
                    label = "Tanggal masuk studi lanjut",
                    inputType = TextQuestionType.Date,
                    requiredWhen = RequiredWhen("f8", setOf("4"))
                ),
                SingleChoiceQuestion(
                    id = "f1201",
                    label = "Sebutkan sumber dana dalam pembiayaan kuliah (bukan ketika studi lanjut)",
                    options = listOf(
                        ChoiceOption("1", "Biaya Sendiri/Keluarga"),
                        ChoiceOption("2", "Beasiswa ADIK"),
                        ChoiceOption("3", "Beasiswa BIDIKMISI"),
                        ChoiceOption("4", "Beasiswa PPA"),
                        ChoiceOption("5", "Beasiswa AFIRMASI"),
                        ChoiceOption("6", "Beasiswa Perusahaan/Swasta"),
                        ChoiceOption("7", "Lainnya")
                    ),
                    required = true
                ),
                SingleChoiceQuestion(
                    id = "f14",
                    label = "Seberapa erat hubungan bidang studi dengan pekerjaan Anda?",
                    options = relationScale,
                    requiredWhen = RequiredWhen("f8", setOf("1"))
                ),
                SingleChoiceQuestion(
                    id = "f15",
                    label = "Tingkat pendidikan apa yang paling tepat/sesuai untuk pekerjaan Anda saat ini?",
                    options = educationFitOptions,
                    requiredWhen = RequiredWhen("f8", setOf("1"))
                )
            )
        ),
        QuestionnaireSection(
            id = "competency",
            title = "Kompetensi dan Metode Pembelajaran",
            questions = listOf(
                MatrixPairQuestion(
                    id = "competency_matrix",
                    label = "Tingkat kompetensi yang dikuasai saat lulus (A) dan diperlukan dalam pekerjaan (B)",
                    leftLabel = "A. Dikuasai saat lulus",
                    rightLabel = "B. Diperlukan dalam pekerjaan",
                    scale = competencyScale,
                    rows = listOf(
                        MatrixPairRow("Etika", "f1761", "f1762"),
                        MatrixPairRow("Keahlian berdasarkan bidang ilmu", "f1763", "f1764"),
                        MatrixPairRow("Bahasa Inggris", "f1765", "f1766"),
                        MatrixPairRow("Penggunaan Teknologi Informasi", "f1767", "f1768"),
                        MatrixPairRow("Komunikasi", "f1769", "f1770"),
                        MatrixPairRow("Kerja sama tim", "f1771", "f1772"),
                        MatrixPairRow("Pengembangan", "f1773", "f1774")
                    ),
                    required = true
                ),
                ScaleQuestion("f21", "Penekanan metode pembelajaran: Perkuliahan", learningScale, required = true),
                ScaleQuestion("f22", "Penekanan metode pembelajaran: Demonstrasi", learningScale, required = true),
                ScaleQuestion("f23", "Penekanan metode pembelajaran: Partisipasi dalam proyek riset", learningScale, required = true),
                ScaleQuestion("f24", "Penekanan metode pembelajaran: Magang", learningScale, required = true),
                ScaleQuestion("f25", "Penekanan metode pembelajaran: Praktikum", learningScale, required = true),
                ScaleQuestion("f26", "Penekanan metode pembelajaran: Kerja Lapangan", learningScale, required = true),
                ScaleQuestion("f27", "Penekanan metode pembelajaran: Diskusi", learningScale, required = true)
            )
        ),
        QuestionnaireSection(
            id = "job_search",
            title = "Pencarian Kerja",
            questions = listOf(
                SingleChoiceQuestion(
                    id = "f301",
                    label = "Kapan Anda mulai mencari pekerjaan? Mohon pekerjaan sambilan tidak dimasukkan",
                    options = listOf(
                        ChoiceOption("1", "Kira-kira beberapa bulan sebelum lulus"),
                        ChoiceOption("2", "Kira-kira beberapa bulan sesudah lulus"),
                        ChoiceOption("3", "Saya tidak mencari kerja")
                    ),
                    required = true
                ),
                TextQuestion(
                    id = "f302",
                    label = "Jumlah bulan sebelum lulus",
                    inputType = TextQuestionType.Number,
                    suffix = "bulan",
                    requiredWhen = RequiredWhen("f301", setOf("1"))
                ),
                TextQuestion(
                    id = "f303",
                    label = "Jumlah bulan sesudah lulus",
                    inputType = TextQuestionType.Number,
                    suffix = "bulan",
                    requiredWhen = RequiredWhen("f301", setOf("2"))
                ),
                MultiChoiceQuestion(
                    id = "job_search_methods",
                    label = "Bagaimana Anda mencari pekerjaan tersebut? Jawaban bisa lebih dari satu",
                    options = listOf(
                        MultiChoiceOption("f401", label = "Melalui iklan di koran/majalah, brosur"),
                        MultiChoiceOption("f402", label = "Melamar ke perusahaan tanpa mengetahui lowongan yang ada"),
                        MultiChoiceOption("f403", label = "Pergi ke bursa/pameran kerja"),
                        MultiChoiceOption("f404", label = "Mencari lewat internet/iklan online/milis"),
                        MultiChoiceOption("f405", label = "Dihubungi oleh perusahaan"),
                        MultiChoiceOption("f406", label = "Menghubungi Kemenakertrans"),
                        MultiChoiceOption("f407", label = "Menghubungi agen tenaga kerja komersial/swasta"),
                        MultiChoiceOption("f408", label = "Memperoleh informasi dari pusat/kantor pengembangan karir fakultas/universitas"),
                        MultiChoiceOption("f409", label = "Menghubungi kantor kemahasiswaan/hubungan alumni"),
                        MultiChoiceOption("f410", label = "Membangun jejaring/network sejak masih kuliah"),
                        MultiChoiceOption("f411", label = "Melalui relasi (dosen, orang tua, saudara, teman, dll.)"),
                        MultiChoiceOption("f412", label = "Membangun bisnis sendiri"),
                        MultiChoiceOption("f413", label = "Melalui penempatan kerja atau magang"),
                        MultiChoiceOption("f414", label = "Bekerja di tempat yang sama dengan tempat kerja semasa kuliah"),
                        MultiChoiceOption("f415", label = "Lainnya")
                    )
                ),
                TextQuestion(
                    id = "f6",
                    label = "Berapa perusahaan/instansi/institusi yang sudah Anda lamar (lewat surat atau e-mail) sebelum Anda memperoleh pekerjaan pertama?",
                    inputType = TextQuestionType.Number,
                    suffix = "perusahaan/instansi/institusi"
                ),
                TextQuestion(
                    id = "f7",
                    label = "Berapa banyak perusahaan/instansi/institusi yang merespons lamaran Anda?",
                    inputType = TextQuestionType.Number,
                    suffix = "perusahaan/instansi/institusi"
                ),
                TextQuestion(
                    id = "f7a",
                    label = "Berapa banyak perusahaan/instansi/institusi yang mengundang Anda untuk wawancara?",
                    inputType = TextQuestionType.Number,
                    suffix = "perusahaan/instansi/institusi"
                ),
                SingleChoiceQuestion(
                    id = "f1001",
                    label = "Apakah Anda aktif mencari pekerjaan dalam 4 minggu terakhir? Pilihlah satu jawaban",
                    options = listOf(
                        ChoiceOption("1", "Tidak"),
                        ChoiceOption("2", "Tidak, tapi saya sedang menunggu hasil lamaran kerja"),
                        ChoiceOption("3", "Ya, saya akan mulai bekerja dalam 2 minggu ke depan"),
                        ChoiceOption("4", "Ya, tapi saya belum pasti akan bekerja dalam 2 minggu ke depan"),
                        ChoiceOption("5", "Lainnya")
                    ),
                    otherField = "f1002"
                ),
                TextQuestion(
                    id = "f1002",
                    label = "Aktivitas pencarian kerja lainnya",
                    requiredWhen = RequiredWhen("f1001", setOf("5"))
                )
            )
        ),
        QuestionnaireSection(
            id = "fit_reason",
            title = "Kesesuaian Pekerjaan",
            questions = listOf(
                MultiChoiceQuestion(
                    id = "education_mismatch_reasons",
                    label = "Jika pekerjaan Anda saat ini tidak sesuai dengan pendidikan Anda, mengapa Anda mengambilnya? Jawaban bisa lebih dari satu",
                    options = listOf(
                        MultiChoiceOption("f1601", label = "Pertanyaan tidak sesuai; pekerjaan saya sekarang sudah sesuai dengan pendidikan saya"),
                        MultiChoiceOption("f1602", label = "Saya belum mendapatkan pekerjaan yang lebih sesuai"),
                        MultiChoiceOption("f1603", label = "Di pekerjaan ini saya memperoleh prospek karir yang baik"),
                        MultiChoiceOption("f1604", label = "Saya lebih suka bekerja di area pekerjaan yang tidak ada hubungannya dengan pendidikan saya"),
                        MultiChoiceOption("f1605", label = "Saya dipromosikan ke posisi yang kurang berhubungan dengan pendidikan saya dibanding posisi sebelumnya"),
                        MultiChoiceOption("f1606", label = "Saya dapat memperoleh pendapatan yang lebih tinggi di pekerjaan ini"),
                        MultiChoiceOption("f1607", label = "Pekerjaan saya saat ini lebih aman/terjamin/secure"),
                        MultiChoiceOption("f1608", label = "Pekerjaan saya saat ini lebih menarik"),
                        MultiChoiceOption("f1609", label = "Pekerjaan saya saat ini lebih memungkinkan saya mengambil pekerjaan tambahan/jadwal yang fleksibel, dll."),
                        MultiChoiceOption("f1610", label = "Pekerjaan saya saat ini lokasinya lebih dekat dari rumah saya"),
                        MultiChoiceOption("f1611", label = "Pekerjaan saya saat ini dapat lebih menjamin kebutuhan keluarga saya"),
                        MultiChoiceOption("f1612", label = "Pada awal meniti karir ini, saya harus menerima pekerjaan yang tidak berhubungan dengan pendidikan saya"),
                        MultiChoiceOption("f1613", label = "Lainnya")
                    ),
                    otherField = "f1614"
                ),
                TextQuestion(
                    id = "f1614",
                    label = "Alasan lainnya",
                    requiredWhen = RequiredWhen("f1613", setOf("1"))
                )
            )
        )
    )

    fun sectionForStep(
        step: Int,
        source: List<QuestionnaireSection> = sections
    ): QuestionnaireSection {
        val activeSections = source.ifEmpty { sections }
        return activeSections[(step - 1).coerceIn(0, activeSections.lastIndex)]
    }

    fun isVisible(question: QuestionnaireQuestion, answers: Map<String, String>): Boolean {
        val condition = question.requiredWhen ?: return true
        return answers[condition.field] in condition.values
    }

    fun isRequired(question: QuestionnaireQuestion, answers: Map<String, String>): Boolean {
        val condition = question.requiredWhen
        if (condition != null && answers[condition.field] !in condition.values) return false
        return question.required || condition != null
    }

    fun missingRequiredQuestion(section: QuestionnaireSection, answers: Map<String, String>): String? {
        section.questions.forEach { question ->
            if (!isRequired(question, answers)) return@forEach
            when (question) {
                is MatrixPairQuestion -> {
                    val missingRow = question.rows.firstOrNull {
                        answers[it.leftField].isNullOrBlank() || answers[it.rightField].isNullOrBlank()
                    }
                    if (missingRow != null) return "${missingRow.label} wajib dinilai"
                }
                is MultiChoiceQuestion -> {
                    val hasSelection = question.options.any { answers[it.field] == it.value }
                    if (!hasSelection) return question.label
                }
                else -> if (answers[question.id].isNullOrBlank()) return question.label
            }
        }
        return null
    }
}
