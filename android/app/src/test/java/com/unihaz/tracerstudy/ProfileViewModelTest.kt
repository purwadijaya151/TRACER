package com.unihaz.tracerstudy

import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import com.unihaz.tracerstudy.R
import com.unihaz.tracerstudy.core.network.NetworkResult
import com.unihaz.tracerstudy.presentation.profile.ProfileViewModel
import java.io.IOException
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.TestDispatcher
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.runCurrent
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Rule
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ProfileViewModelTest {
    @get:Rule val instantTaskExecutorRule = InstantTaskExecutorRule()
    private val testDispatcher: TestDispatcher = StandardTestDispatcher()
    @get:Rule val mainDispatcherRule = MainDispatcherRule(testDispatcher)

    @Test
    fun changePassword_validatesInputsInRequiredOrder() {
        val cases = listOf(
            ValidationCase("", "123", "", R.string.profile_password_current_required),
            ValidationCase("current123", "", "", R.string.profile_password_new_required),
            ValidationCase("current123", "123", "123", R.string.profile_password_min_length),
            ValidationCase("current123", "newpass", "", R.string.profile_password_confirm_required),
            ValidationCase("current123", "newpass", "otherpass", R.string.profile_password_mismatch),
            ValidationCase("samepass", "samepass", "samepass", R.string.profile_password_same_as_current)
        )

        cases.forEach { testCase ->
            var callCount = 0
            val viewModel = ProfileViewModel(changePasswordAction = { _, _ ->
                callCount += 1
                Result.success(Unit)
            })

            viewModel.changePassword(testCase.currentPassword, testCase.newPassword, testCase.confirmPassword)

            assertEquals(testCase.expectedErrorResId, viewModel.state.value?.passwordErrorResId)
            assertEquals(null, viewModel.state.value?.passwordMessageResId)
            assertFalse(viewModel.state.value?.isChangingPassword ?: true)
            assertEquals(0, callCount)
        }
    }

    @Test
    fun changePassword_showsLoadingThenSuccessWithoutLogout() = runTest(testDispatcher.scheduler) {
        val completion = CompletableDeferred<Result<Unit>>()
        var signOutCalls = 0
        val viewModel = ProfileViewModel(
            changePasswordAction = { _, _ -> completion.await() },
            signOutAction = {
                signOutCalls += 1
                NetworkResult.Success(Unit)
            }
        )

        viewModel.changePassword("current123", "newpass1", "newpass1")
        runCurrent()

        assertEquals(true, viewModel.state.value?.isChangingPassword)
        assertEquals(null, viewModel.state.value?.passwordErrorResId)
        assertEquals(null, viewModel.state.value?.passwordMessageResId)

        completion.complete(Result.success(Unit))
        advanceUntilIdle()

        assertFalse(viewModel.state.value?.isChangingPassword ?: true)
        assertEquals(R.string.profile_password_success, viewModel.state.value?.passwordMessageResId)
        assertEquals(null, viewModel.state.value?.passwordErrorResId)
        assertFalse(viewModel.state.value?.loggedOut ?: true)
        assertEquals(0, signOutCalls)
    }

    @Test
    fun changePassword_mapsWrongCurrentFailureToSafeResource() = runTest(testDispatcher.scheduler) {
        val viewModel = ProfileViewModel(changePasswordAction = { _, _ ->
            Result.failure(IllegalStateException("Password saat ini salah"))
        })

        viewModel.changePassword("current123", "newpass1", "newpass1")
        advanceUntilIdle()

        assertFalse(viewModel.state.value?.isChangingPassword ?: true)
        assertEquals(R.string.profile_password_wrong_current, viewModel.state.value?.passwordErrorResId)
        assertEquals(null, viewModel.state.value?.passwordMessageResId)
    }

    @Test
    fun changePassword_mapsSessionFailureToSafeResource() = runTest(testDispatcher.scheduler) {
        val viewModel = ProfileViewModel(changePasswordAction = { _, _ ->
            Result.failure(IllegalStateException("Sesi login tidak valid, silakan masuk ulang"))
        })

        viewModel.changePassword("current123", "newpass1", "newpass1")
        advanceUntilIdle()

        assertFalse(viewModel.state.value?.isChangingPassword ?: true)
        assertEquals(R.string.profile_password_session_expired, viewModel.state.value?.passwordErrorResId)
        assertEquals(null, viewModel.state.value?.passwordMessageResId)
    }

    @Test
    fun changePassword_mapsGenericFailureToSafeResource() = runTest(testDispatcher.scheduler) {
        val viewModel = ProfileViewModel(changePasswordAction = { _, _ ->
            Result.failure(IOException("timeout while updating password"))
        })

        viewModel.changePassword("current123", "newpass1", "newpass1")
        advanceUntilIdle()

        assertFalse(viewModel.state.value?.isChangingPassword ?: true)
        assertEquals(R.string.profile_password_generic_error, viewModel.state.value?.passwordErrorResId)
        assertEquals(null, viewModel.state.value?.passwordMessageResId)
    }
}

private data class ValidationCase(
    val currentPassword: String,
    val newPassword: String,
    val confirmPassword: String,
    val expectedErrorResId: Int
)
