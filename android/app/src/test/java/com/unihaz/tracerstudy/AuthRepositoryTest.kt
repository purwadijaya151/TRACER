package com.unihaz.tracerstudy

import com.unihaz.tracerstudy.data.local.Session
import com.unihaz.tracerstudy.data.repository.AuthRepository
import com.unihaz.tracerstudy.data.repository.PasswordUpdateRequest
import com.unihaz.tracerstudy.data.repository.PasswordUpdateRequestException
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.IOException

class AuthRepositoryTest {
    @Test
    fun mapsNimToInstitutionEmail() {
        assertEquals(
            "2019.01.0023@ft.unihaz.ac.id",
            AuthRepository.nimToInstitutionEmail("2019.01.0023")
        )
    }

    @Test
    fun changePasswordBuildsAuthenticatedPutUserRequest() = runTest {
        var capturedRequest: PasswordUpdateRequest? = null
        val repository = AuthRepository(
            sessionProvider = {
                Session(
                    accessToken = "access-token-123",
                    refreshToken = "refresh-token-456",
                    alumniId = "alumni-id"
                )
            },
            executePasswordUpdate = { request ->
                capturedRequest = request
                Result.success(Unit)
            }
        )

        val result = repository.changePassword(
            currentPassword = "current-password",
            newPassword = "new-password"
        )

        val request = requireNotNull(capturedRequest)
        val requestBody = Json.parseToJsonElement(request.body).jsonObject
        assertTrue(result.isSuccess)
        assertEquals("PUT", request.method)
        assertTrue(request.url.endsWith("/auth/v1/user"))
        assertEquals("Bearer access-token-123", request.headers["Authorization"])
        assertNotNull(request.headers["apikey"])
        assertEquals("application/json", request.headers["Accept"])
        assertEquals("application/json", request.headers["Content-Type"])
        assertEquals(2, requestBody.size)
        assertTrue(request.body.contains("\"password\":\"new-password\""))
        assertTrue(request.body.contains("\"current_password\":\"current-password\""))
        assertFalse(request.body.contains("confirm_password"))
        assertFalse(request.body.contains("confirmation_password"))
        assertFalse(request.body.contains("refresh_token"))
        assertFalse(request.body.contains("access_token"))
        assertFalse(request.body.contains("nim"))
        assertFalse(request.body.contains("email"))
        assertFalse(request.body.contains("alumni_id"))
        assertFalse(request.body.contains("foto"))
        assertFalse(request.body.contains("photo"))
        assertFalse(request.body.contains("no_hp"))
    }

    @Test
    fun changePasswordFailsWhenSessionMissing() = runTest {
        val repository = AuthRepository(
            sessionProvider = { null },
            executePasswordUpdate = { Result.success(Unit) }
        )

        val result = repository.changePassword("current-password", "new-password")

        assertTrue(result.isFailure)
        assertEquals("Sesi login tidak ditemukan", result.exceptionOrNull()?.message)
    }

    @Test
    fun changePasswordSanitizesUnauthorizedFailure() = runTest {
        val repository = buildRepositoryFailure(PasswordUpdateRequestException(401))

        val result = repository.changePassword("current-password", "new-password")

        assertTrue(result.isFailure)
        assertEquals("Sesi login tidak valid, silakan masuk ulang", result.exceptionOrNull()?.message)
        assertMessageHasNoSecrets(result.exceptionOrNull()?.message)
    }

    @Test
    fun changePasswordSanitizesWrongCurrentPasswordFailure() = runTest {
        val repository = buildRepositoryFailure(
            PasswordUpdateRequestException(422, "{\"message\":\"current_password is required\"}")
        )

        val result = repository.changePassword("current-password", "new-password")

        assertTrue(result.isFailure)
        assertEquals("Password saat ini salah", result.exceptionOrNull()?.message)
        assertMessageHasNoSecrets(result.exceptionOrNull()?.message)
    }

    @Test
    fun changePasswordSanitizesNonCurrentPasswordValidationFailure() = runTest {
        val repository = buildRepositoryFailure(
            PasswordUpdateRequestException(422, "{\"message\":\"Password should be at least 6 characters\"}")
        )

        val result = repository.changePassword("current-password", "new-password")

        assertTrue(result.isFailure)
        assertEquals("Password baru tidak valid", result.exceptionOrNull()?.message)
        assertMessageHasNoSecrets(result.exceptionOrNull()?.message)
    }

    @Test
    fun changePasswordSanitizesNetworkFailure() = runTest {
        val repository = buildRepositoryFailure(IOException("access-token-123 current-password new-password"))

        val result = repository.changePassword("current-password", "new-password")

        assertTrue(result.isFailure)
        assertEquals("Tidak ada koneksi internet, coba lagi", result.exceptionOrNull()?.message)
        assertMessageHasNoSecrets(result.exceptionOrNull()?.message)
    }

    private fun buildRepositoryFailure(throwable: Throwable): AuthRepository = AuthRepository(
        sessionProvider = {
            Session(
                accessToken = "access-token-123",
                refreshToken = "refresh-token-456",
                alumniId = "alumni-id"
            )
        },
        executePasswordUpdate = { Result.failure(throwable) }
    )

    private fun assertMessageHasNoSecrets(message: String?) {
        val nonNullMessage = requireNotNull(message)
        assertFalse(nonNullMessage.contains("current-password"))
        assertFalse(nonNullMessage.contains("new-password"))
        assertFalse(nonNullMessage.contains("access-token"))
        assertFalse(nonNullMessage.contains("refresh-token"))
    }
}
