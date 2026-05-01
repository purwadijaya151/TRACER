package com.unihaz.tracerstudy.data.repository

import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.core.utils.Constants
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.Alumni
import io.ktor.client.request.get
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.contentType
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

class AlumniRepository(private val sessionManager: SessionManager) {
    suspend fun getProfile(alumniId: String, tokenOverride: String? = null): NetworkResult<Alumni> = runCatching {
        val token = tokenOverride ?: sessionManager.getSession()?.accessToken
        if (token.isNullOrBlank()) return NetworkResult.Error("Sesi login tidak ditemukan")
        val response = SupabaseRest.httpClient.get("${SupabaseRest.baseUrl}/rest/v1/alumni?select=*&id=eq.$alumniId") {
            SupabaseRest.run { supabaseHeaders(token) }
        }
        SupabaseRest.parseResponse(response) { body ->
            SupabaseRest.json.decodeFromString(ListSerializer(Alumni.serializer()), body).first()
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    suspend fun updateProfile(alumniId: String, email: String, noHp: String?): NetworkResult<Alumni> = runCatching {
        val token = sessionManager.getSession()?.accessToken
            ?: return NetworkResult.Error("Sesi login tidak ditemukan")
        val response = SupabaseRest.httpClient.patch("${SupabaseRest.baseUrl}/rest/v1/alumni?id=eq.$alumniId") {
            SupabaseRest.run { supabaseHeaders(token, "return=representation") }
            setBody(
                JsonObject(
                    mapOf(
                        "email" to JsonPrimitive(email),
                        "no_hp" to (noHp?.let { JsonPrimitive(it) } ?: JsonNull)
                    )
                ).toString()
            )
        }
        SupabaseRest.parseResponse(response) { body ->
            SupabaseRest.json.decodeFromString(ListSerializer(Alumni.serializer()), body).first()
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    suspend fun uploadFoto(fileName: String, bytes: ByteArray, mimeType: String): NetworkResult<String> = runCatching {
        val session = sessionManager.getSession()
        val token = session?.accessToken
            ?: return NetworkResult.Error("Sesi login tidak ditemukan")
        val cleanFileName = fileName.substringAfterLast('/').substringAfterLast('\\')
        val objectPath = "${session.alumniId}/$cleanFileName".replace("\\", "/")
        val response = SupabaseRest.httpClient.put("${SupabaseRest.baseUrl}/storage/v1/object/${Constants.BUCKET_ALUMNI_PHOTOS}/$objectPath") {
            SupabaseRest.run { supabaseHeaders(token) }
            headers.append("x-upsert", "true")
            contentType(ContentType.parse(mimeType))
            setBody(bytes)
        }
        if (response.status.value in 200..299) {
            NetworkResult.Success("${SupabaseRest.baseUrl}/storage/v1/object/public/${Constants.BUCKET_ALUMNI_PHOTOS}/$objectPath")
        } else {
            when (val error = SupabaseRest.responseToUnit(response)) {
                is NetworkResult.Error -> error
                NetworkResult.Loading -> NetworkResult.Error("Terjadi kesalahan, silakan coba beberapa saat lagi")
                is NetworkResult.Success -> NetworkResult.Error("Terjadi kesalahan, silakan coba beberapa saat lagi")
            }
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    suspend fun saveProfilePhotoUrl(photoUrl: String): NetworkResult<Alumni> = runCatching {
        val token = sessionManager.getSession()?.accessToken
            ?: return NetworkResult.Error("Sesi login tidak ditemukan")
        val response = SupabaseRest.httpClient.post("${SupabaseRest.baseUrl}/rest/v1/rpc/update_own_alumni_photo") {
            SupabaseRest.run { supabaseHeaders(token) }
            setBody(JsonObject(mapOf("p_foto_url" to JsonPrimitive(photoUrl))).toString())
        }
        SupabaseRest.parseResponse(response) { body ->
            SupabaseRest.json.decodeFromString(Alumni.serializer(), body)
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }

}
