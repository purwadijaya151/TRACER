package com.unihaz.tracerstudy.data.repository

import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.core.utils.DateUtils
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.TracerStudy
import com.unihaz.tracerstudy.data.model.toUpsert
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.encodeToString

class TracerStudyRepository(private val sessionManager: SessionManager) {
    suspend fun getDraft(alumniId: String): NetworkResult<TracerStudy?> = runCatching {
        val token = sessionManager.getSession()?.accessToken
            ?: return NetworkResult.Error("Sesi login tidak ditemukan")
        val response = SupabaseRest.httpClient.get("${SupabaseRest.baseUrl}/rest/v1/tracer_study?select=*&alumni_id=eq.$alumniId") {
            SupabaseRest.run { supabaseHeaders(token) }
        }
        SupabaseRest.parseResponse(response) { body ->
            SupabaseRest.json.decodeFromString(ListSerializer(TracerStudy.serializer()), body).firstOrNull()
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    suspend fun saveDraft(tracerStudy: TracerStudy): NetworkResult<TracerStudy> =
        upsert(tracerStudy.copy(isSubmitted = false, submittedAt = null))

    suspend fun submit(tracerStudy: TracerStudy): NetworkResult<TracerStudy> {
        return when (val status = ensureSubmissionOpen()) {
            is NetworkResult.Success -> upsert(tracerStudy.copy(isSubmitted = true, submittedAt = DateUtils.nowIso()))
            is NetworkResult.Error -> status
            NetworkResult.Loading -> NetworkResult.Loading
        }
    }

    suspend fun getAll(): NetworkResult<List<TracerStudy>> = runCatching {
        val token = sessionManager.getSession()?.accessToken
            ?: return NetworkResult.Error("Sesi login tidak ditemukan")
        val response = SupabaseRest.httpClient.get("${SupabaseRest.baseUrl}/rest/v1/tracer_study?select=*") {
            SupabaseRest.run { supabaseHeaders(token) }
        }
        SupabaseRest.parseResponse(response) { body ->
            SupabaseRest.json.decodeFromString(ListSerializer(TracerStudy.serializer()), body)
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    private suspend fun upsert(tracerStudy: TracerStudy): NetworkResult<TracerStudy> = runCatching {
        val token = sessionManager.getSession()?.accessToken
            ?: return NetworkResult.Error("Sesi login tidak ditemukan")
        val response = SupabaseRest.httpClient.post("${SupabaseRest.baseUrl}/rest/v1/tracer_study?on_conflict=alumni_id") {
            SupabaseRest.run { supabaseHeaders(token, "resolution=merge-duplicates,return=representation") }
            setBody(SupabaseRest.json.encodeToString(tracerStudy.toUpsert()))
        }
        SupabaseRest.parseResponse(response) { body ->
            SupabaseRest.json.decodeFromString(ListSerializer(TracerStudy.serializer()), body).first()
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    private suspend fun ensureSubmissionOpen(): NetworkResult<Unit> = runCatching {
        val token = sessionManager.getSession()?.accessToken
            ?: return NetworkResult.Error("Sesi login tidak ditemukan")
        val response = SupabaseRest.httpClient.get(
            "${SupabaseRest.baseUrl}/rest/v1/pengaturan_sistem?select=tracer_study_open&limit=1"
        ) {
            SupabaseRest.run { supabaseHeaders(token) }
        }
        when (val result = SupabaseRest.parseResponse(response) { body ->
            SupabaseRest.json.decodeFromString(ListSerializer(SystemSettings.serializer()), body).firstOrNull()
        }) {
            is NetworkResult.Success -> {
                if (result.data?.tracerStudyOpen == false) {
                    NetworkResult.Error("Pengisian tracer study sedang ditutup")
                } else {
                    NetworkResult.Success(Unit)
                }
            }
            is NetworkResult.Error -> NetworkResult.Error("Gagal memeriksa status pengisian, coba lagi")
            NetworkResult.Loading -> NetworkResult.Loading
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }
}

@Serializable
private data class SystemSettings(
    @SerialName("tracer_study_open") val tracerStudyOpen: Boolean = true
)
