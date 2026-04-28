package com.unihaz.tracerstudy

import com.unihaz.tracerstudy.data.model.QuestionnaireQuestionRemote
import com.unihaz.tracerstudy.data.model.RemoteRequiredWhen
import com.unihaz.tracerstudy.presentation.tracerstudy.MatrixPairQuestion
import com.unihaz.tracerstudy.presentation.tracerstudy.MultiChoiceQuestion
import com.unihaz.tracerstudy.presentation.tracerstudy.RemoteQuestionnaireMapper
import com.unihaz.tracerstudy.presentation.tracerstudy.ScaleQuestion
import com.unihaz.tracerstudy.presentation.tracerstudy.SingleChoiceQuestion
import com.unihaz.tracerstudy.presentation.tracerstudy.TextQuestion
import com.unihaz.tracerstudy.presentation.tracerstudy.TextQuestionType
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyQuestionnaire
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RemoteQuestionnaireMapperTest {
    @Test
    fun mapsAdminQuestionRowsToWizardSections() {
        val rows = listOf(
            QuestionnaireQuestionRemote(
                code = "f8",
                sectionId = "status",
                sectionTitle = "Status Alumni",
                sectionOrder = 1,
                orderIndex = 1,
                questionText = "Jelaskan status Anda saat ini",
                questionType = "single_choice",
                isRequired = true,
                options = Json.parseToJsonElement(
                    """[
                      {"value":"1","label":"Bekerja"},
                      {"value":"3","label":"Wiraswasta"}
                    ]"""
                )
            ),
            QuestionnaireQuestionRemote(
                code = "f502",
                sectionId = "work",
                sectionTitle = "Pekerjaan",
                sectionOrder = 2,
                orderIndex = 1,
                questionText = "Waktu tunggu kerja",
                questionType = "number",
                requiredWhen = RemoteRequiredWhen(field = "f8", values = listOf("1", "3"))
            )
        )

        val sections = RemoteQuestionnaireMapper.toSections(rows)
        val statusQuestion = sections.first().questions.first() as SingleChoiceQuestion
        val workQuestion = sections.last().questions.first()

        assertEquals(listOf("status", "work"), sections.map { it.id })
        assertEquals("f8", statusQuestion.id)
        assertTrue(statusQuestion.required)
        assertEquals("Bekerja", statusQuestion.options.first().label)
        assertEquals("f8", workQuestion.requiredWhen?.field)
        assertEquals(setOf("1", "3"), workQuestion.requiredWhen?.values)
    }

    @Test
    fun usesAdminSectionOrderInsteadOfAlphabeticalSectionId() {
        val rows = listOf(
            QuestionnaireQuestionRemote(
                code = "later",
                sectionId = "aaa_later",
                sectionTitle = "Section Belakang",
                sectionOrder = 2,
                questionText = "Pertanyaan kedua",
                questionType = "text"
            ),
            QuestionnaireQuestionRemote(
                code = "first",
                sectionId = "zzz_first",
                sectionTitle = "Section Depan",
                sectionOrder = 1,
                questionText = "Pertanyaan pertama",
                questionType = "text"
            )
        )

        val sections = RemoteQuestionnaireMapper.toSections(rows)

        assertEquals(listOf("zzz_first", "aaa_later"), sections.map { it.id })
    }

    @Test
    fun mapsTextareaAsMultilineTextQuestion() {
        val sections = RemoteQuestionnaireMapper.toSections(
            listOf(
                QuestionnaireQuestionRemote(
                    code = "feedback",
                    sectionId = "feedback",
                    sectionTitle = "Masukan",
                    questionText = "Tuliskan masukan Anda",
                    questionType = "textarea"
                )
            )
        )

        val question = sections.first().questions.first() as TextQuestion

        assertTrue(question.multiline)
    }

    @Test
    fun mapsEverySupportedAdminQuestionType() {
        val rows = listOf(
            remoteRow("short_text", "text", 1),
            remoteRow("long_text", "textarea", 2),
            remoteRow(
                code = "waiting_time",
                questionType = "number",
                orderIndex = 3,
                metadata = json("""{"suffix":"bulan"}""").jsonObject
            ),
            remoteRow("start_date", "date", 4),
            remoteRow(
                code = "employment_status",
                questionType = "single_choice",
                orderIndex = 5,
                options = choiceOptions()
            ),
            remoteRow(
                code = "job_search_methods",
                questionType = "multi_choice",
                orderIndex = 6,
                options = json(
                    """[
                      {"field":"f401","label":"Iklan"},
                      {"field":"f402","value":"ya","label":"Internet"}
                    ]"""
                )
            ),
            remoteRow(
                code = "learning_quality",
                questionType = "scale",
                orderIndex = 7,
                options = scaleOptions()
            ),
            remoteRow(
                code = "competency_matrix",
                questionType = "matrix_pair",
                orderIndex = 8,
                options = json(
                    """{
                      "leftLabel":"Dikuasai",
                      "rightLabel":"Diperlukan",
                      "scale":[
                        {"value":"1","label":"Rendah"},
                        {"value":"2","label":"Tinggi"}
                      ],
                      "rows":[
                        {"label":"Etika","leftField":"f1761","rightField":"f1762"}
                      ]
                    }"""
                )
            )
        )

        val questions = RemoteQuestionnaireMapper.toSections(rows).single().questions
        val text = questions[0] as TextQuestion
        val textarea = questions[1] as TextQuestion
        val number = questions[2] as TextQuestion
        val date = questions[3] as TextQuestion
        val singleChoice = questions[4] as SingleChoiceQuestion
        val multiChoice = questions[5] as MultiChoiceQuestion
        val scale = questions[6] as ScaleQuestion
        val matrix = questions[7] as MatrixPairQuestion

        assertEquals(TextQuestionType.Text, text.inputType)
        assertTrue(textarea.multiline)
        assertEquals(TextQuestionType.Number, number.inputType)
        assertEquals("bulan", number.suffix)
        assertEquals(TextQuestionType.Date, date.inputType)
        assertEquals("Bekerja", singleChoice.options.first().label)
        assertEquals("f401", multiChoice.options.first().field)
        assertEquals("1", multiChoice.options.first().value)
        assertEquals("ya", multiChoice.options.last().value)
        assertEquals("Tinggi", scale.scale.last().label)
        assertEquals("Dikuasai", matrix.leftLabel)
        assertEquals("Diperlukan", matrix.rightLabel)
        assertEquals("Etika", matrix.rows.single().label)
    }

    @Test
    fun ignoresInactiveUnsupportedOrIncompleteRemoteRows() {
        val rows = listOf(
            remoteRow("inactive", "text", 1, isActive = false),
            remoteRow("unknown", "slider", 2),
            remoteRow("empty_choice", "single_choice", 3),
            remoteRow(
                code = "broken_matrix",
                questionType = "matrix_pair",
                orderIndex = 4,
                options = json("""{"scale":[],"rows":[]}""")
            ),
            QuestionnaireQuestionRemote(
                code = "",
                id = "",
                sectionId = "qa",
                sectionTitle = "QA",
                orderIndex = 5,
                questionText = "Tanpa identifier",
                questionType = "text"
            ),
            remoteRow("valid", "text", 6)
        )

        val questions = RemoteQuestionnaireMapper.toSections(rows).single().questions

        assertEquals(listOf("valid"), questions.map { it.id })
    }

    @Test
    fun conditionalRequiredQuestionIsIgnoredWhenHidden() {
        val question = TextQuestion(
            id = "company",
            label = "Nama perusahaan",
            required = true,
            requiredWhen = com.unihaz.tracerstudy.presentation.tracerstudy.RequiredWhen("f8", setOf("1"))
        )

        assertFalse(TracerStudyQuestionnaire.isRequired(question, mapOf("f8" to "5")))
        assertTrue(TracerStudyQuestionnaire.isRequired(question, mapOf("f8" to "1")))
    }

    private fun remoteRow(
        code: String,
        questionType: String,
        orderIndex: Int,
        options: JsonElement = JsonArray(emptyList()),
        metadata: JsonObject? = null,
        isActive: Boolean = true
    ) = QuestionnaireQuestionRemote(
        code = code,
        sectionId = "qa",
        sectionTitle = "QA",
        sectionOrder = 1,
        orderIndex = orderIndex,
        questionText = "Pertanyaan $code",
        questionType = questionType,
        isActive = isActive,
        options = options,
        metadata = metadata
    )

    private fun choiceOptions(): JsonElement = json(
        """[
          {"value":"1","label":"Bekerja"},
          {"value":"2","label":"Belum bekerja"}
        ]"""
    )

    private fun scaleOptions(): JsonElement = json(
        """[
          {"value":"1","label":"Rendah"},
          {"value":"2","label":"Tinggi"}
        ]"""
    )

    private fun json(value: String): JsonElement = Json.parseToJsonElement(value.trimIndent())
}
