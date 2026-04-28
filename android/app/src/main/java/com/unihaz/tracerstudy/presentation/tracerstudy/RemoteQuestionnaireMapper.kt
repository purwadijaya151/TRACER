package com.unihaz.tracerstudy.presentation.tracerstudy

import com.unihaz.tracerstudy.data.model.QuestionnaireQuestionRemote
import com.unihaz.tracerstudy.data.model.RemoteRequiredWhen
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import java.util.LinkedHashMap

internal object RemoteQuestionnaireMapper {
    fun toSections(rows: List<QuestionnaireQuestionRemote>): List<QuestionnaireSection> {
        val grouped = LinkedHashMap<String, MutableList<Pair<QuestionnaireQuestionRemote, QuestionnaireQuestion>>>()
        rows
            .filter { it.isActive }
            .sortedWith(
                compareBy<QuestionnaireQuestionRemote> { it.sectionOrder }
                    .thenBy { it.orderIndex }
                    .thenBy { it.code }
            )
            .forEach { row ->
                val question = row.toQuestion() ?: return@forEach
                val sectionId = row.sectionId.ifBlank { "default" }
                grouped.getOrPut(sectionId) { mutableListOf() }.add(row to question)
            }

        return grouped.mapNotNull { (sectionId, entries) ->
            val questions = entries.map { it.second }
            if (questions.isEmpty()) return@mapNotNull null
            QuestionnaireSection(
                id = sectionId,
                title = entries.first().first.sectionTitle.ifBlank { sectionId },
                questions = questions
            )
        }
    }

    private fun QuestionnaireQuestionRemote.toQuestion(): QuestionnaireQuestion? {
        val questionId = code.ifBlank { id }.ifBlank { return null }
        val label = questionText.ifBlank { questionId }
        val condition = requiredWhen.toRequiredWhen()
        val suffix = metadata?.string("suffix")

        return when (questionType) {
            "text", "textarea" -> TextQuestion(
                id = questionId,
                label = label,
                inputType = TextQuestionType.Text,
                suffix = suffix,
                multiline = questionType == "textarea",
                required = isRequired,
                requiredWhen = condition
            )
            "number" -> TextQuestion(
                id = questionId,
                label = label,
                inputType = TextQuestionType.Number,
                suffix = suffix,
                required = isRequired,
                requiredWhen = condition
            )
            "date" -> TextQuestion(
                id = questionId,
                label = label,
                inputType = TextQuestionType.Date,
                suffix = suffix,
                required = isRequired,
                requiredWhen = condition
            )
            "single_choice" -> options.choiceOptions().takeIf { it.isNotEmpty() }?.let {
                SingleChoiceQuestion(
                    id = questionId,
                    label = label,
                    options = it,
                    required = isRequired,
                    requiredWhen = condition
                )
            }
            "multi_choice" -> options.multiChoiceOptions().takeIf { it.isNotEmpty() }?.let {
                MultiChoiceQuestion(
                    id = questionId,
                    label = label,
                    options = it,
                    required = isRequired,
                    requiredWhen = condition
                )
            }
            "scale" -> options.choiceOptions().takeIf { it.isNotEmpty() }?.let {
                ScaleQuestion(
                    id = questionId,
                    label = label,
                    scale = it,
                    required = isRequired,
                    requiredWhen = condition
                )
            }
            "matrix_pair" -> matrixQuestion(questionId, label, condition)
            else -> null
        }
    }

    private fun QuestionnaireQuestionRemote.matrixQuestion(
        questionId: String,
        label: String,
        condition: RequiredWhen?
    ): MatrixPairQuestion? {
        val optionObject = options as? JsonObject ?: return null
        val scale = optionObject["scale"].choiceOptions()
        val rows = optionObject["rows"].matrixRows()
        if (scale.isEmpty() || rows.isEmpty()) return null

        return MatrixPairQuestion(
            id = questionId,
            label = label,
            leftLabel = optionObject.string("leftLabel") ?: metadata?.string("leftLabel") ?: "A",
            rightLabel = optionObject.string("rightLabel") ?: metadata?.string("rightLabel") ?: "B",
            scale = scale,
            rows = rows,
            required = isRequired,
            requiredWhen = condition
        )
    }

    private fun RemoteRequiredWhen?.toRequiredWhen(): RequiredWhen? {
        val field = this?.field?.trim().orEmpty()
        val values = this?.values?.map { it.trim() }?.filter { it.isNotEmpty() }?.toSet().orEmpty()
        if (field.isBlank() || values.isEmpty()) return null
        return RequiredWhen(field, values)
    }

    private fun JsonElement?.choiceOptions(): List<ChoiceOption> {
        val array = this as? JsonArray ?: return emptyList()
        return array.mapNotNull { item ->
            val option = item as? JsonObject ?: return@mapNotNull null
            val value = option.string("value") ?: return@mapNotNull null
            ChoiceOption(value = value, label = option.string("label") ?: value)
        }
    }

    private fun JsonElement?.multiChoiceOptions(): List<MultiChoiceOption> {
        val array = this as? JsonArray ?: return emptyList()
        return array.mapNotNull { item ->
            val option = item as? JsonObject ?: return@mapNotNull null
            val field = option.string("field") ?: return@mapNotNull null
            val value = option.string("value") ?: "1"
            MultiChoiceOption(field = field, value = value, label = option.string("label") ?: field)
        }
    }

    private fun JsonElement?.matrixRows(): List<MatrixPairRow> {
        val array = this as? JsonArray ?: return emptyList()
        return array.mapNotNull { item ->
            val row = item as? JsonObject ?: return@mapNotNull null
            val label = row.string("label") ?: return@mapNotNull null
            val leftField = row.string("leftField") ?: return@mapNotNull null
            val rightField = row.string("rightField") ?: return@mapNotNull null
            MatrixPairRow(label = label, leftField = leftField, rightField = rightField)
        }
    }

    private fun JsonObject.string(key: String): String? =
        this[key]?.jsonPrimitive?.contentOrNull?.trim()?.takeIf { it.isNotEmpty() }
}
