package com.unihaz.tracerstudy

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.presentation.auth.login.LoginViewModel
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class LoginViewModelTest {
    @get:Rule val instantTaskExecutorRule = InstantTaskExecutorRule()
    private val testDispatcher: TestDispatcher = StandardTestDispatcher()
    @get:Rule val mainDispatcherRule = MainDispatcherRule(testDispatcher)

    @Test
    fun resetPasswordRejectsInvalidNimBeforeUseCase() {
        var callCount = 0
        val viewModel = LoginViewModel(resetPasswordAction = { _, _ ->
            callCount += 1
            NetworkResult.Success(Unit)
        })

        viewModel.resetPassword("abc", "alumni@example.com")

        assertEquals(R.string.login_reset_password_nim_invalid, viewModel.state.value?.resetPasswordErrorResId)
        assertNull(viewModel.state.value?.resetPasswordEmailErrorResId)
        assertNull(viewModel.state.value?.resetPasswordMessageResId)
        assertFalse(viewModel.state.value?.resettingPassword ?: true)
        assertEquals(0, callCount)
    }

    @Test
    fun resetPasswordRejectsInvalidEmailBeforeUseCase() {
        var callCount = 0
        val viewModel = LoginViewModel(resetPasswordAction = { _, _ ->
            callCount += 1
            NetworkResult.Success(Unit)
        })

        viewModel.resetPassword("2019.01.0023", "email-salah")

        assertNull(viewModel.state.value?.resetPasswordErrorResId)
        assertEquals(R.string.login_reset_password_email_invalid, viewModel.state.value?.resetPasswordEmailErrorResId)
        assertNull(viewModel.state.value?.resetPasswordMessageResId)
        assertFalse(viewModel.state.value?.resettingPassword ?: true)
        assertEquals(0, callCount)
    }

    @Test
    fun resetPasswordShowsLoadingThenSuccessResource() = runTest(testDispatcher.scheduler) {
        val completion = CompletableDeferred<NetworkResult<Unit>>()
        var requestedNim: String? = null
        var requestedEmail: String? = null
        val viewModel = LoginViewModel(resetPasswordAction = { nim, email ->
            requestedNim = nim
            requestedEmail = email
            completion.await()
        })

        viewModel.resetPassword("2019.01.0023", "alumni@example.com")
        runCurrent()

        assertTrue(viewModel.state.value?.resettingPassword == true)
        assertNull(viewModel.state.value?.resetPasswordErrorResId)
        assertNull(viewModel.state.value?.resetPasswordEmailErrorResId)
        assertNull(viewModel.state.value?.resetPasswordMessageResId)

        completion.complete(NetworkResult.Success(Unit))
        advanceUntilIdle()

        assertEquals("2019.01.0023", requestedNim)
        assertEquals("alumni@example.com", requestedEmail)
        assertFalse(viewModel.state.value?.resettingPassword ?: true)
        assertEquals(R.string.login_reset_password_success, viewModel.state.value?.resetPasswordMessageResId)
        assertNull(viewModel.state.value?.resetPasswordErrorResId)
    }

    @Test
    fun resetPasswordKeepsSafeRepositoryError() = runTest(testDispatcher.scheduler) {
        val viewModel = LoginViewModel(resetPasswordAction = { _, _ ->
            NetworkResult.Error("Tidak ada koneksi internet, coba lagi")
        })

        viewModel.resetPassword("2019.01.0023", "alumni@example.com")
        advanceUntilIdle()

        assertFalse(viewModel.state.value?.resettingPassword ?: true)
        assertEquals("Tidak ada koneksi internet, coba lagi", viewModel.state.value?.error)
        assertNull(viewModel.state.value?.resetPasswordMessageResId)
    }

    @Test
    fun clearFeedbackClearsResetPasswordEvents() {
        val viewModel = LoginViewModel(resetPasswordAction = { _, _ -> NetworkResult.Success(Unit) })
        viewModel.resetPassword("abc", "alumni@example.com")

        viewModel.clearFeedback()

        assertNull(viewModel.state.value?.error)
        assertNull(viewModel.state.value?.message)
        assertNull(viewModel.state.value?.resetPasswordErrorResId)
        assertNull(viewModel.state.value?.resetPasswordEmailErrorResId)
        assertNull(viewModel.state.value?.resetPasswordMessageResId)
    }
}
