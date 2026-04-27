package com.unihaz.tracerstudy.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Notification(
    val id: String = "",
    @SerialName("alumni_id") val alumniId: String = "",
    val title: String = "",
    val body: String = "",
    @SerialName("is_read") val isRead: Boolean = false,
    val type: String = "info",
    @SerialName("created_at") val createdAt: String? = null
)
