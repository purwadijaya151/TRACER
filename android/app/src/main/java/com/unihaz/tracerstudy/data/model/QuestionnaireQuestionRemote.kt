package com.unihaz.tracerstudy.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

@Serializable
data class QuestionnaireQuestionRemote(
    val id: String = "",
    @SerialName("questionnaire_version") val questionnaireVersion: String = "launch-v1",
    val code: String = "",
    @SerialName("section_id") val sectionId: String = "",
    @SerialName("section_title") val sectionTitle: String = "",
    @SerialName("section_order") val sectionOrder: Int = 1,
    @SerialName("order_index") val orderIndex: Int = 1,
    @SerialName("question_text") val questionText: String = "",
    val description: String? = null,
    @SerialName("question_type") val questionType: String = "text",
    @SerialName("is_required") val isRequired: Boolean = false,
    @SerialName("is_active") val isActive: Boolean = true,
    val options: JsonElement = JsonArray(emptyList()),
    @SerialName("required_when") val requiredWhen: RemoteRequiredWhen? = null,
    val metadata: JsonObject? = null
)

@Serializable
data class RemoteRequiredWhen(
    val field: String = "",
    val values: List<String> = emptyList()
)
