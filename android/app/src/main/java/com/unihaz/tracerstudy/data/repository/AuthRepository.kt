package com.unihaz.tracerstudy.data.repository

import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.core.utils.UserMessages
import com.unihaz.tracerstudy.core.utils.toInstitutionEmail
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.AlumniRegisterPayload
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class AuthRepository(
    private val sessionManager: SessionManager,
    private val alumniRepository: AlumniRepository
) {
    suspend fun signInWithEmail(nim: String, password: String): NetworkResult<Unit> = runCatching {
        val response = SupabaseRest.httpClient.post("${SupabaseRest.baseUrl}/auth/v1/token?grant_type=password") {
            SupabaseRest.run { supabaseHeaders() }
            setBody(SupabaseRest.json.encodeToString(AuthLoginRequest(nim.toInstitutionEmail(), password)))
        }
        when (val authResult = SupabaseRest.parseResponse(response) { body ->
            SupabaseRest.json.decodeFromString<AuthResponse>(body)
        }) {
            is NetworkResult.Success -> {
                val auth = authResult.data
                val accessToken = auth.accessToken
                    ?: return@runCatching NetworkResult.Error("Sesi login tidak valid, silakan masuk ulang")
                val userId = auth.user?.id
                    ?: return@runCatching NetworkResult.Error("Profil pengguna tidak ditemukan")
                when (val profile = alumniRepository.getProfile(userId, accessToken)) {
                    is NetworkResult.Success -> {
                        sessionManager.saveSession(accessToken, auth.refreshToken, userId)
                        NetworkResult.Success(Unit)
                    }
                    is NetworkResult.Error -> NetworkResult.Error(
                        UserMessages.PROFILE_NOT_AVAILABLE,
                        profile.code
                    )
                    NetworkResult.Loading -> NetworkResult.Loading
                }
            }
            is NetworkResult.Error -> authResult
            NetworkResult.Loading -> NetworkResult.Loading
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    suspend fun signUp(
        nim: String,
        password: String,
        alumniData: AlumniRegisterPayload
    ): NetworkResult<Unit> = runCatching {
        val metadata = buildJsonObject {
            put("nim", alumniData.nim)
            put("nama_lengkap", alumniData.namaLengkap)
            put("prodi", alumniData.prodi)
            put("tahun_masuk", alumniData.tahunMasuk)
            put("tahun_lulus", alumniData.tahunLulus)
            put("email", alumniData.email)
        }
        val response = SupabaseRest.httpClient.post("${SupabaseRest.baseUrl}/auth/v1/signup") {
            SupabaseRest.run { supabaseHeaders() }
            setBody(
                SupabaseRest.json.encodeToString(
                    AuthSignupRequest(
                        email = nim.toInstitutionEmail(),
                        password = password,
                        data = metadata
                    )
                )
            )
        }
        SupabaseRest.responseToUnit(response)
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    suspend fun signOut(): NetworkResult<Unit> = runCatching {
        val token = sessionManager.getSession()?.accessToken
        var remoteError: NetworkResult.Error? = null
        if (!token.isNullOrBlank()) {
            val response = SupabaseRest.httpClient.post("${SupabaseRest.baseUrl}/auth/v1/logout") {
                SupabaseRest.run { supabaseHeaders(token) }
            }
            remoteError = SupabaseRest.responseToUnit(response) as? NetworkResult.Error
        }
        sessionManager.clearSession()
        remoteError ?: NetworkResult.Success(Unit)
    }.getOrElse {
        sessionManager.clearSession()
        SupabaseRest.mapThrowable(it)
    }

    suspend fun resetPassword(nim: String): NetworkResult<Unit> = runCatching {
        val response = SupabaseRest.httpClient.post("${SupabaseRest.baseUrl}/auth/v1/recover") {
            SupabaseRest.run { supabaseHeaders() }
            setBody(SupabaseRest.json.encodeToString(ResetPasswordRequest(nim.toInstitutionEmail())))
        }
        SupabaseRest.responseToUnit(response)
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    suspend fun hasValidSession(): Boolean = runCatching {
        val session = sessionManager.getSession() ?: return@runCatching false
        val response = SupabaseRest.httpClient.get("${SupabaseRest.baseUrl}/auth/v1/user") {
            SupabaseRest.run { supabaseHeaders(session.accessToken) }
        }
        when {
            response.status.value in 200..299 -> syncProfileSession(
                accessToken = session.accessToken,
                refreshToken = session.refreshToken,
                userId = session.alumniId
            )
            response.status.value == 401 || response.status.value == 403 -> refreshSession(session.refreshToken)
            else -> true
        }
    }.getOrElse {
        true
    }

    fun getCurrentSession() = sessionManager.getSession()

    private suspend fun refreshSession(refreshToken: String?): Boolean {
        if (refreshToken.isNullOrBlank()) {
            sessionManager.clearSession()
            return false
        }
        val response = SupabaseRest.httpClient.post("${SupabaseRest.baseUrl}/auth/v1/token?grant_type=refresh_token") {
            SupabaseRest.run { supabaseHeaders() }
            setBody(SupabaseRest.json.encodeToString(AuthRefreshRequest(refreshToken)))
        }
        return when (val result = SupabaseRest.parseResponse(response) { body ->
            SupabaseRest.json.decodeFromString<AuthResponse>(body)
        }) {
            is NetworkResult.Success -> {
                val auth = result.data
                val accessToken = auth.accessToken
                val userId = auth.user?.id
                if (accessToken.isNullOrBlank() || userId.isNullOrBlank()) {
                    sessionManager.clearSession()
                    false
                } else {
                    syncProfileSession(accessToken, auth.refreshToken ?: refreshToken, userId)
                }
            }
            is NetworkResult.Error -> {
                sessionManager.clearSession()
                false
            }
            NetworkResult.Loading -> true
        }
    }

    private suspend fun syncProfileSession(accessToken: String, refreshToken: String?, userId: String): Boolean {
        return when (val profile = alumniRepository.getProfile(userId, accessToken)) {
            is NetworkResult.Success -> {
                sessionManager.saveSession(accessToken, refreshToken, userId)
                true
            }
            is NetworkResult.Error -> {
                if (profile.code == 401 || profile.code == 403) {
                    sessionManager.clearSession()
                    false
                } else {
                    true
                }
            }
            NetworkResult.Loading -> true
        }
    }

    companion object {
        fun nimToInstitutionEmail(nim: String): String = nim.toInstitutionEmail()
    }
}

@Serializable
private data class AuthLoginRequest(val email: String, val password: String)

@Serializable
private data class AuthSignupRequest(
    val email: String,
    val password: String,
    val data: kotlinx.serialization.json.JsonObject
)

@Serializable
private data class ResetPasswordRequest(val email: String)

@Serializable
private data class AuthRefreshRequest(@SerialName("refresh_token") val refreshToken: String)

@Serializable
private data class AuthUser(val id: String? = null, val email: String? = null)

@Serializable
private data class AuthResponse(
    @SerialName("access_token") val accessToken: String? = null,
    @SerialName("refresh_token") val refreshToken: String? = null,
    val user: AuthUser? = null
)
