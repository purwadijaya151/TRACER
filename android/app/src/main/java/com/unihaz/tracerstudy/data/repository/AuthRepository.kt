package com.unihaz.tracerstudy.data.repository

import com.unihaz.tracerstudy.BuildConfig
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.core.utils.UserMessages
import com.unihaz.tracerstudy.core.utils.toInstitutionEmail
import com.unihaz.tracerstudy.data.local.Session
import com.unihaz.tracerstudy.data.local.SessionManager
import com.unihaz.tracerstudy.data.model.Alumni
import com.unihaz.tracerstudy.data.model.AlumniRegisterPayload
import io.ktor.client.request.get
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import javax.net.ssl.SSLException

class AuthRepository private constructor(
    private val getSession: () -> Session?,
    private val saveSession: (String, String?, String) -> Unit,
    private val clearSession: () -> Unit,
    private val getProfile: suspend (String, String) -> NetworkResult<Alumni>,
    private val executePasswordUpdate: suspend (PasswordUpdateRequest) -> Result<Unit>
) {
    constructor(sessionManager: SessionManager, alumniRepository: AlumniRepository) : this(
        getSession = { sessionManager.getSession() },
        saveSession = sessionManager::saveSession,
        clearSession = sessionManager::clearSession,
        getProfile = alumniRepository::getProfile,
        executePasswordUpdate = ::executePasswordUpdateRequest
    )

    internal constructor(
        sessionProvider: () -> Session?,
        executePasswordUpdate: suspend (PasswordUpdateRequest) -> Result<Unit>
    ) : this(
        getSession = sessionProvider,
        saveSession = { _, _, _ -> },
        clearSession = {},
        getProfile = { _, _ -> NetworkResult.Error("Not used in test") },
        executePasswordUpdate = executePasswordUpdate
    )

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
                when (val profile = getProfile(userId, accessToken)) {
                    is NetworkResult.Success -> {
                        saveSession(accessToken, auth.refreshToken, userId)
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
        val token = getSession()?.accessToken
        var remoteError: NetworkResult.Error? = null
        if (!token.isNullOrBlank()) {
            val response = SupabaseRest.httpClient.post("${SupabaseRest.baseUrl}/auth/v1/logout") {
                SupabaseRest.run { supabaseHeaders(token) }
            }
            remoteError = SupabaseRest.responseToUnit(response) as? NetworkResult.Error
        }
        clearSession()
        remoteError ?: NetworkResult.Success(Unit)
    }.getOrElse {
        clearSession()
        SupabaseRest.mapThrowable(it)
    }

    suspend fun changePassword(currentPassword: String, newPassword: String): Result<Unit> {
        val session = getSession() ?: return changePasswordFailure("Sesi login tidak ditemukan")
        if (session.accessToken.isBlank()) {
            return changePasswordFailure("Sesi login tidak valid, silakan masuk ulang")
        }

        val request = buildPasswordUpdateRequest(
            accessToken = session.accessToken,
            currentPassword = currentPassword,
            newPassword = newPassword
        )

        return executePasswordUpdate(request).fold(
            onSuccess = { Result.success(Unit) },
            onFailure = { Result.failure(sanitizePasswordUpdateFailure(it)) }
        )
    }

    suspend fun resetPassword(nim: String, email: String): NetworkResult<Unit> = runCatching {
        val resetPasswordApiUrl = BuildConfig.RESET_PASSWORD_API_URL.trim()
        if (resetPasswordApiUrl.isBlank()) {
            return@runCatching NetworkResult.Error("Fitur reset password belum siap. Hubungi admin fakultas.")
        }

        val response = SupabaseRest.httpClient.post(resetPasswordApiUrl) {
            SupabaseRest.run { jsonHeaders() }
            setBody(SupabaseRest.json.encodeToString(ResetPasswordRequest(nim.trim(), email.trim())))
        }

        if (response.status.value in 200..299) {
            NetworkResult.Success(Unit)
        } else {
            NetworkResult.Error(parseResetPasswordError(response.bodyAsText()), response.status.value)
        }
    }.getOrElse { SupabaseRest.mapThrowable(it) }

    suspend fun hasValidSession(): Boolean = runCatching {
        val session = getSession() ?: return@runCatching false
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

    fun getCurrentSession() = getSession()

    private suspend fun refreshSession(refreshToken: String?): Boolean {
        if (refreshToken.isNullOrBlank()) {
            clearSession()
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
                    clearSession()
                    false
                } else {
                    syncProfileSession(accessToken, auth.refreshToken ?: refreshToken, userId)
                }
            }
            is NetworkResult.Error -> {
                clearSession()
                false
            }
            NetworkResult.Loading -> true
        }
    }

    private suspend fun syncProfileSession(accessToken: String, refreshToken: String?, userId: String): Boolean {
        return when (val profile = getProfile(userId, accessToken)) {
            is NetworkResult.Success -> {
                saveSession(accessToken, refreshToken, userId)
                true
            }
            is NetworkResult.Error -> {
                if (profile.code == 401 || profile.code == 403) {
                    clearSession()
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

        private fun parseResetPasswordError(body: String): String = runCatching {
            SupabaseRest.json.decodeFromString<ResetPasswordResponse>(body).message
        }.getOrNull()?.takeIf { it.isNotBlank() }
            ?: "Reset password belum dapat diproses. Coba beberapa saat lagi."

        private fun buildPasswordUpdateRequest(
            accessToken: String,
            currentPassword: String,
            newPassword: String
        ): PasswordUpdateRequest {
            val headers = linkedMapOf(
                "apikey" to BuildConfig.SUPABASE_ANON_KEY,
                HttpHeaders.Authorization to "Bearer $accessToken",
                HttpHeaders.Accept to ContentType.Application.Json.toString(),
                HttpHeaders.ContentType to ContentType.Application.Json.toString()
            )
            val body = SupabaseRest.json.encodeToString(
                ChangePasswordRequest(
                    password = newPassword,
                    currentPassword = currentPassword
                )
            )
            return PasswordUpdateRequest(
                method = "PUT",
                url = "${SupabaseRest.baseUrl}/auth/v1/user",
                headers = headers,
                body = body,
                accessToken = accessToken
            )
        }

        private suspend fun executePasswordUpdateRequest(request: PasswordUpdateRequest): Result<Unit> =
            runCatching {
                val response = SupabaseRest.httpClient.put(request.url) {
                    SupabaseRest.run { supabaseHeaders(request.accessToken) }
                    setBody(request.body)
                }
                when (response.status.value) {
                    in 200..299 -> Unit
                    else -> throw PasswordUpdateRequestException(
                        code = response.status.value,
                        detail = response.bodyAsText()
                    )
                }
            }

        private fun sanitizePasswordUpdateFailure(throwable: Throwable): Throwable {
            val message = when (throwable) {
                is PasswordUpdateRequestException -> when (throwable.code) {
                    401, 403 -> "Sesi login tidak valid, silakan masuk ulang"
                    422 -> if (isCurrentPasswordFailure(throwable.detail)) {
                        "Password saat ini salah"
                    } else {
                        "Password baru tidak valid"
                    }
                    else -> "Terjadi kesalahan, silakan coba beberapa saat lagi"
                }
                is SSLException,
                is UnknownHostException,
                is SocketTimeoutException,
                is IOException -> SupabaseRest.mapThrowable(throwable).message
                else -> "Terjadi kesalahan, silakan coba beberapa saat lagi"
            }
            return IllegalStateException(message)
        }

        private fun isCurrentPasswordFailure(detail: String): Boolean {
            if (detail.isBlank()) {
                return false
            }

            val normalized = detail.lowercase()
            val mentionsCurrentPassword = normalized.contains("current_password") ||
                normalized.contains("current password") ||
                normalized.contains("currentpassword")
            val indicatesMismatchOrRequired = normalized.contains("mismatch") ||
                normalized.contains("required") ||
                normalized.contains("invalid") ||
                normalized.contains("wrong") ||
                normalized.contains("incorrect") ||
                normalized.contains("must")

            return mentionsCurrentPassword && indicatesMismatchOrRequired
        }

        private fun changePasswordFailure(message: String): Result<Unit> =
            Result.failure(IllegalStateException(message))
    }
}

internal data class PasswordUpdateRequest(
    val method: String,
    val url: String,
    val headers: Map<String, String>,
    val body: String,
    val accessToken: String
)

internal class PasswordUpdateRequestException(
    val code: Int,
    val detail: String = ""
) : RuntimeException()

@Serializable
private data class AuthLoginRequest(val email: String, val password: String)

@Serializable
private data class AuthSignupRequest(
    val email: String,
    val password: String,
    val data: kotlinx.serialization.json.JsonObject
)

@Serializable
private data class ResetPasswordRequest(val nim: String, val email: String)

@Serializable
private data class ResetPasswordResponse(val message: String = "")

@Serializable
private data class ChangePasswordRequest(
    val password: String,
    @SerialName("current_password") val currentPassword: String
)

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
