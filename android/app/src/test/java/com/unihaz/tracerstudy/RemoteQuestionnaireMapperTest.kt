package com.unihaz.tracerstudy

import com.unihaz.tracerstudy.data.model.QuestionnaireQuestionRemote
import com.unihaz.tracerstudy.data.model.RemoteRequiredWhen
import com.unihaz.tracerstudy.presentation.tracerstudy.RemoteQuestionnaireMapper
import com.unihaz.tracerstudy.presentation.tracerstudy.SingleChoiceQuestion
import com.unihaz.tracerstudy.presentation.tracerstudy.TextQuestion
import com.unihaz.tracerstudy.presentation.tracerstudy.TracerStudyQuestionnaire
import kotlinx.serialization.json.Json
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
}
