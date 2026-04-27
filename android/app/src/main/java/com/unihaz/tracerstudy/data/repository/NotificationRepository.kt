package com.unihaz.tracerstudy.data.repository

import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.Notification
import io.ktor.client.request.get
import io.ktor.client.request.patch
import io.ktor.client.request.setBody
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.encodeToString

class NotificationRepository(private val sessionManager: SessionManager) {
    suspend fun getNotifications(alumniId: String): NetworkResult<List<Notification>> = runCatching {
        val token = sessionManager.getSession()?.accessToken
            ?: return NetworkResult.Error("Sesi login tidak ditemukan")
        val response = SupabaseRest.httpClient.get("${SupabaseRest.baseUrl}/rest/v1/notifications?select=*&alumni_id=eq.$alumniId&order=created_at.desc") {
            SupabaseRest.run { supabaseHeaders(token) }
        }
        SupabaseRest.parseResponse(response) { body ->
            SupabaseRest.json.decodeFromString(ListSerializer(Notification.serializer()), body)
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    suspend fun markAsRead(notificationId: String): NetworkResult<Unit> = runCatching {
        val token = sessionManager.getSession()?.accessToken
            ?: return NetworkResult.Error("Sesi login tidak ditemukan")
        val response = SupabaseRest.httpClient.patch("${SupabaseRest.baseUrl}/rest/v1/notifications?id=eq.$notificationId") {
            SupabaseRest.run { supabaseHeaders(token) }
            setBody(SupabaseRest.json.encodeToString(MarkReadRequest()))
        }
        SupabaseRest.responseToUnit(response)
    }.getOrElse { SupabaseRest.mapThrowable(it) }
}

@Serializable
private data class MarkReadRequest(@kotlinx.serialization.SerialName("is_read") val isRead: Boolean = true)
